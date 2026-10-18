import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../dist/app";
import { PACKAGE_NAME } from "@paperless-dock/shared";

describe("Backend API", () => {
  it("GET /health returns a healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      sharedPackage: PACKAGE_NAME,
    });
  });

  it("GET /api/books returns all books", async () => {
    const response = await request(app).get("/api/books");

    expect(response.status).toBe(200);

    expect(Array.isArray(response.body.books)).toBe(true);

    expect(response.body.books).toHaveLength(3);

    expect(response.body.books[0].id).toBe("book-001");
  });

  it("GET /api/books/:bookId returns an existing book", async () => {
    const response = await request(app).get("/api/books/book-001");

    expect(response.status).toBe(200);

    expect(response.body.book).toMatchObject({
      id: "book-001",
      title: "Atomic Habits",
      author: "James Clear",
    });
  });

  it("GET /api/books/:bookId returns 404 for a missing book", async () => {
    const response = await request(app).get("/api/books/nonexistent");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Book not found",
    });
  });
});
