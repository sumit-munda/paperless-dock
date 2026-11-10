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

describe("GET /api/auth/protected", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    const response = await request(app).get("/api/auth/protected");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required.",
    });

    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's public details", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-123",
      name: "Jane Reader",
      email: "jane@example.com",
      role: "CUSTOMER",
    });

    mockCompare.mockResolvedValue(true);

    const agent = request.agent(app);

    // Obtain a CSRF token and establish the session cookie.
    const csrfResponse = await agent.get("/api/auth/csrf-token");

    expect(csrfResponse.status).toBe(200);

    const csrfToken = csrfResponse.body.csrfToken;

    // Login with the CSRF token.
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({
        email: "jane@example.com",
        password: "Password123!",
      });

    expect(loginResponse.status).toBe(200);

    const response = await agent.get("/api/auth/protected");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      message: "You are authenticated.",
      user: {
        id: "user-123",
        name: "Jane Reader",
        email: "jane@example.com",
        role: "CUSTOMER",
      },
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });
});
