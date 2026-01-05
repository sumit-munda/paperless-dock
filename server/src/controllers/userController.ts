import { Request } from "express";
import { RegisterUserCredentialsDTO, RegisterUserGoogleDTO } from "../dtos/user.dto.js";
import { User } from "../models/userModel.js";
import { checkExistingUser } from "../services/user.service.js";
import { TryCatch } from "../utils/asyncHandler.js";
import { ErrorHandler } from "../utils/errorHandler.js";

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
    });

    res.status(201).json({
      success: true,
      message: "Google sign-up successful",
    });
  }
);
