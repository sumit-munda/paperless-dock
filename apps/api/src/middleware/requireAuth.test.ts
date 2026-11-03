import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("../prisma.js", () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

import { requireAuth } from "./requireAuth.js";

describe("requireAuth", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const mockUser = {
    id: "user-123",
    name: "Jane Reader",
    email: "jane@example.com",
    role: "CUSTOMER",
  };

  beforeEach(() => {
    vi.resetAllMocks();

    req = {
      session: {
        userId: undefined,
        destroy: vi.fn((callback) => callback(null)),
      } as unknown as Request["session"],
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      locals: {},
    };

    next = vi.fn();
  });

  it("returns 401 when no authenticated user exists in the session", async () => {
    await requireAuth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required.",
    });

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the session belongs to an existing user", async () => {
    req.session!.userId = "user-123";

    mockFindUnique.mockResolvedValue(mockUser);

    await requireAuth(req as Request, res as Response, next);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: {
        id: "user-123",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    expect(res.locals!.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledOnce();
  });

  it("destroys the session when the user no longer exists", async () => {
    req.session!.userId = "deleted-user";

    mockFindUnique.mockResolvedValue(null);

    await requireAuth(req as Request, res as Response, next);

    expect(req.session!.destroy).toHaveBeenCalledOnce();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("passes database errors to the error handler", async () => {
    req.session!.userId = "user-123";

    const databaseError = new Error("Database connection failed");

    mockFindUnique.mockRejectedValue(databaseError);

    await requireAuth(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});
