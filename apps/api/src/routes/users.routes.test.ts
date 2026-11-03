import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { mockFindUnique, mockUpdate, mockCompare } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockCompare: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockCompare,
    hash: vi.fn(),
  },
}));

import app from "../app.js";

const customer = {
  id: "customer-123",
  name: "Jane Reader",
  email: "jane@example.com",
  role: "CUSTOMER",
};

const authenticatedUser = {
  ...customer,
  avatar: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
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

describe("GET /api/users/me", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required.",
    });
  });

  it("returns the authenticated user's profile", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    const response = await agent.get("/api/users/me");

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: customer.role,
      avatar: null,
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });
});

describe("PATCH /api/users/me", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const response = await request(app)
      .patch("/api/users/me")
      .send({ name: "Updated Name" });

    expect(response.status).toBe(401);
  });

  it("updates the user's name", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    mockUpdate.mockResolvedValue({
      ...authenticatedUser,
      name: "Updated Name",
    });

    const response = await agent
      .patch("/api/users/me")
      .send({ name: "Updated Name" });

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe("Updated Name");

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: customer.id },
        data: { name: "Updated Name" },
      }),
    );

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("updates the user's avatar", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    mockUpdate.mockResolvedValue({
      ...authenticatedUser,
      avatar: "https://example.com/avatar.png",
    });

    const response = await agent
      .patch("/api/users/me")
      .send({ avatar: "https://example.com/avatar.png" });

    expect(response.status).toBe(200);
    expect(response.body.user.avatar).toBe(
      "https://example.com/avatar.png",
    );
  });

  it("allows the user to remove their avatar", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    mockUpdate.mockResolvedValue({
      ...authenticatedUser,
      avatar: null,
    });

    const response = await agent
      .patch("/api/users/me")
      .send({ avatar: null });

    expect(response.status).toBe(200);
    expect(response.body.user.avatar).toBeNull();
  });

  it("rejects invalid profile information", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    const response = await agent
      .patch("/api/users/me")
      .send({ name: "J" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid profile information.");

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects attempts to modify email or role", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    const response = await agent
      .patch("/api/users/me")
      .send({
        name: "Updated Name",
        email: "new@example.com",
        role: "ADMIN",
      });

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty update request", async () => {
    const agent = await createAuthenticatedAgent();

    mockFindUnique.mockResolvedValue(authenticatedUser);

    const response = await agent.patch("/api/users/me").send({});

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});