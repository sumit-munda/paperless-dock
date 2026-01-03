import { NextFunction, Request, Response } from "express";
import { ExpressHandler } from "../types/types.js";

// Higher-order function (curried) that wraps an async controller
// and forwards any rejected Promise errors to Express's `next()` for centralized error handling.
export const asyncHandler =
  (func: ExpressHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(func(req, res, next)).catch(next);
  };
