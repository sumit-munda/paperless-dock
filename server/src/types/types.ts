import { NextFunction, Request, Response } from "express";

// Standard async controller signature for Express.
// Ensures controllers return a Promise so errors can be centrally caught and forwarded via 'next()'
export type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) =>void | Promise<void>;
