import { User } from "../models/userModel.js";
import { AuthRequest } from "../types/types.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { setAuthCookies } from "../utils/cookies.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/jwt.js";

import { Request, Response } from "express";
import { LoginUserDTO } from "../dtos/auth.dto.js";
import {
    RegisterUserCredentialsDTO,
    RegisterUserGoogleDTO,
} from "../dtos/user.dto.js";
import { checkExistingUser } from "../services/user.service.js";
import { clearAuthCookies } from "../utils/cookies.js";
import { verifyPassword } from "../utils/password.js";

export const registerUserWithCredentials = TryCatch(
  async (req: Request<{}, {}, RegisterUserCredentialsDTO>, res, next) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return next(new ErrorHandler("Please fill in all required fields", 400));
    }

    // Check if user already exists
    if (await checkExistingUser(email)) {
      return next(new ErrorHandler("Email already registered", 409));
    }

    // Create user
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      provider: "credentials",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  }
);

export const registerUserWithGoogle = TryCatch(
  async (req: Request<{}, {}, RegisterUserGoogleDTO>, res, next) => {
    const { name, email, googleId, photo } = req.body;

    // Check if user already exists
    if (await checkExistingUser(email)) {
      return next(new ErrorHandler("Email already registered", 409));
    }

    // Create user
    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      googleId,
      provider: "google",
      photo,
    });

    res.status(201).json({
      success: true,
      message: "Google sign-up successful",
    });
  }
);

export const loginUser = TryCatch(
  async (req: Request<{}, {}, LoginUserDTO>, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new ErrorHandler("Invalid credentials", 400));
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user || user.provider !== "credentials") {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    // Compare password
    const isMatch = await verifyPassword(user.password!, password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    // Generate token
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
    });
  }
);

export const logoutUser = (req: Request, res: Response) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const refreshAccessToken = TryCatch(
  async (req: AuthRequest, res, next) => {
    const token = req.cookies?.refresh_token;
    if (!token) throw new ErrorHandler("Unauthorized", 401);

    let payload: { id: string };
    try {
      payload = verifyRefreshToken(token) as { id: string };
    } catch {
      throw new ErrorHandler("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(payload.id);
    if (!user) throw new ErrorHandler("User not found", 401);

    // Generate new tokens
    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user.id });

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "Access token refreshed",
    });
  }
);
