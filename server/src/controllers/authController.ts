import { User } from "../models/userModel.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { setAuthCookies } from "../utils/cookies.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import crypto from "crypto";
import { Request, Response } from "express";
import {
  ForgotPasswordDTO,
  LoginUserDTO,
  RegisterUserCredentialsDTO,
  RegisterUserGoogleDTO,
} from "../dtos/auth.dto.js";
import { getUserByEmail } from "../services/user.service.js";
import { clearAuthCookies } from "../utils/cookies.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { hashToken } from "../utils/utils.js";
import { AuthRequest } from "../types/types.js";

export const registerUserWithCredentials = TryCatch(
  async (req: Request<{}, {}, RegisterUserCredentialsDTO>, res, next) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return next(new ErrorHandler("Please fill in all required fields", 400));
    }

    // Check if user already exists
    if (await getUserByEmail(email)) {
      return next(new ErrorHandler("Email already registered", 409));
    }

    // Create user
    await User.create({
      email: email.toLowerCase().trim(),
      password: await hashPassword(password),
      provider: "credentials",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
    });
  },
);

export const registerUserWithGoogle = TryCatch(
  async (req: Request<{}, {}, RegisterUserGoogleDTO>, res, next) => {
    const { name, email, googleId, photo } = req.body;

    // Check if user already exists
    if (await getUserByEmail(email)) {
      return next(new ErrorHandler("Email already registered", 409));
    }

    // Create user
    await User.create({
      name: name?.trim() || "",
      email: email.toLowerCase().trim(),
      googleId,
      provider: "google",
      photo,
    });

    res.status(201).json({
      success: true,
      message: "Google sign-up successful",
    });
  },
);

export const loginUser = TryCatch(
  async (req: Request<{}, {}, LoginUserDTO>, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(new ErrorHandler("Invalid credentials", 400));
    }

    // Find user
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");
    if (!user || user.provider !== "credentials") {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

    console.log("success");

    // Block login until reset
    if (user.passwordNeedsReset) {
      return next(new ErrorHandler("Password reset required", 403));
    }

    // Compare password
    const isMatch = await verifyPassword(user.password!, password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid credentials", 401));
    }

      console.log("success2");

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
  },
);

export const loginUserWithGoogle = TryCatch(async (req, res, next) => {
  const { email, googleId, name, photo } = req.body;

  if (!email || !googleId) {
    return next(new ErrorHandler("Invalid Google login data", 400));
  }

  let user = await User.findOne({ email });

  // If user doesn't exist → create
  if (!user) {
    user = await User.create({
      email: email.toLowerCase().trim(),
      googleId,
      provider: "google",
      name: name?.trim() || "",
      photo,
    });
  }

  // Block deactivated users
  if (!user.isActive) {
    return next(new ErrorHandler("Account is deactivated", 403));
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: "Google login successful",
  });
});


export const logoutUser = (req: Request, res: Response) => {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Returns the currently authenticated user's session identity
// using JWT extracted from httpOnly cookies.
export const getSessionUser = TryCatch((req: AuthRequest, res, next) => {
  if (!req.user) {
    return next(new ErrorHandler("Not authenticated", 401));
  }

  res.status(200).json({
    success: true,
    data: req.user, // minimal safe user payload
  });
});

export const refreshAccessToken = TryCatch(async (req, res, next) => {
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
});

export const forgotPassword = TryCatch(
  async (req: Request<{}, {}, ForgotPasswordDTO>, res, next) => {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHandler("Email is required", 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Prevent email enumeration
      res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // DEV ONLY - log token instead of email
    console.log("RESET LINK:", `/reset-password/${resetToken}`);

    res.status(200).json({
      success: true,
      message: "Password reset link sent",
    });
  },
);

export const resetPassword = TryCatch(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new ErrorHandler("New password is required", 400));
  }

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid or expired reset token", 400));
  }

  user.password = await hashPassword(password);
  user.passwordNeedsReset = false;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});
