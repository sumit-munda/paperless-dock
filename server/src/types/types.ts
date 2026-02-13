import { NextFunction, Request, Response } from "express";
import { Document } from "mongoose";

// Standard async controller signature for Express.
// Ensures controllers return a Promise so errors can be centrally caught and forwarded via 'next()'
export type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// Mongoose’s base Document interface expects _id to be ObjectId, but you changed _id to string.
// Document<string> overrides the default ObjectId
export interface IUser extends Document<string> {
  _id: string;
  name: string;
  username: string;
  bio: string;
  email: string;
  password?: string;
  passwordNeedsReset?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  provider: "credentials" | "google";
  googleId?: string;
  photo: string;
  role: "admin" | "user" | "seller";
  subscription: {
    status: "inactive" | "active" | "cancelled";
    stripeCustomerId: string;
  };
  location: {
    city: string;
    country: string;
  };
  isActive: boolean;
  lastLoginAt: Date;
  emailVerified: boolean;
  settings: {
    theme: "light" | "dark";
    language: "en" | "hi";
  };
  createdAt: Date;
  updatedAt: Date;
}

// Mutler file type
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  path: string;
  filename?: string;
}

export interface AuthPayload {
  id: string;
  role: "admin" | "seller" | "user";
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
  file?: MulterFile;
}
