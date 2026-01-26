import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../types/types.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT_SECRETS are missing");
}

// Creates short-lived JWT access token for authenticated user
export const generateAccessToken = (payload: {
  id: string;
  role?: "admin" | "seller" | "user";
}) => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

// Creates long-lived JWT refresh token
export const generateRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
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
export const extractAccessToken = (req: AuthRequest) => {
  // Check Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    console.log(req.headers.authorization.split(" ")[1]);

    return req.headers.authorization.split(" ")[1];
  }

  // Check cookie
  if (req.cookies?.access_token) {
    console.log(req.cookies?.access_token);

    return req.cookies?.access_token;
  }

  return null; // no token found
};
