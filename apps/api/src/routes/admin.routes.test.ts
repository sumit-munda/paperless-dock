import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const {
  mockFindUnique,
  mockBookFindUnique,
  mockBookUpdate,
  mockCompare,
  mockUploadBookPdf,
  mockDeleteStoredObject,
} = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockBookFindUnique: vi.fn(),
  mockBookUpdate: vi.fn(),
  mockCompare: vi.fn(),
  mockUploadBookPdf: vi.fn(),
  mockDeleteStoredObject: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
    book: {
      findUnique: mockBookFindUnique,
      update: mockBookUpdate,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockCompare,
    hash: vi.fn(),
  },
}));

vi.mock("../services/storage.service.js", () => ({
  uploadBookPdf: mockUploadBookPdf,
  deleteStoredObject: mockDeleteStoredObject,
}));

import app from "../app.js";

const validPdf = Buffer.from("%PDF-1.4\nTest PDF content");

async function loginAsAdmin() {
  mockFindUnique.mockResolvedValue({
    id: "admin-123",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
  });

  mockCompare.mockResolvedValue(true);

  const agent = request.agent(app);

  const initialCsrfResponse = await agent.get("/api/auth/csrf-token");

  expect(initialCsrfResponse.status).toBe(200);

  const loginResponse = await agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", initialCsrfResponse.body.csrfToken)
    .send({
      email: "admin@example.com",
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  const csrfResponse = await agent.get("/api/auth/csrf-token");

  expect(csrfResponse.status).toBe(200);

  return {
    agent,
    csrfToken: csrfResponse.body.csrfToken as string,
  };
}

async function loginAsCustomer() {
  mockFindUnique.mockResolvedValue({
    id: "customer-123",
    name: "Jane Reader",
    email: "jane@example.com",
    role: "CUSTOMER",
  });

  mockCompare.mockResolvedValue(true);

  const agent = request.agent(app);

  const initialCsrfResponse = await agent.get("/api/auth/csrf-token");

  expect(initialCsrfResponse.status).toBe(200);

  const loginResponse = await agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", initialCsrfResponse.body.csrfToken)
    .send({
      email: "jane@example.com",
      password: "Password123!",
    });

  expect(loginResponse.status).toBe(200);

  const csrfResponse = await agent.get("/api/auth/csrf-token");

  expect(csrfResponse.status).toBe(200);

  return {
    agent,
    csrfToken: csrfResponse.body.csrfToken as string,
  };
}

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const response = await request(app).get("/api/admin/dashboard");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required.",
    });

    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when a customer accesses the admin dashboard", async () => {
    const { agent } = await loginAsCustomer();

    const response = await agent.get("/api/admin/dashboard");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You do not have permission to access this resource.",
    });
  });

  it("returns 200 when an administrator accesses the dashboard", async () => {
    const { agent } = await loginAsAdmin();

    const response = await agent.get("/api/admin/dashboard");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Welcome to the admin dashboard.",
      user: {
        id: "admin-123",
        name: "Admin User",
        email: "admin@example.com",
        role: "ADMIN",
      },
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });
});

describe("POST /api/admin/books/:bookId/content", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock PDF signature validation without contacting R2.
    mockUploadBookPdf.mockImplementation(
      async (_bookId: string, buffer: Buffer) => {
        if (
          buffer.length < 5 ||
          buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
        ) {
          throw new Error("The uploaded file is not a valid PDF.");
        }

        return "books/book-123/new-content.pdf";
      },
    );

    mockBookUpdate.mockResolvedValue({});
    mockDeleteStoredObject.mockResolvedValue(undefined);
  });

  it("returns 403 when an unauthenticated user attempts an upload without a CSRF token", async () => {
    const response = await request(app)
      .post("/api/admin/books/book-123/content")
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Invalid or missing CSRF token.");

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
    expect(mockBookFindUnique).not.toHaveBeenCalled();
  });

  it("returns 403 when a customer attempts an upload", async () => {
    const { agent, csrfToken } = await loginAsCustomer();

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(403);

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
    expect(mockBookFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 when no PDF file is provided", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Please upload a PDF file.");

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
  });

  it("rejects a file without a valid PDF signature", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    mockBookFindUnique.mockResolvedValue({
      id: "book-123",
      contentReference: null,
    });

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", Buffer.from("This is not a PDF"), {
        filename: "fake.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("The uploaded file is not a valid PDF.");

    expect(mockBookUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the requested book does not exist", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    mockBookFindUnique.mockResolvedValue(null);

    const response = await agent
      .post("/api/admin/books/nonexistent/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Book not found.");

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
  });

  it("uploads a PDF and saves its object key in the database", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    mockBookFindUnique.mockResolvedValue({
      id: "book-123",
      contentReference: null,
    });

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Book PDF uploaded successfully.",
      bookId: "book-123",
      contentUploaded: true,
    });

    expect(mockUploadBookPdf).toHaveBeenCalledWith(
      "book-123",
      expect.any(Buffer),
    );

    expect(mockBookUpdate).toHaveBeenCalledWith({
      where: {
        id: "book-123",
      },
      data: {
        contentReference: "books/book-123/new-content.pdf",
      },
    });

    expect(mockDeleteStoredObject).not.toHaveBeenCalled();
  });

  it("deletes the previous PDF after successfully replacing it", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    mockBookFindUnique.mockResolvedValue({
      id: "book-123",
      contentReference: "books/book-123/old-content.pdf",
    });

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", validPdf, {
        filename: "replacement.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);

    expect(mockBookUpdate).toHaveBeenCalled();
    expect(mockDeleteStoredObject).toHaveBeenCalledWith(
      "books/book-123/old-content.pdf",
    );
  });

  it("does not delete the old PDF when the database update fails", async () => {
    const { agent, csrfToken } = await loginAsAdmin();

    mockBookFindUnique.mockResolvedValue({
      id: "book-123",
      contentReference: "books/book-123/old-content.pdf",
    });

    mockBookUpdate.mockRejectedValue(new Error("Database update failed."));

    const response = await agent
      .post("/api/admin/books/book-123/content")
      .set("X-CSRF-Token", csrfToken)
      .attach("file", validPdf, {
        filename: "replacement.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(500);

    // The newly uploaded object is cleaned up.
    expect(mockDeleteStoredObject).toHaveBeenCalledWith(
      "books/book-123/new-content.pdf",
    );

    // The previous object must remain untouched.
    expect(mockDeleteStoredObject).not.toHaveBeenCalledWith(
      "books/book-123/old-content.pdf",
    );
  });
});
