import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mockApiRequest } = vi.hoisted(() => ({
  mockApiRequest: vi.fn(),
}));

vi.mock("./apiRequest", () => ({
  apiRequest: mockApiRequest,
}));

vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");

let cartApi: typeof import("./cartApi");

beforeAll(async () => {
  cartApi = await import("./cartApi");
});

const sampleCart = {
  id: "cart-123",
  items: [],
  itemCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("Cart API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const migrationInput = {
    migrationId: "550e8400-e29b-41d4-a716-446655440000",
    items: [
      {
        bookId: "book-123",
        quantity: 2,
      },
      {
        bookId: "book-456",
        quantity: 3,
      },
    ],
  };

  it("fetches the authenticated user's cart", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    const result = await cartApi.fetchCart();

    expect(result).toEqual(sampleCart);

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart"),
    );
  });

  it("adds a book to the cart", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    await cartApi.addCartItem("book-123");

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/items"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          bookId: "book-123",
          quantity: 1,
        }),
      }),
    );
  });

  it("updates a cart item's quantity", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    await cartApi.updateCartItem("book-123", 3);

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/items/book-123"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ quantity: 3 }),
      }),
    );
  });

  it("removes a book from the cart", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    await cartApi.removeCartItem("book-123");

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/items/book-123"),
      { method: "DELETE" },
    );
  });

  it("clears the cart", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    await cartApi.clearCart();

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart"),
      { method: "DELETE" },
    );
  });

  it("supports adding multiple copies of a book", async () => {
    mockApiRequest.mockResolvedValue({ cart: sampleCart });

    await cartApi.addCartItem("book-123", 4);

    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/cart/items"),
      expect.objectContaining({
        body: JSON.stringify({
          bookId: "book-123",
          quantity: 4,
        }),
      }),
    );
  });

  describe("migrateGuestCart", () => {
    it("migrates guest cart items to the account cart", async () => {
      mockApiRequest.mockResolvedValue({ cart: sampleCart });

      const result = await cartApi.migrateGuestCart(migrationInput);

      expect(result).toEqual(sampleCart);

      expect(mockApiRequest).toHaveBeenCalledWith(
        "http://localhost:3000/api/cart/migrate",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(migrationInput),
        }),
      );
    });

    it("returns the migrated cart", async () => {
      const migratedCart = {
        ...sampleCart,
        itemCount: 5,
      };

      mockApiRequest.mockResolvedValue({ cart: migratedCart });

      const result = await cartApi.migrateGuestCart(migrationInput);

      expect(result).toEqual(migratedCart);
      expect(result.itemCount).toBe(5);
    });

    it("propagates migration API errors", async () => {
      const migrationError = new Error("Migration failed.");

      mockApiRequest.mockRejectedValue(migrationError);

      await expect(cartApi.migrateGuestCart(migrationInput)).rejects.toThrow(
        "Migration failed.",
      );
    });
  });
});
