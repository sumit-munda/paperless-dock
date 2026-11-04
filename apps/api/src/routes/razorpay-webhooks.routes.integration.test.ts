import { createHmac, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import prisma from "../prisma.js";
import app from "../app.js";

const testWebhookSecret = "integration-test-webhook-secret";
const previousWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

describe("Razorpay webhook integration tests", () => {
  let userId: string;
  let bookId: string;
  let email: string;
  let password: string;

  const createdEventIds: string[] = [];

  beforeAll(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = testWebhookSecret;

    password = "WebhookPassword123!";
    email = `webhook-${randomUUID()}@example.com`;

    const passwordHash = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        name: "Webhook Test User",
        email,
        passwordHash,
      },
    });

    userId = user.id;

    bookId = randomUUID();

    await prisma.book.create({
      data: {
        id: bookId,
        title: "Webhook Test Book",
        slug: `webhook-test-book-${bookId}`,
        description: "Temporary book for webhook integration tests.",
        price: "299.00",
        currency: "INR",
        status: "PUBLISHED",
      },
    });
  });

  async function clearTestData() {
    await prisma.paymentWebhookEvent.deleteMany({
      where: {
        provider: "RAZORPAY",
        providerEventId: {
          in: createdEventIds,
        },
      },
    });

    createdEventIds.length = 0;

    await prisma.libraryItem.deleteMany({
      where: { userId },
    });

    await prisma.order.deleteMany({
      where: { userId },
    });

    await prisma.cart.deleteMany({
      where: { userId },
    });
  }

  afterAll(async () => {
    if (userId) {
      await clearTestData();

      await prisma.user.deleteMany({
        where: { id: userId },
      });
    }

    if (bookId) {
      await prisma.book.deleteMany({
        where: { id: bookId },
      });
    }

    if (previousWebhookSecret === undefined) {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
    } else {
      process.env.RAZORPAY_WEBHOOK_SECRET = previousWebhookSecret;
    }

    await prisma.$disconnect();
  });

  async function createTestOrder() {
    return prisma.order.create({
      data: {
        userId,
        subtotal: "299.00",
        currency: "INR",
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: {
            bookId,
            titleSnapshot: "Webhook Test Book",
            priceSnapshot: "299.00",
            quantity: 1,
          },
        },
      },
    });
  }

  async function createTestPaymentAttempt(orderId: string) {
    const providerOrderId = `order_${randomUUID().replaceAll("-", "")}`;
    const paymentId = `pay_${randomUUID().replaceAll("-", "")}`;

    const attempt = await prisma.paymentAttempt.create({
      data: {
        orderId,
        provider: "RAZORPAY",
        providerOrderId,
        amount: "299.00",
        currency: "INR",
        status: "CREATED",
      },
    });

    return {
      attempt,
      providerOrderId,
      paymentId,
    };
  }

  function createWebhookSignature(rawBody: Buffer) {
    return createHmac("sha256", testWebhookSecret)
      .update(rawBody)
      .digest("hex");
  }

  async function sendWebhook(
    event: Record<string, unknown>,
    eventId = `evt_${randomUUID().replaceAll("-", "")}`,
    signatureOverride?: string,
  ) {
    createdEventIds.push(eventId);

    const rawBody = Buffer.from(JSON.stringify(event), "utf8");

    const signature = signatureOverride ?? createWebhookSignature(rawBody);

    const response = await request(app)
      .post("/api/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .set("X-Razorpay-Signature", signature)
      .set("x-razorpay-event-id", eventId)
      .send(rawBody.toString("utf8"));

    return response;
  }

  function createPaymentEvent(
    eventType: string,
    paymentId: string,
    providerOrderId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      entity: "event",
      event: eventType,
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: providerOrderId,
            amount: 29900,
            currency: "INR",
            status:
              eventType === "payment.captured"
                ? "captured"
                : eventType === "payment.authorized"
                  ? "authorized"
                  : "failed",
            ...overrides,
          },
        },
      },
    };
  }

  // --------------------------------------------------
  // Webhook signature tests
  // --------------------------------------------------

  it("rejects a webhook with an invalid signature", async () => {
    await clearTestData();

    const event = {
      entity: "event",
      event: "payment.captured",
    };

    const response = await sendWebhook(event, undefined, "0".repeat(64));

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Invalid webhook signature.");

    expect(
      await prisma.paymentWebhookEvent.count({
        where: { provider: "RAZORPAY" },
      }),
    ).toBe(0);
  });

  // --------------------------------------------------
  // Successful payment tests
  // --------------------------------------------------

  it("processes a captured payment and grants library access", async () => {
    await clearTestData();

    const order = await createTestOrder();

    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    const event = createPaymentEvent(
      "payment.captured",
      paymentId,
      providerOrderId,
    );

    const response = await sendWebhook(event);

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Webhook processed successfully.");

    const updatedAttempt = await prisma.paymentAttempt.findUnique({
      where: { id: attempt.id },
    });

    expect(updatedAttempt).toMatchObject({
      status: "CAPTURED",
      providerPaymentId: paymentId,
    });

    expect(updatedAttempt?.capturedAt).not.toBeNull();

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder).toMatchObject({
      status: "COMPLETED",
      paymentStatus: "PAID",
    });

    const libraryItems = await prisma.libraryItem.findMany({
      where: {
        userId,
        orderId: order.id,
      },
    });

    expect(libraryItems).toHaveLength(1);
    expect(libraryItems[0]?.bookId).toBe(bookId);

    const webhookEvent = await prisma.paymentWebhookEvent.findFirst({
      where: {
        provider: "RAZORPAY",
        providerEventId: {
          in: createdEventIds,
        },
      },
    });

    expect(webhookEvent).toMatchObject({
      eventType: "payment.captured",
      status: "PROCESSED",
    });

    expect(webhookEvent?.processedAt).not.toBeNull();
  });

  it("does not create duplicate library items for a duplicate event ID", async () => {
    await clearTestData();

    const order = await createTestOrder();

    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    const event = createPaymentEvent(
      "payment.captured",
      paymentId,
      providerOrderId,
    );

    const eventId = `evt_${randomUUID().replaceAll("-", "")}`;

    const firstResponse = await sendWebhook(event, eventId);

    expect(firstResponse.status).toBe(200);

    const secondResponse = await sendWebhook(event, eventId);

    expect(secondResponse.status).toBe(200);

    expect(
      await prisma.paymentWebhookEvent.count({
        where: {
          provider: "RAZORPAY",
          providerEventId: eventId,
        },
      }),
    ).toBe(1);

    expect(
      await prisma.libraryItem.count({
        where: {
          userId,
          orderId: order.id,
        },
      }),
    ).toBe(1);
  });

  // --------------------------------------------------
  // Non-captured payment tests
  // --------------------------------------------------

  it("does not grant access for an authorized payment event", async () => {
    await clearTestData();

    const order = await createTestOrder();

    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    const event = createPaymentEvent(
      "payment.authorized",
      paymentId,
      providerOrderId,
    );

    const response = await sendWebhook(event);

    expect(response.status).toBe(200);

    const updatedAttempt = await prisma.paymentAttempt.findUnique({
      where: { id: attempt.id },
    });

    expect(updatedAttempt?.status).toBe("CREATED");

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder).toMatchObject({
      status: "PENDING",
      paymentStatus: "PENDING",
    });

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  it("does not grant access for a failed payment event", async () => {
    await clearTestData();

    const order = await createTestOrder();

    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    const event = createPaymentEvent(
      "payment.failed",
      paymentId,
      providerOrderId,
    );

    const response = await sendWebhook(event);

    expect(response.status).toBe(200);

    const updatedAttempt = await prisma.paymentAttempt.findUnique({
      where: { id: attempt.id },
    });

    expect(updatedAttempt?.status).toBe("CREATED");

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder).toMatchObject({
      status: "PENDING",
      paymentStatus: "PENDING",
    });

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  // --------------------------------------------------
  // Payment validation tests
  // --------------------------------------------------

  it("rejects a captured payment with an incorrect amount", async () => {
    await clearTestData();

    const order = await createTestOrder();

    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    const event = createPaymentEvent(
      "payment.captured",
      paymentId,
      providerOrderId,
      {
        amount: 100,
      },
    );

    const response = await sendWebhook(event);

    expect(response.status).toBe(500);

    expect(response.body.message).toBe(
      "Webhook processing failed. Please retry.",
    );

    const updatedAttempt = await prisma.paymentAttempt.findUnique({
      where: { id: attempt.id },
    });

    expect(updatedAttempt?.status).toBe("CREATED");

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(updatedOrder).toMatchObject({
      status: "PENDING",
      paymentStatus: "PENDING",
    });

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);

    const webhookEvent = await prisma.paymentWebhookEvent.findFirst({
      where: {
        providerEventId: {
          in: createdEventIds,
        },
      },
    });

    expect(webhookEvent?.status).toBe("FAILED");
  });

  // --------------------------------------------------
  // Unknown event tests
  // --------------------------------------------------

  it("records unknown event types without granting library access", async () => {
    await clearTestData();

    const event = {
      entity: "event",
      event: "some.future.event",
      payload: {},
    };

    const response = await sendWebhook(event);

    expect(response.status).toBe(200);

    const webhookEvent = await prisma.paymentWebhookEvent.findFirst({
      where: {
        providerEventId: {
          in: createdEventIds,
        },
      },
    });

    expect(webhookEvent).toMatchObject({
      eventType: "some.future.event",
      status: "PROCESSED",
    });

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });
});