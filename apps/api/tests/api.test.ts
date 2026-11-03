import { PACKAGE_NAME } from "@paperless-dock/shared";
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "../src/generated/prisma/client.js";

const { mockFindMany, mockFindFirst, mockUserCreate, mockUserFindUnique } =
  vi.hoisted(() => ({
    mockFindMany: vi.fn(),
    mockFindFirst: vi.fn(),
    mockUserCreate: vi.fn(),
    mockUserFindUnique: vi.fn(),
  }));

vi.mock("../src/prisma.ts", () => ({
  default: {
    book: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
    },
    user: {
      create: mockUserCreate,
      findUnique: mockUserFindUnique,
    },
  },
}));

vi.mock("../src/session.js", async () => {
  const sessionModule = await import("express-session");

  return {
    default: sessionModule.default({
      name: "paperless-dock.sid",
      secret: "test-session-secret-at-32-characters",
      resave: false,
      saveUninitialized: false,
      store: new sessionModule.default.MemoryStore(),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60,
      },
    }),
  };
});

vi.mock("bcryptjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("bcryptjs")>();

  return {
    ...actual,
    default: actual.default,
  };
});

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

import app from "../src/app";
import { email } from "zod";

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

  it("GET /api/books/:bookId returns 404 for an unpublished book", async () => {
    mockFindFirst.mockResolvedValue(null);

    const response = await request(app).get("/api/books/draft-book");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      message: "Book not found",
    });
  });
});

const registeredUser = {
  id: "user-001",
  name: "Test User",
  email: "test@example.com",
  role: "CUSTOMER",
  avatar: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const existingUser = {
  id: "user-001",
  name: "Test User",
  email: "test@example.com",
  passwordHash: "$2b$12$mockPasswordHash",
  role: "CUSTOMER",
  avatar: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("POST /api/auth/register", () => {
  it("creates a customer account and returns safe user information", async () => {
    mockUserCreate.mockResolvedValue(registeredUser);

    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "a-strong-password-123",
    });

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("Account created successfully.");

    expect(response.body.user).toEqual({
      id: "user-001",
      name: "Test User",
      email: "test@example.com",
      role: "CUSTOMER",
      avatar: null,
      createdAt: registeredUser.createdAt.toISOString(),
      updatedAt: registeredUser.updatedAt.toISOString(),
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");

    expect(JSON.stringify(response.body)).not.toContain(
      "a-strong-password-123",
    );

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
  });

  it("hashes the password before saving the user", async () => {
    mockUserCreate.mockImplementation(async ({ data }) => {
      return {
        ...registeredUser,
        email: data.email,
      };
    });

    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "a-strong-password-123",
    });

    expect(response.status).toBe(201);
    expect(mockUserCreate).toHaveBeenCalledTimes(1);

    const createArguments = mockUserCreate.mock.calls[0][0];
    const savedPasswordHash = createArguments.data.passwordHash;

    expect(savedPasswordHash).toBeDefined();
    expect(savedPasswordHash).not.toBe("a-strong-password-123");

    await expect(
      bcrypt.compare("a-strong-password-123", savedPasswordHash),
    ).resolves.toBe(true);
  });

  it("normalizes the email address before creating the account", async () => {
    mockUserCreate.mockResolvedValue(registeredUser);

    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "  TEST@EXAMPLE.COM  ",
      password: "a-strong-password-123",
    });

    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
        }),
      }),
    );
  });

  it("rejects invalid registration data", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "A",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe("Invalid registration details.");

    expect(response.body.errors.length).toBeGreaterThan(0);

    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("does not allow registration requests to assign the ADMIN role", async () => {
    mockUserCreate.mockResolvedValue(registeredUser);

    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "a-strong-password-123",
      role: "ADMIN",
    });

    const createdArguments = mockUserCreate.mock.calls[0][0];

    expect(createdArguments.data).not.toHaveProperty("role");
  });

  it("returns 409 when the email address already exists", async () => {
    mockUserCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.19.3",
        meta: {
          target: ["email"],
        },
      }),
    );

    const response = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "a-strong-password-123",
    });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      message: "An account with this email address already exists.",
    });
  });
});

describe("POST /api/auth/login", () => {
  it("rejects invalid login input", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "" });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      message: "Invalid email or password.",
    });

    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("rejects an unknown email address", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "a-strong-password-123",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      message: "Invalid email or password.",
    });
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await bcrypt.hash("correct-password-123", 4);

    mockUserFindUnique.mockResolvedValue({
      ...existingUser,
      passwordHash,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "incorrect-password-123",
    });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      message: "Invalid email or password.",
    });
  });

  it("logs in a user and creates an authenticated session", async () => {
    const password = "correct-password-123";
    const passwordHash = await bcrypt.hash(password, 4);

    mockUserFindUnique.mockResolvedValue({
      ...existingUser,
      passwordHash,
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Login successful.");

    expect(response.body.user).toMatchObject({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");

    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("paperless-dock.sid");

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when the user is not authenticated", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Not authenticated." });
  });

  it("returns the authenticated user after login", async () => {
    const password = "correct-password-123";
    const passwordHash = await bcrypt.hash(password, 4);

    mockUserFindUnique
      .mockResolvedValueOnce({
        ...existingUser,
        passwordHash,
      })
      .mockResolvedValueOnce(registeredUser);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "test@example.com",
      password,
    });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get("/api/auth/me");

    expect(response.status).toBe(200);

    expect(response.body.user).toMatchObject({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    });

    expect(response.body.user).not.toHaveProperty("passwordHash");

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: existingUser.id },
      select: expect.objectContaining({
        id: true,
        name: true,
        email: true,
      }),
    });
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("logs out successfully", async () => {
    const password = "correct-password-123";
    const passwordHash = await bcrypt.hash(password, 4);

    mockUserFindUnique
      .mockResolvedValueOnce({
        ...existingUser,
        passwordHash,
      })
      .mockResolvedValueOnce(registeredUser);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "test@example.com",
      password,
    });

    expect(loginResponse.status).toBe(200);

    const logoutResponse = await agent.post("/api/auth/logout");

    expect(logoutResponse.headers["set-cookie"]).toBeDefined();
    expect(logoutResponse.headers["set-cookie"][0]).toContain(
      "paperless-dock.sid",
    );

    const meResponse = await agent.get("/api/auth/me");

    expect(meResponse.status).toBe(401);
    expect(meResponse.body).toEqual({ message: "Not authenticated." });
  });
});
