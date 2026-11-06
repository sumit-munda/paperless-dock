import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { mockUploadBookPdf, mockDeleteStoredObject } = vi.hoisted(
  () => ({
    mockUploadBookPdf: vi.fn(),
    mockDeleteStoredObject: vi.fn(),
  }),
);

// Mock R2 storage. PostgreSQL remains real.
vi.mock("../services/storage.service.js", () => ({
  uploadBookPdf: mockUploadBookPdf,
  deleteStoredObject: mockDeleteStoredObject,
}));

import prisma from "../prisma.js";
import app from "../app.js";

describe("Admin PDF upload integration tests", () => {
  let adminId: string;
  let customerId: string;
  let bookId: string;

  let adminEmail: string;
  let customerEmail: string;
  let password: string;

  const validPdf = Buffer.from("%PDF-1.4\nIntegration test PDF");

  beforeAll(async () => {
    password = "AdminUploadPassword123!";

    adminEmail = `admin-upload-${randomUUID()}@example.com`;
    customerEmail = `customer-upload-${randomUUID()}@example.com`;

    const passwordHash = await bcrypt.hash(password, 4);

    const admin = await prisma.user.create({
      data: {
        name: "Integration Admin",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    adminId = admin.id;

    const customer = await prisma.user.create({
      data: {
        name: "Integration Customer",
        email: customerEmail,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    customerId = customer.id;

    bookId = randomUUID();

    await prisma.book.create({
      data: {
        id: bookId,
        title: "Admin Upload Test Book",
        slug: `admin-upload-test-${bookId}`,
        description: "Temporary book for admin upload tests.",
        price: "199.00",
        currency: "INR",
        status: "PUBLISHED",
      },
    });
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUploadBookPdf.mockImplementation(
      async (id: string, buffer: Buffer) => {
        if (
          buffer.length < 5 ||
          buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
        ) {
          throw new Error("The uploaded file is not a valid PDF.");
        }

        return `books/${id}/${randomUUID()}.pdf`;
      },
    );

    mockDeleteStoredObject.mockResolvedValue(undefined);

    await prisma.book.update({
      where: {
        id: bookId,
      },
      data: {
        contentReference: null,
      },
    });
  });

  afterAll(async () => {
    if (bookId) {
      await prisma.book.deleteMany({
        where: {
          id: bookId,
        },
      });
    }

    if (adminId || customerId) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [adminId, customerId].filter(Boolean),
          },
        },
      });
    }

    await prisma.$disconnect();
  });

  async function login(email: string) {
    const agent = request.agent(app);

    const response = await agent.post("/api/auth/login").send({
      email,
      password,
    });

    expect(response.status).toBe(200);

    return agent;
  }

  it("rejects unauthenticated PDF uploads", async () => {
    const response = await request(app)
      .post(`/api/admin/books/${bookId}/content`)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(401);

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
  });

  it("rejects PDF uploads from customers", async () => {
    const agent = await login(customerEmail);

    const response = await agent
      .post(`/api/admin/books/${bookId}/content`)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(403);

    expect(mockUploadBookPdf).not.toHaveBeenCalled();
  });

  it("allows administrators to upload PDFs and persists the object key", async () => {
    const agent = await login(adminEmail);

    const response = await agent
      .post(`/api/admin/books/${bookId}/content`)
      .attach("file", validPdf, {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "Book PDF uploaded successfully.",
      bookId,
      contentUploaded: true,
    });

    const updatedBook = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      select: {
        contentReference: true,
      },
    });

    expect(updatedBook?.contentReference).toMatch(
      new RegExp(`^books/${bookId}/.+\\.pdf$`),
    );

    expect(mockUploadBookPdf).toHaveBeenCalledOnce();

    expect(mockDeleteStoredObject).not.toHaveBeenCalled();
  });

  it("replaces an existing PDF and deletes the previous object", async () => {
    const oldObjectKey = `books/${bookId}/old-content.pdf`;

    await prisma.book.update({
      where: {
        id: bookId,
      },
      data: {
        contentReference: oldObjectKey,
      },
    });

    const agent = await login(adminEmail);

    const response = await agent
      .post(`/api/admin/books/${bookId}/content`)
      .attach("file", validPdf, {
        filename: "replacement.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(200);

    const updatedBook = await prisma.book.findUnique({
      where: {
        id: bookId,
      },
      select: {
        contentReference: true,
      },
    });

    expect(updatedBook?.contentReference).not.toBe(oldObjectKey);

    expect(mockDeleteStoredObject).toHaveBeenCalledWith(oldObjectKey);
  });
});