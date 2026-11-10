import { createHmac, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  orderRateLimiter,
  paymentOrderRateLimiter,
  paymentVerificationRateLimiter,
} from "./orders.routes.js";

const mocks = vi.hoisted(() => ({
  createRazorpayOrder: vi.fn(),
  fetchRazorpayPayment: vi.fn(),
}));

vi.mock("../razorpay.js", () => ({
  getRazorpayClient: () => ({
    orders: {
      create: mocks.createRazorpayOrder,
    },
    payments: {
      fetch: mocks.fetchRazorpayPayment,
    },
  }),
  getRazorpayKeyId: () => "rzp_test_public_key",
}));

import prisma from "../prisma.js";
import app from "../app.js";

const testRazorpaySecret = "integration-test-razorpay-secret";
const previousRazorpaySecret = process.env.RAZORPAY_KEY_SECRET;

describe("Payment API integration tests", () => {
  let userId: string;
  let anotherUserId: string;
  let bookId: string;

  let email: string;
  let anotherEmail: string;
  let password: string;

  beforeAll(async () => {
    process.env.RAZORPAY_KEY_SECRET = testRazorpaySecret;

    password = "PaymentPassword123!";

    email = `payment-${randomUUID()}@example.com`;
    anotherEmail = `another-payment-${randomUUID()}@example.com`;

    const passwordHash = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        name: "Payment Test User",
        email,
        passwordHash,
      },
    });

    userId = user.id;

    const anotherUser = await prisma.user.create({
      data: {
        name: "Another Payment Test User",
        email: anotherEmail,
        passwordHash,
      },
    });

    anotherUserId = anotherUser.id;

    bookId = randomUUID();

    await prisma.book.create({
      data: {
        id: bookId,
        title: "Payment Test Book",
        slug: `payment-test-book-${bookId}`,
        description: "Temporary book for payment API tests.",
        price: "299.00",
        currency: "INR",
        status: "PUBLISHED",
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();

    orderRateLimiter.resetKey(userId);
    orderRateLimiter.resetKey(anotherUserId);

    paymentOrderRateLimiter.resetKey(userId);
    paymentOrderRateLimiter.resetKey(anotherUserId);

    paymentVerificationRateLimiter.resetKey(userId);
    paymentVerificationRateLimiter.resetKey(anotherUserId);

    mocks.fetchRazorpayPayment.mockReset();

    mocks.createRazorpayOrder.mockResolvedValue({
      id: `order_${randomUUID().replaceAll("-", "")}`,
      amount: 29900,
      currency: "INR",
      status: "created",
    });
  });

  async function clearTestData() {
    await prisma.order.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });

    await prisma.libraryItem.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });
  }

  afterAll(async () => {
    if (userId && anotherUserId) {
      await clearTestData();

      await prisma.user.deleteMany({
        where: {
          id: {
            in: [userId, anotherUserId],
          },
        },
      });
    }

    if (bookId) {
      await prisma.book.deleteMany({
        where: { id: bookId },
      });
    }

    if (previousRazorpaySecret === undefined) {
      delete process.env.RAZORPAY_KEY_SECRET;
    } else {
      process.env.RAZORPAY_KEY_SECRET = previousRazorpaySecret;
    }

    await prisma.$disconnect();
  });

  async function login(userEmail: string) {
    const agent = request.agent(app);

    const initialCsrfResponse = await agent.get("/api/auth/csrf-token");
    expect(initialCsrfResponse.status).toBe(200);

    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", initialCsrfResponse.body.csrfToken)
      .send({
        email: userEmail,
        password,
      });

    expect(loginResponse.status).toBe(200);

    const csrfResponse = await agent.get("/api/auth/csrf-token");
    expect(csrfResponse.status).toBe(200);

    return {
      agent,
      csrfToken: csrfResponse.body.csrfToken as string,
    };
  }

  async function createTestOrder(
    ownerId: string,
    currency = "INR",
    status = "PENDING",
    paymentStatus = "PENDING",
  ) {
    return prisma.order.create({
      data: {
        userId: ownerId,
        subtotal: "299.00",
        currency,
        status: status as "PENDING" | "COMPLETED" | "CANCELLED",
        paymentStatus: paymentStatus as "PENDING" | "PAID" | "FAILED",
        items: {
          create: {
            bookId,
            titleSnapshot: "Payment Test Book",
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

  function createSignature(orderId: string, paymentId: string) {
    return createHmac("sha256", testRazorpaySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
  }

  function mockCapturedPayment(
    paymentId: string,
    providerOrderId: string,
    overrides: Record<string, unknown> = {},
  ) {
    mocks.fetchRazorpayPayment.mockResolvedValue({
      id: paymentId,
      order_id: providerOrderId,
      amount: 29900,
      currency: "INR",
      status: "captured",
      ...overrides,
    });
  }

  // --------------------------------------------------
  // Payment order creation tests
  // --------------------------------------------------

  it("rejects payment creation when the user is not authenticated", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const response = await request(app)
      .post(`/api/orders/${order.id}/payment`)
      .send();

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      message: "Invalid or missing CSRF token.",
    });

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("creates a Razorpay order for an authenticated user's pending order", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("Payment order created successfully.");

    expect(response.body.payment).toMatchObject({
      keyId: "rzp_test_public_key",
      amount: 29900,
      currency: "INR",
      internalOrderId: order.id,
    });

    expect(response.body.payment.razorpayOrderId).toMatch(/^order_/);

    expect(mocks.createRazorpayOrder).toHaveBeenCalledTimes(1);

    const razorpayRequest = mocks.createRazorpayOrder.mock.calls[0]?.[0];

    expect(razorpayRequest).toMatchObject({
      amount: 29900,
      currency: "INR",
      notes: {
        internalOrderId: order.id,
      },
    });

    expect(razorpayRequest.receipt).toMatch(/^pd_/);
    expect(razorpayRequest.receipt.length).toBeLessThanOrEqual(40);

    const paymentAttempt = await prisma.paymentAttempt.findFirst({
      where: {
        orderId: order.id,
      },
    });

    expect(paymentAttempt).toMatchObject({
      orderId: order.id,
      provider: "RAZORPAY",
      providerOrderId: response.body.payment.razorpayOrderId,
      currency: "INR",
      status: "CREATED",
    });

    expect(Number(paymentAttempt?.amount)).toBe(299);

    const libraryItems = await prisma.libraryItem.count({
      where: { userId },
    });

    expect(libraryItems).toBe(0);
  });

  it("does not allow a user to initiate payment for another user's order", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const { agent, csrfToken } = await login(anotherEmail);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Order not found.",
    });

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("returns 404 when the order does not exist", async () => {
    await clearTestData();

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${randomUUID()}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Order not found.",
    });

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("rejects payment for an order that is already completed and paid", async () => {
    await clearTestData();

    const order = await createTestOrder(userId, "INR", "COMPLETED", "PAID");

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(409);

    expect(response.body.message).toBe(
      "This order is not available for payment.",
    );

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("rejects payment for an order that is not pending", async () => {
    await clearTestData();

    const order = await createTestOrder(userId, "INR", "CANCELLED", "PENDING");

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(409);

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("rejects non-INR orders", async () => {
    await clearTestData();

    const order = await createTestOrder(userId, "USD");

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send();

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Only INR payments are currently supported.",
    );

    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });

  it("does not trust an amount supplied by the frontend", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        amount: 1,
        currency: "USD",
      });

    expect(response.status).toBe(201);

    expect(response.body.payment.amount).toBe(29900);
    expect(response.body.payment.currency).toBe("INR");

    expect(mocks.createRazorpayOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 29900,
        currency: "INR",
      }),
    );
  });

  // --------------------------------------------------
  // Payment verification tests
  // --------------------------------------------------

  it("verifies a captured payment and grants library access", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    mockCapturedPayment(paymentId, providerOrderId);

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: createSignature(providerOrderId, paymentId),
      });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      message: "Payment verified successfully.",
      orderId: order.id,
      paymentStatus: "PAID",
      orderStatus: "COMPLETED",
    });

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
  });

  it("rejects an invalid payment signature without granting library access", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: "invalid-signature",
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Payment signature verification failed.",
    );

    expect(mocks.fetchRazorpayPayment).not.toHaveBeenCalled();

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  it("does not grant library access for an authorized but uncaptured payment", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { attempt, providerOrderId, paymentId } =
      await createTestPaymentAttempt(order.id);

    mockCapturedPayment(paymentId, providerOrderId, {
      status: "authorized",
    });

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: createSignature(providerOrderId, paymentId),
      });

    expect(response.status).toBe(409);

    expect(response.body.message).toBe("Payment has not been captured yet.");

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

  it("rejects a payment with an incorrect amount", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    mockCapturedPayment(paymentId, providerOrderId, {
      amount: 100,
    });

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: createSignature(providerOrderId, paymentId),
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Payment details do not match the order.",
    );

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  it("rejects a payment associated with a different Razorpay order", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    mockCapturedPayment(paymentId, `order_${randomUUID()}`);

    const { agent, csrfToken } = await login(email);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: createSignature(providerOrderId, paymentId),
      });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Payment details do not match the order.",
    );

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  it("does not allow a user to verify another user's payment", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    const { agent, csrfToken } = await login(anotherEmail);

    const response = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send({
        razorpay_order_id: providerOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: createSignature(providerOrderId, paymentId),
      });

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Payment attempt not found.");

    expect(mocks.fetchRazorpayPayment).not.toHaveBeenCalled();

    expect(
      await prisma.libraryItem.count({
        where: { userId },
      }),
    ).toBe(0);
  });

  it("handles repeated verification without creating duplicate library items", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);
    const { providerOrderId, paymentId } = await createTestPaymentAttempt(
      order.id,
    );

    mockCapturedPayment(paymentId, providerOrderId);

    const { agent, csrfToken } = await login(email);

    const verificationPayload = {
      razorpay_order_id: providerOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: createSignature(providerOrderId, paymentId),
    };

    const firstResponse = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send(verificationPayload);

    expect(firstResponse.status).toBe(200);

    const secondResponse = await agent
      .post(`/api/orders/${order.id}/payment/verify`)
      .set("X-CSRF-Token", csrfToken)
      .send(verificationPayload);

    expect(secondResponse.status).toBe(200);

    expect(secondResponse.body.message).toBe(
      "Payment has already been verified.",
    );

    expect(
      await prisma.libraryItem.count({
        where: {
          userId,
          orderId: order.id,
        },
      }),
    ).toBe(1);
  });
});
