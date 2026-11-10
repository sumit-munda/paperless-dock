import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";
import app from "../app.js";

describe("Orders API integration tests", () => {
  let userId: string;
  let anotherUserId: string;
  let bookId: string;
  let orderId: string;

  let email: string;
  let anotherEmail: string;
  let password: string;

  beforeAll(async () => {
    password = "OrdersPassword123!";

    email = `orders-${randomUUID()}@example.com`;
    anotherEmail = `another-orders-${randomUUID()}@example.com`;

    const passwordHash = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        name: "Orders Test User",
        email,
        passwordHash,
      },
    });

    userId = user.id;

    const anotherUser = await prisma.user.create({
      data: {
        name: "Another Orders Test User",
        email: anotherEmail,
        passwordHash,
      },
    });

    anotherUserId = anotherUser.id;

    bookId = randomUUID();

    await prisma.book.create({
      data: {
        id: bookId,
        title: "Orders Test Book",
        slug: `orders-test-book-${bookId}`,
        description: "Temporary book for orders API tests.",
        price: "299.00",
        currency: "INR",
        status: "PUBLISHED",
      },
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
        where: {
          id: bookId,
        },
      });
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

    return agent;
  }

  async function createTestOrder(ownerId: string) {
    const order = await prisma.order.create({
      data: {
        userId: ownerId,
        subtotal: "299.00",
        currency: "INR",
        status: "PENDING",
        paymentStatus: "PENDING",
        items: {
          create: {
            bookId,
            titleSnapshot: "Orders Test Book",
            priceSnapshot: "299.00",
            quantity: 1,
          },
        },
      },
      include: {
        items: true,
      },
    });

    orderId = order.id;

    return order;
  }

  it("rejects order retrieval when the user is not authenticated", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const response = await request(app).get(`/api/orders/${order.id}`);

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      message: "Authentication required.",
    });
  });

  it("returns an authenticated user's order with its items", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const agent = await login(email);

    const response = await agent.get(`/api/orders/${order.id}`);

    expect(response.status).toBe(200);

    expect(response.body.order).toMatchObject({
      id: order.id,
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      currency: "INR",
    });

    expect(Number(response.body.order.subtotal)).toBe(299);

    expect(response.body.order.items).toHaveLength(1);

    expect(response.body.order.items[0]).toMatchObject({
      bookId,
      titleSnapshot: "Orders Test Book",
      quantity: 1,
    });

    expect(Number(response.body.order.items[0].priceSnapshot)).toBe(299);
  });

  it("returns 404 when the order does not exist", async () => {
    await clearTestData();

    const agent = await login(email);

    const response = await agent.get(`/api/orders/${randomUUID()}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Order not found.",
    });
  });

  it("prevents a user from retrieving another user's order", async () => {
    await clearTestData();

    const order = await createTestOrder(userId);

    const anotherAgent = await login(anotherEmail);

    const response = await anotherAgent.get(`/api/orders/${order.id}`);

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Order not found.",
    });
  });
});
