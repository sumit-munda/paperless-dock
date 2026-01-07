import { NextFunction, Request, Response } from "express";
import { ErrorHandler } from "../utils/errorHandler.js";

// Global Express error-handling middleware that normalizes all errors
// and sends a consistent JSON response to the client.
export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Create a shallow copy to avoid mutating the original error object
  let error = { ...err };
  error.message = err.message;

  // MongoDB Errors
  // Handle MongoDB invalid ObjectId (CastError)
  if (err.name === "CastError") {
    error = new ErrorHandler("Invalid ID format", 400);
  }

  // Handle MongoDB duplicate key errors (unique constraint violation)
  if (err.code === 11000) {
    error = new ErrorHandler("Duplicate field value", 409);
  }

  // Handle MongoDB schema validation errors
  if (err.name === "ValidationError") {
    const msg = Object.values(err.errors)
      .map((el: any) => el.message)
      .join(",");

    error = new ErrorHandler(msg, 400);
  }

  // JWT/Auth Erros
  // Handle invalid JWT token errors
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("Invalid token", 401);
  }

  // Handle expired JWT token errors
  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler("Token expired", 401);
  }

  // Default Fallback
  // Fallback for non-operational or unknown errors
  if (!error.isOperational) {
    console.error("💥 UNEXPECTED ERROR:", err);
    error = new ErrorHandler("Something went wrong", 500);
  }

  // Send standardized error response
  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status,
    message: error.message,
  });
};
