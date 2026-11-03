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
  mockTransaction,
  mockBookFindMany,
  mockCartMigrationCreate,
  mockCartMigrationFindUnique,
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
  mockTransaction: vi.fn(),
  mockBookFindMany: vi.fn(),
  mockCartMigrationCreate: vi.fn(),
  mockCartMigrationFindUnique: vi.fn(),
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
    },
    $transaction: mockTransaction,
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
import { MigrateGuestCartInput } from "../validation/cart.schema.js";

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
      quantity: 2,
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
    book: {
      findFirst: mockBookFindFirst,
      findMany: mockBookFindMany,
    },
    cart: {
      upsert: mockCartUpsert,
      findUniqueOrThrow: mockCartFindUniqueOrThrow,
    },
    cartItem: {
      findUnique: mockCartItemFindUnique,
      create: mockCartItemCreate,
      update: mockCartItemUpdate,
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
      expect(result.itemCount).toBe(2);
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
      mockCartItemFindUnique.mockResolvedValue(null);
      mockCartItemCreate.mockResolvedValue({});
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);
    });

    it("adds a new book to the cart", async () => {
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

      expect(mockCartItemCreate).toHaveBeenCalledWith({
        data: {
          cartId,
          bookId,
          quantity: 1,
        },
      });

      expect(result.itemCount).toBe(2);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it("increases the quantity when the book already exists", async () => {
      mockCartItemFindUnique.mockResolvedValue({
        id: "item-123",
        quantity: 2,
      });

      await addItemToCart(userId, {
        bookId,
        quantity: 3,
      });

      expect(mockCartItemUpdate).toHaveBeenCalledWith({
        where: { id: "item-123" },
        data: { quantity: 5 },
      });

      expect(mockCartItemCreate).not.toHaveBeenCalled();
    });

    it("rejects a book that is not published or does not exist", async () => {
      mockBookFindFirst.mockResolvedValue(null);

      await expect(
        addItemToCart(userId, { bookId, quantity: 1 }),
      ).rejects.toMatchObject({
        message: "Book not found or unavailable.",
        statusCode: 404,
      });

      expect(mockCartItemCreate).not.toHaveBeenCalled();
    });

    it("rejects quantities exceeding 99", async () => {
      mockCartItemFindUnique.mockResolvedValue({
        id: "item-123",
        quantity: 95,
      });

      await expect(
        addItemToCart(userId, {
          bookId,
          quantity: 5,
        }),
      ).rejects.toBeInstanceOf(CartServiceError);

      expect(mockCartItemUpdate).not.toHaveBeenCalled();
    });
  });

  describe("updateCartItem", () => {
    it("updates an existing cart item's quantity", async () => {
      mockCartFindUnique.mockResolvedValue({
        id: cartId,
        items: sampleCart.items,
      });

      mockCartItemUpdateMany.mockResolvedValue({ count: 1 });
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);

      const result = await updateCartItem(userId, bookId, {
        quantity: 4,
      });

      expect(mockCartItemUpdateMany).toHaveBeenCalledWith({
        where: { cartId, bookId },
        data: { quantity: 4 },
      });

      expect(result.id).toBe(cartId);
    });

    it("returns 404 when the cart item does not exist", async () => {
      mockCartFindUnique.mockResolvedValue({
        id: cartId,
        items: [],
      });

      mockCartItemUpdateMany.mockResolvedValue({ count: 0 });

      await expect(
        updateCartItem(userId, bookId, { quantity: 4 }),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Cart item not found.",
      });
    });
  });

  describe("removeCartItem", () => {
    it("removes the requested book from the user's cart", async () => {
      mockCartFindUnique.mockResolvedValue({
        id: cartId,
        items: sampleCart.items,
      });

      mockCartItemDeleteMany.mockResolvedValue({ count: 1 });
      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartFindUniqueOrThrow.mockResolvedValue(emptyCart);

      const result = await removeCartItem(userId, bookId);

      expect(mockCartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId, bookId },
      });

      expect(result.items).toEqual([]);
    });

    it("returns 404 when the requested item does not exist", async () => {
      mockCartFindUnique.mockResolvedValue({
        id: cartId,
        items: [],
      });

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
      mockCartItemDeleteMany.mockResolvedValue({ count: 2 });
      mockCartFindUniqueOrThrow.mockResolvedValue(emptyCart);

      const result = await clearCart(userId);

      expect(mockCartItemDeleteMany).toHaveBeenCalledWith({
        where: { cartId },
      });

      expect(result.items).toEqual([]);
      expect(result.itemCount).toBe(0);
    });
  });

  describe("migrateGuestCart", () => {
    const migrationId = "550e8400-e29b-41d4-a716-446655440000";

    const migrationInput = {
      migrationId,
      items: [
        { bookId, quantity: 2 },
        { bookId: "book-456", quantity: 3 },
      ],
    };

    beforeEach(() => {
      mockBookFindMany.mockResolvedValue([{ id: bookId }, { id: "book-456" }]);

      mockCartUpsert.mockResolvedValue({ id: cartId });
      mockCartItemFindUnique.mockResolvedValue(null);
      mockCartItemCreate.mockResolvedValue({});
      mockCartFindUniqueOrThrow.mockResolvedValue(sampleCart);
      mockCartMigrationCreate.mockResolvedValue({});
    });

    it("migrates guest cart items into the user's cart", async () => {
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

      expect(mockCartItemCreate).toHaveBeenCalledTimes(2);

      expect(mockCartItemCreate).toHaveBeenNthCalledWith(1, {
        data: {
          cartId,
          bookId,
          quantity: 2,
        },
      });

      expect(mockCartItemCreate).toHaveBeenNthCalledWith(2, {
        data: {
          cartId,
          bookId: "book-456",
          quantity: 3,
        },
      });

      expect(result.id).toBe(cartId);
    });

    it("merges guest quantities with existing account cart items", async () => {
      mockCartItemFindUnique
        .mockResolvedValueOnce({
          id: "existing-item",
          quantity: 2,
        })
        .mockResolvedValueOnce(null);

      await migrateGuestCart(userId, migrationInput);

      expect(mockCartItemUpdate).toHaveBeenCalledWith({
        where: {
          id: "existing-item",
        },
        data: {
          quantity: 4,
        },
      });

      expect(mockCartItemCreate).toHaveBeenCalledTimes(1);
    });

    it("rejects migration when one or more books are unavailable", async () => {
      mockBookFindMany.mockResolvedValue([{ id: bookId }]);

      await expect(
        migrateGuestCart(userId, migrationInput),
      ).rejects.toMatchObject({
        message: "One or more books are unavailable.",
        statusCode: 404,
      });

      expect(mockCartItemCreate).not.toHaveBeenCalled();
      expect(mockCartItemUpdate).not.toHaveBeenCalled();
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
      expect(mockCartItemCreate).not.toHaveBeenCalled();
      expect(mockCartItemUpdate).not.toHaveBeenCalled();

      expect(result.id).toBe(cartId);
    });

    it("rejects when an existing cart item's quantity would exceed 99", async () => {
      mockCartItemFindUnique.mockResolvedValue({
        id: "existing-item",
        quantity: 95,
      });

      await expect(
        migrateGuestCart(userId, {
          migrationId,
          items: [{ bookId, quantity: 5 }],
        }),
      ).rejects.toBeInstanceOf(CartServiceError);

      expect(mockCartItemUpdate).not.toHaveBeenCalled();
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
      expect(mockCartItemCreate).not.toHaveBeenCalled();
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
      expect(mockCartItemCreate).not.toHaveBeenCalled();
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
      expect(mockCartItemCreate).not.toHaveBeenCalled();
      expect(mockCartItemUpdate).not.toHaveBeenCalled();
    });
  });
});
