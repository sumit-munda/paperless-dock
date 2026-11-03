import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { mockFindUnique, mockCompare } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCompare: vi.fn(),
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

import app from "../app.js";

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
    mockFindUnique.mockResolvedValue({
      id: "customer-123",
      name: "Jane Reader",
      email: "jane@example.com",
      role: "CUSTOMER",
    });

    mockCompare.mockResolvedValue(true);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "jane@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get("/api/admin/dashboard");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You do not have permission to access this resource.",
    });
  });

  it("returns 200 when an administrator accesses the dashboard", async () => {
    mockFindUnique.mockResolvedValue({
      id: "admin-123",
      name: "Admin User",
      email: "admin@example.com",
      role: "ADMIN",
    });

    mockCompare.mockResolvedValue(true);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
      email: "admin@example.com",
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);

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
