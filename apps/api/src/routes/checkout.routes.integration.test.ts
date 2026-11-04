import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";
import app from "../app.js";

describe("Checkout API integration tests", () => {
  let userId: string;
  let bookIds: string[];
  let email: string;
  let password: string;

  beforeAll(async () => {
    email = `checkout-api-${randomUUID()}@example.com`;
    password = "CheckoutPassword123!";

    const passwordHash = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        name: "Checkout API Test",
        email,
        passwordHash,
      },
    });

    userId = user.id;

    bookIds = [randomUUID(), randomUUID(), randomUUID()];

    await prisma.book.createMany({
      data: bookIds.map((id, index) => ({
        id,
        title: `Checkout API Book ${index + 1}`,
        slug: `checkout-api-book-${id}`,
        description: "Temporary book for checkout API tests.",
        price: index === 0 ? "199.00" : "299.00",
        currency: "INR",
        status: "PUBLISHED",
      })),
    });
  });

  async function clearTestData() {
    await prisma.order.deleteMany({
      where: { userId },
    });

    await prisma.libraryItem.deleteMany({
      where: { userId },
    });

    await prisma.cart.deleteMany({
      where: { userId },
    });
  }

  afterAll(async () => {
    if (userId) {
      await clearTestData();

      await prisma.user.delete({
        where: { id: userId },
      });
    }

    if (bookIds?.length) {
      await prisma.book.deleteMany({
        where: {
          id: { in: bookIds },
        },
      });
    }

    await prisma.$disconnect();
  });

  async function login() {
    const agent = request.agent(app);

    const response = await agent.post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);

    return agent;
  }

  async function addBookToCart(bookId: string) {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        bookId,
        quantity: 1,
      },
    });
  }

  it("rejects checkout when the user is not authenticated", async () => {
    const response = await request(app).post("/api/checkout").send();

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      message: "Authentication required.",
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    expect(orders).toBe(0);
  });

  it("creates an order for an authenticated user", async () => {
    await clearTestData();

    const bookId = bookIds[0];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await addBookToCart(bookId);

    const agent = await login();

    const response = await agent.post("/api/checkout").send();

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("Order created successfully.");

    expect(response.body.order).toMatchObject({
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      currency: "INR",
    });

    expect(Number(response.body.order.subtotal)).toBe(199);

    expect(response.body.order.items).toHaveLength(1);

    expect(response.body.order.items[0]).toMatchObject({
      bookId,
      titleSnapshot: "Checkout API Book 1",
      quantity: 1,
    });

    expect(Number(response.body.order.items[0].priceSnapshot)).toBe(199);

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(cart?.items).toHaveLength(0);

    const libraryItems = await prisma.libraryItem.count({
      where: { userId },
    });

    expect(libraryItems).toBe(0);

    const orderResponse = await agent.get(
      `/api/orders/${response.body.order.id}`,
    );

    expect(orderResponse.status).toBe(200);

    expect(orderResponse.body.order).toMatchObject({
      id: response.body.order.id,
      userId,
      status: "PENDING",
      paymentStatus: "PENDING",
      currency: "INR",
    });

    expect(orderResponse.body.order.items).toHaveLength(1);

    expect(orderResponse.body.order.items[0]).toMatchObject({
      bookId,
      titleSnapshot: "Checkout API Book 1",
      quantity: 1,
    });

    expect(Number(orderResponse.body.order.items[0].priceSnapshot)).toBe(199);

    const libraryItemsAfterRetrieval = await prisma.libraryItem.count({
      where: { userId },
    });

    expect(libraryItemsAfterRetrieval).toBe(0);
  });

  it("returns 400 when the authenticated user's cart is empty", async () => {
    await clearTestData();

    const agent = await login();

    const response = await agent.post("/api/checkout").send();

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Your cart is empty.",
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    expect(orders).toBe(0);
  });

  it("returns 409 when the user already owns a cart book", async () => {
    await clearTestData();

    const bookId = bookIds[0];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await prisma.libraryItem.create({
      data: {
        userId,
        bookId,
      },
    });

    await addBookToCart(bookId);

    const agent = await login();

    const response = await agent.post("/api/checkout").send();

    expect(response.status).toBe(409);

    expect(response.body.message).toContain("is already in your library.");

    const orders = await prisma.order.count({
      where: { userId },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(orders).toBe(0);
    expect(cart?.items).toHaveLength(1);
  });

  it("returns 409 when a cart book is unpublished", async () => {
    await clearTestData();

    const bookId = bookIds[1];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { status: "DRAFT" },
    });

    await addBookToCart(bookId);

    const agent = await login();

    const response = await agent.post("/api/checkout").send();

    expect(response.status).toBe(409);

    expect(response.body.message).toContain("is no longer available.");

    const orders = await prisma.order.count({
      where: { userId },
    });

    expect(orders).toBe(0);

    await prisma.book.update({
      where: { id: bookId },
      data: { status: "PUBLISHED" },
    });
  });
});
