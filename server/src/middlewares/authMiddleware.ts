import { User } from "../models/userModel.js";
import { AuthPayload, AuthRequest, ExpressHandler } from "../types/types.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { extractAccessToken, verifyAccessToken } from "../utils/jwt.js";

// Passive (Global) Authentication Middleware
// Attaches user payload if token exists
export const verifyAuthentication: ExpressHandler = (
  req: AuthRequest,
  _res,
  next,
) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const token = extractAccessToken(req);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token) as AuthPayload;

    if (!payload?.id || !payload?.role) {
      return next();
    }

    req.user = {
      id: payload.id,
      role: payload.role,
    };
  } catch {
    // Silent fail - invalid or expired token
  }

  next();
};

// Strict authentication (Must be logged in)
// To test Credentials Authentication Middleware
export const isAuthenticated = TryCatch(
  async (req: AuthRequest, _res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    const token = extractAccessToken(req);

    if (!token) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const payload = verifyAccessToken(token) as AuthPayload;

    if (!payload?.id || !payload?.role) {
      return next(new ErrorHandler("Invalid token", 401));
    }

    // Validate user existence & status
    const user = await User.findById(payload.id).select("role isActive");

    if (!user) {
      return next(new ErrorHandler("User not found", 401));
    }

    if (!user.isActive) {
      return next(new ErrorHandler("Account is deactivated", 403));
    }

    // Attach only safe, verified payload
    req.user = {
      id: payload.id,
      role: user.role,
    };

    next();
  },
);

// Role-based access middleware
export const authorizeRoles = (
  ...allowedRoles: Array<"admin" | "seller" | "user">
) =>
  TryCatch(async (req: AuthRequest, _res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
          403,
        ),
      );
    }

    next();
  });

// Specific middlewares using authorizeRoles
export const adminOnly = authorizeRoles("admin");
export const sellerOnly = authorizeRoles("seller");
export const eitherAdminOrSeller = authorizeRoles("admin", "seller");
export const userOnly = authorizeRoles("user");