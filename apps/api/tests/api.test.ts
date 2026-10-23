import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { PACKAGE_NAME } from "@paperless-dock/shared";
import { response } from "express";

const { mockFindMany, mockFindFirst } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
}));

vi.mock("../src/prisma.ts", () => ({
  default: {
    book: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
  },
}));

const publishedBook = {
  id: "book-001",
  title: "Atomic Habits",
  description:
    "A practical guide to building good habits and breaking bad ones.",
  price: "499",
  coverImage: "https://placehold.co/300x420?text=Atomic+Habits",
  rating: 4.8,
  status: "PUBLISHED",
  authors: [
    {
      author: {
        name: "James Clear",
      },
    },
  ],
  categories: [
    {
      category: {
        name: "Self-Development",
      },
    },
  ],
};

const expectedBook = {
  id: "book-001",
  title: "Atomic Habits",
  author: "James Clear",
  category: "Self-Development",
  description:
    "A practical guide to building good habits and breaking bad ones.",
  price: 499,
  coverImage: "https://placehold.co/300x420?text=Atomic+Habits",
  rating: 4.8,
};

describe("Backend API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /health returns a healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      sharedPackage: PACKAGE_NAME,
    });
  });

  it("GET /api/books returns published books in the expected format", async () => {
    mockFindMany.mockResolvedValue([publishedBook]);

    const response = await request(app).get("/api/books");

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body.books)).toBe(true);

    expect(response.body.books).toHaveLength(1);

    expect(response.body.books[0]).toEqual(expectedBook);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "PUBLISHED",
        },
      }),
    );
  });

  it("GET /api/books includes related author and category names", async () => {
    mockFindMany.mockResolvedValue([publishedBook]);

    const response = await request(app).get("/api/books");

    expect(response.body.books[0].author).toBe("James Clear");

    expect(response.body.books[0].category).toBe("Self-Development");
  });

  it("GET /api/books/:bookId returns an existing published book", async () => {
    mockFindFirst.mockResolvedValue(publishedBook);

    const response = await request(app).get("/api/books/book-001");

    expect(response.status).toBe(200);

    expect(response.body.book).toEqual(expectedBook);

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "book-001",
          status: "PUBLISHED",
        },
      }),
    );
  });

  it("GET /api/books/:bookId returns 404 for a missing book", async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await request(app).get("/api/books/nonexistent");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Book not found",
    });
  });

  it("GET /api/books returns 500 when the database query fails", async () => {
    mockFindMany.mockRejectedValue(new Error("secret database details"));

    const response = await request(app).get("/api/books");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Internal server error",
    });

    expect(JSON.stringify(response.body)).not.toContain(
      "secret database details",
    );
  });

  it("GET /api/books/:bookId returns 500 when the database query fails", async () => {
    mockFindFirst.mockRejectedValue(new Error("secret database details"));

    const response = await request(app).get("/api/books/book-001");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
      message: "Internal server error",
    });

    expect(JSON.stringify(response.body)).not.toContain(
      "secret database details",
    );
  });
});

it("GET /api/books/:bookId returns 404 for an unpublished book", async () => {
  mockFindFirst.mockResolvedValue(null);

  const response = await request(app).get("/api/books/draft-book");

  expect(response.status).toBe(404);

  expect(response.body).toEqual({
    message: "Book not found",
  });
});
