import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { S3ServiceException } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const { getStoredPdfMock, getStoredPdfSizeMock } = vi.hoisted(() => ({
  getStoredPdfMock: vi.fn(),
  getStoredPdfSizeMock: vi.fn(),
}));

vi.mock("../services/storage.service.js", () => ({
  getStoredPdf: getStoredPdfMock,
  getStoredPdfSize: getStoredPdfSizeMock,
}));

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
    await prisma.book.update({
      where: { id: bookId },
      data: { contentReference: null },
    });

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

    getStoredPdfMock.mockReset();
    getStoredPdfSizeMock.mockReset();
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

    const initialCsrfResponse = await agent.get("/api/auth/csrf-token");
    expect(initialCsrfResponse.status).toBe(200);

    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", initialCsrfResponse.body.csrfToken)
      .send({
        email: userEmail,
        password,
      });

    expect(loginResponse.status).toBe(200);

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

  async function attachPdfToBook() {
    await prisma.book.update({
      where: { id: bookId },
      data: {
        contentReference: `books/${bookId}/test-file.pdf`,
      },
    });
  }

  function mockPdfResponse(contentRange?: string, contentLength = 20) {
    const pdfBuffer = Buffer.alloc(contentLength);

    pdfBuffer.write("%PDF-", 0, "ascii");

    getStoredPdfMock.mockResolvedValue({
      Body: Readable.from([pdfBuffer]),
      ContentLength: contentLength,
      ...(contentRange ? { ContentRange: contentRange } : {}),
    });
  }

  function createInvalidRangeError() {
    return new S3ServiceException({
      name: "InvalidRange",
      message: "The requested byte range is not satisfiable.",
      $fault: "client",
      $metadata: {
        httpStatusCode: 416,
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
        hasContent: false,
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

  it("indicates PDF availability without exposing the storage key", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    const agent = await login(email);

    const response = await agent.get("/api/library");

    expect(response.status).toBe(200);

    expect(response.body.library[0].book.hasContent).toBe(true);

    expect(response.body.library[0].book).not.toHaveProperty(
      "contentReference",
    );

    expect(JSON.stringify(response.body)).not.toContain(
      `books/${bookId}/test-file.pdf`,
    );
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

    expect(response.body.library[0].readingProgress.lastReadAt).not.toBeNull();
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

  it("rejects PDF access when the user is not authenticated", async () => {
    await clearTestData();

    const response = await request(app).get(`/api/library/${bookId}/content`);

    expect(response.status).toBe(401);

    expect(getStoredPdfMock).not.toHaveBeenCalled();
  });

  it("does not allow a user to access another user's PDF", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    const anotherAgent = await login(anotherEmail);

    const response = await anotherAgent.get(`/api/library/${bookId}/content`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Book not found in your library.");

    expect(getStoredPdfMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the purchased book has no uploaded PDF", async () => {
    await clearTestData();

    await createLibraryItem(userId);

    const agent = await login(email);

    const response = await agent.get(`/api/library/${bookId}/content`);

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Book content is not available.");

    expect(getStoredPdfMock).not.toHaveBeenCalled();
  });

  it("streams a purchased book's PDF to its owner", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    mockPdfResponse();

    const agent = await login(email);

    const response = await agent.get(`/api/library/${bookId}/content`);

    expect(response.status).toBe(200);

    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.headers["accept-ranges"]).toBe("bytes");

    expect(response.headers["cache-control"]).toBe("private, no-store");

    expect(getStoredPdfMock).toHaveBeenCalledWith(
      `books/${bookId}/test-file.pdf`,
      undefined,
    );
  });

  it("supports PDF byte-range requests", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    mockPdfResponse("bytes 0-9/100", 10);

    const agent = await login(email);

    const response = await agent
      .get(`/api/library/${bookId}/content`)
      .set("Range", "bytes=0-9");

    expect(response.status).toBe(206);

    expect(response.headers["accept-ranges"]).toBe("bytes");
    expect(response.headers["content-range"]).toBe("bytes 0-9/100");
    expect(response.headers["content-length"]).toBe("10");

    expect(getStoredPdfMock).toHaveBeenCalledWith(
      `books/${bookId}/test-file.pdf`,
      "bytes=0-9",
    );
  });

  it("rejects malformed Range headers without contacting storage", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    const agent = await login(email);

    const response = await agent
      .get(`/api/library/${bookId}/content`)
      .set("Range", "bytes=abc");

    expect(response.status).toBe(400);

    expect(getStoredPdfMock).not.toHaveBeenCalled();
    expect(getStoredPdfSizeMock).not.toHaveBeenCalled();
  });

  it("rejects multiple byte ranges without contacting storage", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    const agent = await login(email);

    const response = await agent
      .get(`/api/library/${bookId}/content`)
      .set("Range", "bytes=0-10,20-30");

    expect(response.status).toBe(400);

    expect(getStoredPdfMock).not.toHaveBeenCalled();
    expect(getStoredPdfSizeMock).not.toHaveBeenCalled();
  });

  it("returns 416 with the total PDF size when storage rejects a byte range", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    getStoredPdfMock.mockRejectedValue(createInvalidRangeError());
    getStoredPdfSizeMock.mockResolvedValue(100);

    const agent = await login(email);

    const response = await agent
      .get(`/api/library/${bookId}/content`)
      .set("Range", "bytes=500-600");

    expect(response.status).toBe(416);

    expect(response.headers["content-range"]).toBe("bytes */100");

    expect(response.body.message).toBe(
      "Requested PDF byte range is not satisfiable.",
    );

    expect(getStoredPdfMock).toHaveBeenCalledTimes(1);
    expect(getStoredPdfSizeMock).toHaveBeenCalledWith(
      `books/${bookId}/test-file.pdf`,
    );
  });

  it("does not return a full PDF when storage ignores a Range request", async () => {
    await clearTestData();

    await createLibraryItem(userId);
    await attachPdfToBook();

    mockPdfResponse();

    const agent = await login(email);

    const response = await agent
      .get(`/api/library/${bookId}/content`)
      .set("Range", "bytes=0-9");

    expect(response.status).toBe(500);

    expect(getStoredPdfMock).toHaveBeenCalledTimes(1);
    expect(getStoredPdfSizeMock).not.toHaveBeenCalled();
  });
});
