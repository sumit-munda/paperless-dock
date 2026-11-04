import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCartUpsert,
  mockCartFindUnique,
  mockCartFindUniqueOrThrow,
  mockBookFindFirst,
  mockCartItemFindUnique,
  mockCartItemCreate,
  mockCartItemUpdate,
  mockCartItemUpdateMany,
  mockCartItemDeleteMany,
  mockCartItemUpsert,
  mockTransaction,
  mockBookFindMany,
  mockCartMigrationCreate,
  mockCartMigrationFindUnique,
  mockQueryRaw,
} = vi.hoisted(() => ({
  mockCartUpsert: vi.fn(),
  mockCartFindUnique: vi.fn(),
  mockCartFindUniqueOrThrow: vi.fn(),
  mockBookFindFirst: vi.fn(),
  mockCartItemFindUnique: vi.fn(),
  mockCartItemCreate: vi.fn(),
  mockCartItemUpdate: vi.fn(),
  mockCartItemUpdateMany: vi.fn(),
  mockCartItemDeleteMany: vi.fn(),
  mockCartItemUpsert: vi.fn(),
  mockTransaction: vi.fn(),
  mockBookFindMany: vi.fn(),
  mockCartMigrationCreate: vi.fn(),
  mockCartMigrationFindUnique: vi.fn(),
  mockQueryRaw: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  default: {
    cart: {
      upsert: mockCartUpsert,
      findUnique: mockCartFindUnique,
      findUniqueOrThrow: mockCartFindUniqueOrThrow,
    },
    cartItem: {
      findUnique: mockCartItemFindUnique,
      create: mockCartItemCreate,
      update: mockCartItemUpdate,
      updateMany: mockCartItemUpdateMany,
      deleteMany: mockCartItemDeleteMany,
      upsert: mockCartItemUpsert,
    },
    $transaction: mockTransaction,
    $queryRaw: mockQueryRaw,
    book: {
      findMany: mockBookFindMany,
    },
    cartMigration: {
      create: mockCartMigrationCreate,
      findUnique: mockCartMigrationFindUnique,
    },
  },
}));

import {
  addItemToCart,
  CartServiceError,
  clearCart,
  getCart,
  migrateGuestCart,
  removeCartItem,
  updateCartItem,
} from "./cart.service.js";

import { Prisma } from "../generated/prisma/index.js";
import { createHash } from "node:crypto";
import type { MigrateGuestCartInput } from "../validation/cart.schema.js";

const userId = "user-123";
const cartId = "cart-123";
const bookId = "book-123";

const sampleCart = {
  id: cartId,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
  items: [
    {
      id: "item-123",
      bookId,
      quantity: 1,
      book: {
        id: bookId,
        title: "Atomic Habits",
        slug: "atomic-habits",
        price: 499,
        currency: "INR",
        coverImage: null,
        authors: [
          {
            author: {
              name: "James Clear",
            },
          },
        ],
      },
    },
  ],
};

const emptyCart = {
  ...sampleCart,
  items: [],
};

function createTransactionMock() {
  return {
    $queryRaw: mockQueryRaw,
    book: {
      findFirst: mockBookFindFirst,
      findMany: mockBookFindMany,
    },
    cart: {
      upsert: mockCartUpsert,
      findUnique: mockCartFindUnique,
      findUniqueOrThrow: mockCartFindUniqueOrThrow,
    },
    cartItem: {
      findUnique: mockCartItemFindUnique,
      create: mockCartItemCreate,
      update: mockCartItemUpdate,
      updateMany: mockCartItemUpdateMany,
      deleteMany: mockCartItemDeleteMany,
      upsert: mockCartItemUpsert,
    },
    cartMigration: {
      create: mockCartMigrationCreate,
    },
  };
}

describe("Cart Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockTransaction.mockImplementation(
      async (
        callback: (tx: ReturnType<typeof createTransactionMock>) => unknown,
      ) => callback(createTransactionMock()),
    );

    mockQueryRaw.mockResolvedValue([{ id: cartId }]);
  });

  describe("getCart", () => {
    it("creates a cart if one does not exist and returns it", async () => {
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);

      const result = await getCart(userId);

      expect(mockCartUpsert).toHaveBeenCalledWith({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true },
      });

      expect(result.id).toBe(cartId);
      expect(result.itemCount).toBe(1);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].book.author).toBe("James Clear");
      expect(result.items[0].book.price).toBe(499);
    });

    it("returns an empty cart when there are no items", async () => {
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(emptyCart);

      const result = await getCart(userId);

      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
    });
  });

  describe("addItemToCart", () => {
    beforeEach(() => {
      mockBookFindFirst.mockResolvedValue({ id: bookId });
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartItemUpsert.mockResolvedValue({});
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);
    });

    it("adds a new book to the cart with quantity 1", async () => {
      const result = await addItemToCart(userId, {
        bookId,
        quantity: 1,
      });

      expect(mockBookFindFirst).toHaveBeenCalledWith({
        where: {
          id: bookId,
          status: "PUBLISHED",
        },
        select: { id: true },
      });

      expect(mockCartItemUpsert).toHaveBeenCalledWith({
        where: {
          cartId_bookId: {
            cartId,
            bookId,
          },
        },
        update: {},
        create: {
          cartId,
          bookId,
          quantity: 1,
        },
      });

      expect(result.itemCount).toBe(1);
      expect(mockQueryRaw).toHaveBeenCalled();
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("does not increase quantity when the book already exists", async () => {
      await addItemToCart(userId, {
        bookId,
        quantity: 1,
      });

      expect(mockCartItemUpsert).toHaveBeenCalledWith({
        where: {
          cartId_bookId: {
            cartId,
            bookId,
          },
        },
        update: {},
        create: {
          cartId,
          bookId,
          quantity: 1,
        },
      });

      expect(mockCartItemUpdate).not.toHaveBeenCalled();
    });

    it("rejects quantities other than 1", async () => {
      await expect(
        addItemToCart(userId, {
          bookId,
          quantity: 2,
        }),
      ).rejects.toMatchObject({
        message: "Digital books can only have a quantity of 1.",
        statusCode: 400,
      });

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });

    it("rejects a book that is not published or does not exist", async () => {
      mockBookFindFirst.mockResolvedValue(null);

      await expect(
        addItemToCart(userId, {
          bookId,
          quantity: 1,
        }),
      ).rejects.toMatchObject({
        message: "Book not found or unavailable.",
        statusCode: 404,
      });

      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });
  });

  describe("updateCartItem", () => {
    beforeEach(() => {
      mockCartFindUnique.mockResolvedValue({ id: cartId });
      mockCartItemUpdateMany.mockResolvedValue({ count: 1 });
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);
    });

    it("keeps an existing cart item's quantity at 1", async () => {
      const result = await updateCartItem(userId, bookId, {
        quantity: 1,
      });

      expect(mockCartItemUpdateMany).toHaveBeenCalledWith({
        where: { cartId, bookId },
        data: { quantity: 1 },
      });

      expect(mockQueryRaw).toHaveBeenCalled();
      expect(result.id).toBe(cartId);
    });

    it("rejects quantities other than 1", async () => {
      await expect(
        updateCartItem(userId, bookId, {
          quantity: 2,
        }),
      ).rejects.toMatchObject({
        message: "Digital books can only have a quantity of 1.",
        statusCode: 400,
      });

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockCartItemUpdateMany).not.toHaveBeenCalled();
    });

    it("returns 404 when the cart does not exist", async () => {
      mockCartFindUnique.mockResolvedValue(null);

      await expect(
        updateCartItem(userId, bookId, { quantity: 1 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Cart not found.",
      });
    });

    it("returns 404 when the cart item does not exist", async () => {
      mockCartItemUpdateMany.mockResolvedValue({ count: 0 });

      await expect(
        updateCartItem(userId, bookId, { quantity: 1 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Cart item not found.",
      });
    });
  });

  describe("removeCartItem", () => {
    beforeEach(() => {
      mockCartFindUnique.mockResolvedValue({ id: cartId });
    });

    it("removes the requested book from the user's cart", async () => {
      mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
      mockCartFindUniqueOrThrow.mockResolvedValue(emptyCart);

      const result = await removeCartItem(userId, bookId);

      expect(mockCartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId, bookId },
      });

      expect(mockQueryRaw).toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });

    it("returns 404 when the requested item does not exist", async () => {
      mockCartItemDeleteMany.mockResolvedValue({ count: 0 });

      await expect(removeCartItem(userId, bookId)).rejects.toMatchObject({
        statusCode: 404,
        message: "Cart item not found.",
      });
    });
  });

  describe("clearCart", () => {
    it("removes all items belonging to the user's cart", async () => {
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
      mockCartFindUniqueOrThrow.mockResolvedValue(emptyCart);

      const result = await clearCart(userId);

      expect(mockCartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId },
      });

      expect(mockQueryRaw).toHaveBeenCalled();
      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
    });
  });

  describe("migrateGuestCart", () => {
    const migrationId = "550e8400-e29b-41d4-a716-446655440000";

    const migrationInput: MigrateGuestCartInput = {
      migrationId,
      items: [
        { bookId, quantity: 1 },
        { bookId: "book-456", quantity: 1 },
      ],
    };

    beforeEach(() => {
      mockBookFindMany.mockResolvedValue([{ id: bookId }, { id: "book-456" }]);

      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartItemUpsert.mockResolvedValue({});
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);
      mockCartMigrationCreate.mockResolvedValue({});
    });

    it("migrates guest cart items with quantity 1", async () => {
      const result = await migrateGuestCart(userId, migrationInput);

      expect(mockCartMigrationCreate).toHaveBeenCalledWith({
        data: {
          userId,
          migrationId,
          payloadHash: expect.any(String),
        },
      });

      expect(mockBookFindMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [bookId, "book-456"],
          },
          status: "PUBLISHED",
        },
        select: {
          id: true,
        },
      });

      expect(mockCartItemUpsert).toHaveBeenCalledTimes(2);

      expect(mockCartItemUpsert).toHaveBeenNthCalledWith(1, {
        where: {
          cartId_bookId: {
            cartId,
            bookId,
          },
        },
        update: {},
        create: {
          cartId,
          bookId,
          quantity: 1,
        },
      });

      expect(mockCartItemUpsert).toHaveBeenNthCalledWith(2, {
        where: {
          cartId_bookId: {
            cartId,
            bookId: "book-456",
          },
        },
        update: {},
        create: {
          cartId,
          bookId: "book-456",
          quantity: 1,
        },
      });

      expect(result.id).toBe(cartId);
    });

    it("does not increase quantity when a migrated book already exists", async () => {
      await migrateGuestCart(userId, migrationInput);

      expect(mockCartItemUpsert).toHaveBeenCalledTimes(2);

      for (const call of mockCartItemUpsert.mock.calls) {
        expect(call[0].update).toEqual({});
      }

      expect(mockCartItemUpdate).not.toHaveBeenCalled();
    });

    it("rejects migration quantities other than 1", async () => {
      await expect(
        migrateGuestCart(userId, {
          migrationId,
          items: [{ bookId, quantity: 2 }],
        }),
      ).rejects.toMatchObject({
        message: "Digital books can only have a quantity of 1.",
        statusCode: 400,
      });

      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });

    it("rejects migration when one or more books are unavailable", async () => {
      mockBookFindMany.mockResolvedValue([{ id: bookId }]);

      await expect(
        migrateGuestCart(userId, migrationInput),
      ).rejects.toMatchObject({
        message: "One or more books are unavailable.",
        statusCode: 404,
      });

      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });

    it("does not add items again when the migration already exists", async () => {
      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.19.3",
        },
      );

      mockCartMigrationCreate.mockRejectedValue(duplicateError);

      mockCartMigrationFindUnique.mockResolvedValue({
        id: "migration-record",
        userId,
        migrationId,
        payloadHash: createHash("sha256")
          .update(
            JSON.stringify(
              [...migrationInput.items].sort((a, b) =>
                a.bookId.localeCompare(b.bookId),
              ),
            ),
          )
          .digest("hex"),
        createdAt: new Date(),
      });

      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);

      const result = await migrateGuestCart(userId, migrationInput);

      expect(mockCartMigrationFindUnique).toHaveBeenCalledWith({
        where: {
          userId_migrationId: {
            userId,
            migrationId,
          },
        },
      });

      expect(mockBookFindMany).not.toHaveBeenCalled();
      expect(mockCartItemUpsert).not.toHaveBeenCalled();

      expect(result.id).toBe(cartId);
    });

    it("rejects a duplicate migration ID with a different payload", async () => {
      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.19.3",
        },
      );

      mockCartMigrationCreate.mockRejectedValue(duplicateError);

      mockCartMigrationFindUnique.mockResolvedValue({
        id: "migration-record",
        userId,
        migrationId,
        payloadHash: "different-payload-hash",
        createdAt: new Date(),
      });

      await expect(
        migrateGuestCart(userId, migrationInput),
      ).rejects.toMatchObject({
        message:
          "This migration ID has already been used with different cart items.",
        statusCode: 409,
      });

      expect(mockBookFindMany).not.toHaveBeenCalled();
      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });

    it("rejects a legacy migration without a payload fingerprint", async () => {
      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.19.3",
        },
      );

      mockCartMigrationCreate.mockRejectedValue(duplicateError);

      mockCartMigrationFindUnique.mockResolvedValue({
        id: "migration-record",
        userId,
        migrationId,
        payloadHash: null,
        createdAt: new Date(),
      });

      await expect(
        migrateGuestCart(userId, migrationInput),
      ).rejects.toMatchObject({
        message:
          "This migration ID was already used, but its original payload cannot be verified.",
        statusCode: 409,
      });

      expect(mockBookFindMany).not.toHaveBeenCalled();
      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });

    it("accepts a retry when identical items are provided in a different order", async () => {
      const duplicateError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.19.3",
        },
      );

      mockCartMigrationCreate.mockRejectedValue(duplicateError);

      const normalizedItems = [...migrationInput.items].sort((a, b) =>
        a.bookId.localeCompare(b.bookId),
      );

      const payloadHash = createHash("sha256")
        .update(JSON.stringify(normalizedItems))
        .digest("hex");

      mockCartMigrationFindUnique.mockResolvedValue({
        id: "migration-record",
        userId,
        migrationId,
        payloadHash,
        createdAt: new Date(),
      });

      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);

      const reorderedInput: MigrateGuestCartInput = {
        ...migrationInput,
        items: [...migrationInput.items].reverse(),
      };

      const result = await migrateGuestCart(userId, reorderedInput);

      expect(result.id).toBe(cartId);
      expect(mockCartItemUpsert).not.toHaveBeenCalled();
    });
  });
});
