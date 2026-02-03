import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AuthRequest } from "../types/types.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_ACCESS_SECRET or JWT_REFRESH_SECRET is missing");
}

type AccessTokenPayload = {
  id: string;
  role: "admin" | "seller" | "user";
};

type RefreshTokenPayload = {
  id: string;
};

// Creates short-lived JWT access token for authenticated user
export const generateAccessToken = (payload: AccessTokenPayload) => {
  const options: SignOptions = {
    expiresIn: "15m",
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
};

// Creates long-lived JWT refresh token
export const generateRefreshToken = (payload: RefreshTokenPayload) => {
  const options: SignOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

// Verifies JWT Access token
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
};

// Verifies JWT Refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
};

// Extract Access Token
export const extractAccessToken = (req: AuthRequest): string | null => {
  // Check Authorization header
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Check httpOnly cookie
  return req.cookies?.access_token ?? null;
};
