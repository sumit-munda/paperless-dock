import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "../prisma.js";
import app from "../app.js";

describe("Library API integration tests", () => {
  let userId: string;
  let anotherUserId: string;
  let bookId: string;

  let email: string;
  let anotherEmail: string;
  let password: string;

  beforeAll(async () => {
    password = "LibraryPassword123!";

    email = `library-${randomUUID()}@example.com`;
    anotherEmail = `another-library-${randomUUID()}@example.com`;

    const passwordHash = await bcrypt.hash(password, 4);

    const user = await prisma.user.create({
      data: {
        name: "Library Test User",
        email,
        passwordHash,
      },
    });

    userId = user.id;

    const anotherUser = await prisma.user.create({
      data: {
        name: "Another Library Test User",
        email: anotherEmail,
        passwordHash,
      },
    });

    anotherUserId = anotherUser.id;

    bookId = randomUUID();

    await prisma.book.create({
      data: {
        id: bookId,
        title: "Library Test Book",
        slug: `library-test-book-${bookId}`,
        description: "Temporary book for library API tests.",
        price: "299.00",
        currency: "INR",
        status: "PUBLISHED",
      },
    });
  });

  async function clearTestData() {
    await prisma.readingProgress.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });

    await prisma.libraryItem.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        userId: {
          in: [userId, anotherUserId],
        },
      },
    });
  }

  afterAll(async () => {
    if (userId && anotherUserId) {
      await clearTestData();

      await prisma.user.deleteMany({
        where: {
          id: {
            in: [userId, anotherUserId],
          },
        },
      });
    }

    if (bookId) {
      await prisma.book.deleteMany({
        where: {
          id: bookId,
        },
      });
    }

    await prisma.$disconnect();
  });

  async function login(userEmail: string) {
    const agent = request.agent(app);

    const response = await agent.post("/api/auth/login").send({
      email: userEmail,
      password,
    });

    expect(response.status).toBe(200);

    return agent;
  }

  async function createLibraryItem(ownerId: string) {
    return prisma.libraryItem.create({
      data: {
        userId: ownerId,
        bookId,
      },
    });
  }

  it("rejects library retrieval when the user is not authenticated", async () => {
    await clearTestData();

    const response = await request(app).get("/api/library");

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
      message: "Authentication required.",
    });
  });

  it("returns an authenticated user's purchased books", async () => {
    await clearTestData();

    const libraryItem = await createLibraryItem(userId);

    const agent = await login(email);

    const response = await agent.get("/api/library");

    expect(response.status).toBe(200);

    expect(response.body.count).toBe(1);
    expect(response.body.library).toHaveLength(1);

    expect(response.body.library[0]).toMatchObject({
      id: libraryItem.id,
      book: {
        id: bookId,
        title: "Library Test Book",
        slug: `library-test-book-${bookId}`,
        description: "Temporary book for library API tests.",
        language: "en",
        pageCount: null,
        authors: [],
        categories: [],
      },
      readingProgress: {
        position: "start",
        percentage: 0,
        lastReadAt: null,
      },
    });
  });

  it("includes reading progress for a purchased book", async () => {
    await clearTestData();

    await createLibraryItem(userId);

    await prisma.readingProgress.create({
      data: {
        userId,
        bookId,
        position: "page:45",
        percentage: 35.5,
      },
    });

    const agent = await login(email);

    const response = await agent.get("/api/library");

    expect(response.status).toBe(200);

    expect(response.body.count).toBe(1);

    expect(response.body.library[0].readingProgress).toMatchObject({
      position: "page:45",
      percentage: 35.5,
    });

    expect(
      response.body.library[0].readingProgress.lastReadAt,
    ).not.toBeNull();
  });

  it("does not expose another user's purchased books", async () => {
    await clearTestData();

    await createLibraryItem(userId);

    const anotherAgent = await login(anotherEmail);

    const response = await anotherAgent.get("/api/library");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      library: [],
      count: 0,
    });
  });

  it("returns an empty library when the authenticated user has no purchases", async () => {
    await clearTestData();

    const agent = await login(email);

    const response = await agent.get("/api/library");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      library: [],
      count: 0,
    });
  });
});