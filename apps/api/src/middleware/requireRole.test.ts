import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "./requireRole.js";

describe("requireRole", () => {
  const createMocks = (role?: "CUSTOMER" | "ADMIN") => {
    const req = {} as Request;

    const res = {
      locals: role ? { user: { role } } : {},
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  };

  it("allows an administrator to continue", () => {
    const { req, res, next } = createMocks("ADMIN");

    requireRole("ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a customer accessing an admin-only route", () => {
    const { req, res, next } = createMocks("CUSTOMER");

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "You do not have permission to access this resource.",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("allows customers when both roles are permitted", () => {
    const { req, res, next } = createMocks("CUSTOMER");

    requireRole("CUSTOMER", "ADMIN")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when no authenticated user exists", () => {
    const { req, res, next } = createMocks();

    requireRole("ADMIN")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Authentication required.",
    });

    expect(next).not.toHaveBeenCalled();
  });
});