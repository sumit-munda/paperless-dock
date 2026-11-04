import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";
import {
  CheckoutServiceError,
  createOrder,
} from "./checkout.service.js";

describe("Checkout PostgreSQL integration tests", () => {
  let userId: string;
  let bookIds: string[];

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Checkout Integration Test",
        email: `checkout-integration-${randomUUID()}@example.com`,
        passwordHash: "integration-test-hash",
      },
    });

    userId = user.id;
    bookIds = [randomUUID(), randomUUID(), randomUUID()];

    await prisma.book.createMany({
      data: bookIds.map((id, index) => ({
        id,
        title: `Checkout Test Book ${index + 1}`,
        slug: `checkout-test-book-${id}`,
        description: "Temporary book for checkout integration tests.",
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

  async function createCart(bookId: string) {
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

    return cart;
  }

  it("rejects checkout when the cart is empty", async () => {
    await clearTestData();

    await expect(createOrder(userId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Your cart is empty.",
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    expect(orders).toBe(0);
  });

  it("creates a pending order and clears the cart", async () => {
    await clearTestData();

    const bookId = bookIds[0];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await createCart(bookId);

    const order = await createOrder(userId);

    expect(order.status).toBe("PENDING");
    expect(order.paymentStatus).toBe("PENDING");
    expect(Number(order.subtotal)).toBe(199);
    expect(order.currency).toBe("INR");

    expect(order.items).toHaveLength(1);

    expect(order.items[0]).toMatchObject({
      bookId,
      titleSnapshot: "Checkout Test Book 1",
      quantity: 1,
    });

    expect(Number(order.items[0]?.priceSnapshot)).toBe(199);

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(cart?.items).toHaveLength(0);

    const libraryItems = await prisma.libraryItem.count({
      where: { userId },
    });

    expect(libraryItems).toBe(0);
  });

  it("rejects checkout when a legacy cart item has quantity greater than one", async () => {
    await clearTestData();

    const bookId = bookIds[0];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // Simulate a legacy or manually modified database record.
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        bookId,
        quantity: 2,
      },
    });

    await expect(createOrder(userId)).rejects.toMatchObject({
      statusCode: 409,
      message: `"Checkout Test Book 1" has an invalid quantity. Digital books can only have a quantity of 1.`,
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    const remainingCart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    const libraryItems = await prisma.libraryItem.count({
      where: { userId },
    });

    expect(orders).toBe(0);

    expect(remainingCart?.items).toHaveLength(1);

    expect(remainingCart?.items[0]).toMatchObject({
      bookId,
      quantity: 2,
    });

    expect(libraryItems).toBe(0);
  });

  it("rejects checkout when a book is already owned", async () => {
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

    await createCart(bookId);

    await expect(createOrder(userId)).rejects.toMatchObject({
      statusCode: 409,
    });

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

  it("rejects checkout when a book is unpublished", async () => {
    await clearTestData();

    const bookId = bookIds[1];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await prisma.book.update({
      where: { id: bookId },
      data: { status: "DRAFT" },
    });

    await createCart(bookId);

    await expect(createOrder(userId)).rejects.toMatchObject({
      statusCode: 409,
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(orders).toBe(0);
    expect(cart?.items).toHaveLength(1);

    await prisma.book.update({
      where: { id: bookId },
      data: { status: "PUBLISHED" },
    });
  });

  it("rejects the entire checkout if any cart book is already owned", async () => {
    await clearTestData();

    const firstBookId = bookIds[0];
    const secondBookId = bookIds[1];

    if (!firstBookId || !secondBookId) {
      throw new Error("Two test books are required.");
    }

    const cart = await prisma.cart.create({
      data: {
        userId,
        items: {
          create: [
            { bookId: firstBookId, quantity: 1 },
            { bookId: secondBookId, quantity: 1 },
          ],
        },
      },
    });

    await prisma.libraryItem.create({
      data: {
        userId,
        bookId: secondBookId,
      },
    });

    await expect(createOrder(userId)).rejects.toMatchObject({
      statusCode: 409,
    });

    const orders = await prisma.order.count({
      where: { userId },
    });

    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cart.id },
    });

    expect(orders).toBe(0);
    expect(remainingItems).toBe(2);
  });

  it("prevents duplicate orders from concurrent checkout requests", async () => {
    await clearTestData();

    const bookId = bookIds[0];

    if (!bookId) {
      throw new Error("A test book is required.");
    }

    await createCart(bookId);

    const results = await Promise.allSettled([
      createOrder(userId),
      createOrder(userId),
    ]);

    const successfulOrders = results.filter(
      (result) => result.status === "fulfilled",
    );

    const failedOrders = results.filter(
      (result) => result.status === "rejected",
    );

    expect(successfulOrders).toHaveLength(1);
    expect(failedOrders).toHaveLength(1);

    const orders = await prisma.order.count({
      where: { userId },
    });

    expect(orders).toBe(1);

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(cart?.items).toHaveLength(0);

    const failure = failedOrders[0];

    if (failure?.status === "rejected") {
      expect(failure.reason).toBeInstanceOf(CheckoutServiceError);
      expect(failure.reason.statusCode).toBe(400);
    }
  });
});