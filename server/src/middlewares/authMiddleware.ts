import { User } from "../models/userModel.js";
import { AuthPayload, AuthRequest, ExpressHandler } from "../types/types.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import { extractAccessToken, verifyAccessToken } from "../utils/jwt.js";

// Role-based access middleware
export const authorizeRoles = (allowedRoles: string[]) =>
  TryCatch(async (req, res, next) => {
    const id = req.query.id as string | undefined;

    if (!id) return next(new ErrorHandler("Please login first", 400));

    const user = await User.findById(id);

    if (!user) return next(new ErrorHandler("Invalid user ID", 401));

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ErrorHandler(
          `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
          403
        )
      );
    }

    // Attach user to request for later use in controllers
    (req as any).user = user;

    next();
  });

// Specific middlewares using authorizeRoles
export const adminOnly = authorizeRoles(["admin"]);
export const sellerOnly = authorizeRoles(["seller"]);
export const eitherAdminOrSeller = authorizeRoles(["admin", "seller"]);
export const userOnly = authorizeRoles(["user"]);

// Passive (Global) Authentication Middleware
export const verifyAuthentication: ExpressHandler = (
  req: AuthRequest,
  res,
  next
) => {
  const token = extractAccessToken(req);

  req.user = token ? (verifyAccessToken(token) as AuthPayload) : null;

  next();
};

// To test Credentials Authentication Middleware
export const isAuthenticated = TryCatch(async (req: AuthRequest, res, next) => {
  const token = extractAccessToken(req);
  if (!token) return next(new ErrorHandler("Unauthorized", 401));

  const payload = verifyAccessToken(token) as AuthPayload;
  req.user = payload;

  next();
});
