import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFindUnique,
  mockCompare,
  mockGetCart,
  mockAddItemToCart,
  mockUpdateCartItem,
  mockRemoveCartItem,
  mockClearCart,
  mockMigrateGuestCart,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCompare: vi.fn(),
  mockGetCart: vi.fn(),
  mockAddItemToCart: vi.fn(),
  mockUpdateCartItem: vi.fn(),
  mockRemoveCartItem: vi.fn(),
  mockClearCart: vi.fn(),
  mockMigrateGuestCart: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockCompare,
    hash: vi.fn(),
  },
}));

vi.mock("../services/cart.service.js", () => ({
  getCart: mockGetCart,
  addItemToCart: mockAddItemToCart,
  updateCartItem: mockUpdateCartItem,
  removeCartItem: mockRemoveCartItem,
  clearCart: mockClearCart,
  migrateGuestCart: mockMigrateGuestCart,
  CartServiceError: class CartServiceError extends Error {
    constructor(
      message: string,
      public statusCode: number,
    ) {
      super(message);
    }
  },
}));

import app from "../app.js";
import { CartServiceError } from "../services/cart.service.js";

const customer = {
  id: "customer-123",
  name: "Jane Reader",
  email: "jane@example.com",
  role: "CUSTOMER",
};

const sampleCart = {
  id: "cart-123",
  items: [
    {
      id: "item-123",
      bookId: "book-123",
      quantity: 1,
      book: {
        id: "book-123",
        title: "Atomic Habits",
        slug: "atomic-habits",
        price: 499,
        currency: "INR",
        coverImage: null,
        author: "James Clear",
      },
    },
  ],
  itemCount: 1,
};

async function createAuthenticatedAgent() {
  mockFindUnique.mockResolvedValue({
    ...customer,
    passwordHash: "hashed-password",
  });

  mockCompare.mockResolvedValue(true);

  const agent = request.agent(app);

  const loginResponse = await agent.post("/api/auth/login").send({
    email: customer.email,
    password: "Password123!",
  });

  expect(loginResponse.status).toBe(200);

  return agent;
}

describe("Cart routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/cart", () => {
    it("returns 401 when the user is not authenticated", async () => {
      const response = await request(app).get("/api/cart");

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: "Authentication required.",
      });

      expect(mockGetCart).not.toHaveBeenCalled();
    });

    it("returns the authenticated user's cart", async () => {
      const agent = await createAuthenticatedAgent();

      mockGetCart.mockResolvedValue(sampleCart);

      const response = await agent.get("/api/cart");

      expect(response.status).toBe(200);
      expect(response.body.cart).toEqual(sampleCart);

      expect(mockGetCart).toHaveBeenCalledWith(customer.id);
    });
  });

  describe("POST /api/cart/migrate", () => {
    const migrationData = {
      migrationId: "550e8400-e29b-41d4-a716-446655440000",
      items: [
        {
          bookId: "book-123",
          quantity: 1,
        },
        {
          bookId: "book-456",
          quantity: 1,
        },
      ],
    };

    it("returns 401 when the user is not authenticated", async () => {
      const response = await request(app)
        .post("/api/cart/migrate")
        .send(migrationData);

      expect(response.status).toBe(401);

      expect(mockMigrateGuestCart).not.toHaveBeenCalled();
    });

    it("migrates guest cart items into the authenticated user's cart", async () => {
      const agent = await createAuthenticatedAgent();

      mockMigrateGuestCart.mockResolvedValue(sampleCart);

      const response = await agent
        .post("/api/cart/migrate")
        .send(migrationData);

      expect(response.status).toBe(200);
      expect(response.body.cart).toEqual(sampleCart);

      expect(mockMigrateGuestCart).toHaveBeenCalledWith(
        customer.id,
        migrationData,
      );
    });

    it("rejects invalid migration data", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/migrate").send({
        migrationId: "invalid-uuid",
        items: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid cart migration data.");

      expect(mockMigrateGuestCart).not.toHaveBeenCalled();
    });

    it("rejects migration quantities greater than 1", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/migrate").send({
        ...migrationData,
        items: [
          {
            bookId: "book-123",
            quantity: 2,
          },
        ],
      });

      expect(response.status).toBe(400);
      expect(mockMigrateGuestCart).not.toHaveBeenCalled();
    });

    it("rejects duplicate book IDs", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/migrate").send({
        migrationId: migrationData.migrationId,
        items: [
          { bookId: "book-123", quantity: 1 },
          { bookId: "book-123", quantity: 1 },
        ],
      });

      expect(response.status).toBe(400);
      expect(mockMigrateGuestCart).not.toHaveBeenCalled();
    });

    it("forwards cart service errors to the route error handler", async () => {
      const agent = await createAuthenticatedAgent();

      mockMigrateGuestCart.mockRejectedValue(
        new CartServiceError("One or more books are unavailable.", 404),
      );

      const response = await agent
        .post("/api/cart/migrate")
        .send(migrationData);

      expect(response.status).toBe(404);

      expect(response.body.message).toBe("One or more books are unavailable.");
    });
  });

  describe("POST /api/cart/items", () => {
    it("adds a book to the authenticated user's cart", async () => {
      const agent = await createAuthenticatedAgent();

      mockAddItemToCart.mockResolvedValue(sampleCart);

      const response = await agent.post("/api/cart/items").send({
        bookId: "book-123",
        quantity: 1,
      });

      expect(response.status).toBe(200);
      expect(response.body.cart).toEqual(sampleCart);

      expect(mockAddItemToCart).toHaveBeenCalledWith(customer.id, {
        bookId: "book-123",
        quantity: 1,
      });
    });

    it("rejects quantities greater than 1", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/items").send({
        bookId: "book-123",
        quantity: 2,
      });

      expect(response.status).toBe(400);
      expect(mockAddItemToCart).not.toHaveBeenCalled();
    });

    it("rejects invalid cart item data", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/items").send({
        bookId: "",
        quantity: 0,
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid cart item data.");

      expect(mockAddItemToCart).not.toHaveBeenCalled();
    });

    it("rejects unexpected properties in the request", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent.post("/api/cart/items").send({
        bookId: "book-123",
        quantity: 1,
        price: 1,
      });

      expect(response.status).toBe(400);
      expect(mockAddItemToCart).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/cart/items/:bookId", () => {
    it("updates a cart item's quantity to 1", async () => {
      const agent = await createAuthenticatedAgent();

      mockUpdateCartItem.mockResolvedValue(sampleCart);

      const response = await agent
        .patch("/api/cart/items/book-123")
        .send({ quantity: 1 });

      expect(response.status).toBe(200);
      expect(response.body.cart).toEqual(sampleCart);

      expect(mockUpdateCartItem).toHaveBeenCalledWith(customer.id, "book-123", {
        quantity: 1,
      });
    });

    it("rejects quantities greater than 1", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent
        .patch("/api/cart/items/book-123")
        .send({ quantity: 2 });

      expect(response.status).toBe(400);
      expect(mockUpdateCartItem).not.toHaveBeenCalled();
    });

    it("rejects an invalid quantity", async () => {
      const agent = await createAuthenticatedAgent();

      const response = await agent
        .patch("/api/cart/items/book-123")
        .send({ quantity: 100 });

      expect(response.status).toBe(400);
      expect(mockUpdateCartItem).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/cart/items/:bookId", () => {
    it("removes a book from the cart", async () => {
      const agent = await createAuthenticatedAgent();

      mockRemoveCartItem.mockResolvedValue({
        ...sampleCart,
        items: [],
        itemCount: 0,
      });

      const response = await agent.delete("/api/cart/items/book-123");

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toEqual([]);

      expect(mockRemoveCartItem).toHaveBeenCalledWith(customer.id, "book-123");
    });
  });

  describe("DELETE /api/cart", () => {
    it("clears the authenticated user's cart", async () => {
      const agent = await createAuthenticatedAgent();

      mockClearCart.mockResolvedValue({
        ...sampleCart,
        items: [],
        itemCount: 0,
      });

      const response = await agent.delete("/api/cart");

      expect(response.status).toBe(200);
      expect(response.body.cart.items).toEqual([]);
      expect(response.body.cart.itemCount).toBe(0);

      expect(mockClearCart).toHaveBeenCalledWith(customer.id);
    });
  });
});