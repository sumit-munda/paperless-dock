import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";
import { migrateGuestCart } from "./cart.service.js";

describe("Cart migration PostgreSQL integration tests", () => {
  let userId: string;
  let bookIds: string[];

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        name: "Cart Integration Test",
        email: `cart-integration-${randomUUID()}@example.com`,
        passwordHash: "integration-test-hash",
      },
    });

    userId = user.id;

    bookIds = [randomUUID(), randomUUID()];

    await prisma.book.createMany({
      data: bookIds.map((id, index) => ({
        id,
        title: `Integration Test Book ${index + 1}`,
        slug: `integration-test-book-${id}`,
        description: "Temporary book created for PostgreSQL integration tests.",
        price: "199.00",
        currency: "INR",
        status: "PUBLISHED",
      })),
    });
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({
        where: {
          id: userId,
        },
      });
    }

    if (bookIds?.length) {
      await prisma.book.deleteMany({
        where: {
          id: {
            in: bookIds,
          },
        },
      });
    }

    await prisma.$disconnect();
  });

  it("rolls back the migration record when a book is unavailable", async () => {
    const migrationId = randomUUID();

    const unavailableBookId = `missing-book-${randomUUID()}`;

    await expect(
      migrateGuestCart(userId, {
        migrationId,
        items: [
          {
            bookId: unavailableBookId,
            quantity: 1,
          },
        ],
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    const migration = await prisma.cartMigration.findUnique({
      where: {
        userId_migrationId: {
          userId,
          migrationId,
        },
      },
    });

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    expect(migration).toBeNull();
    expect(cart).toBeNull();
  });

  it("rolls back earlier cart changes when a later item exceeds quantity 99", async () => {
    const migrationId = randomUUID();

    const firstBookId = bookIds[0];
    const secondBookId = bookIds[1];

    if (!firstBookId || !secondBookId) {
      throw new Error("Two published books are required.");
    }

    await prisma.cart.create({
      data: {
        userId,
        items: {
          create: {
            bookId: secondBookId,
            quantity: 98,
          },
        },
      },
    });

    await expect(
      migrateGuestCart(userId, {
        migrationId,
        items: [
          {
            bookId: firstBookId,
            quantity: 2,
          },
          {
            bookId: secondBookId,
            quantity: 2,
          },
        ],
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    const migration = await prisma.cartMigration.findUnique({
      where: {
        userId_migrationId: {
          userId,
          migrationId,
        },
      },
    });

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: true,
      },
    });

    expect(migration).toBeNull();
    expect(cart).not.toBeNull();

    expect(cart?.items).toHaveLength(1);

    expect(cart?.items[0]).toMatchObject({
      bookId: secondBookId,
      quantity: 98,
    });
  });

  it("handles concurrent requests with the same migration ID without duplicating cart items", async () => {
    await prisma.cart.deleteMany({
      where: { userId },
    });

    const migrationId = randomUUID();

    const firstBookId = bookIds[0];

    if (!firstBookId) {
      throw new Error("A test book is required.");
    }

    const input = {
      migrationId,
      items: [
        {
          bookId: firstBookId,
          quantity: 3,
        },
      ],
    };

    const [firstResult, secondResult] = await Promise.all([
      migrateGuestCart(userId, input),
      migrateGuestCart(userId, input),
    ]);

    expect(firstResult.items).toHaveLength(1);
    expect(secondResult.items).toHaveLength(1);

    expect(firstResult.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });

    expect(secondResult.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });

    const migrationRecords = await prisma.cartMigration.count({
      where: {
        userId,
        migrationId,
      },
    });

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: true,
      },
    });

    expect(migrationRecords).toBe(1);
    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });
  });

  it("returns the existing cart when the same migration is retried", async () => {
    await prisma.cart.deleteMany({
      where: { userId },
    });

    const migrationId = randomUUID();
    const firstBookId = bookIds[0];

    if (!firstBookId) {
      throw new Error("A test book is required.");
    }

    const input = {
      migrationId,
      items: [
        {
          bookId: firstBookId,
          quantity: 3,
        },
      ],
    };

    const firstResult = await migrateGuestCart(userId, input);

    const secondResult = await migrateGuestCart(userId, input);

    expect(firstResult.items).toHaveLength(1);
    expect(secondResult.items).toHaveLength(1);

    expect(firstResult.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });

    expect(secondResult.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });

    const migrationRecords = await prisma.cartMigration.count({
      where: {
        userId,
        migrationId,
      },
    });

    expect(migrationRecords).toBe(1);
  });

  it("rejects the same migration ID when reused with a different payload", async () => {
    await prisma.cart.deleteMany({
      where: { userId },
    });

    const migrationId = randomUUID();
    const firstBookId = bookIds[0];

    if (!firstBookId) {
      throw new Error("A test book is required.");
    }

    await migrateGuestCart(userId, {
      migrationId,
      items: [
        {
          bookId: firstBookId,
          quantity: 3,
        },
      ],
    });

    await expect(
      migrateGuestCart(userId, {
        migrationId,
        items: [
          {
            bookId: firstBookId,
            quantity: 5,
          },
        ],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    expect(cart?.items).toHaveLength(1);
    expect(cart?.items[0]).toMatchObject({
      bookId: firstBookId,
      quantity: 3,
    });

    const migrationRecords = await prisma.cartMigration.count({
      where: {
        userId,
        migrationId,
      },
    });

    expect(migrationRecords).toBe(1);
  });

  it("rejects retries when an existing migration has a null payload hash", async () => {
    await prisma.cart.deleteMany({
      where: { userId },
    });

    const migrationId = randomUUID();
    const firstBookId = bookIds[0];

    if (!firstBookId) {
      throw new Error("A test book is required.");
    }

    await prisma.cartMigration.create({
      data: {
        userId,
        migrationId,
        payloadHash: null,
      },
    });

    await expect(
      migrateGuestCart(userId, {
        migrationId,
        items: [
          {
            bookId: firstBookId,
            quantity: 3,
          },
        ],
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    const migration = await prisma.cartMigration.findUnique({
      where: {
        userId_migrationId: {
          userId,
          migrationId,
        },
      },
    });

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    expect(migration).not.toBeNull();
    expect(migration?.payloadHash).toBeNull();
    expect(cart).toBeNull();
  });
});
