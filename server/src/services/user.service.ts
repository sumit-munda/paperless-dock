import { Request } from "express";
import { User } from "../models/userModel.js";

// Fetch user from query or headers
export const getUserById = async (req: Request) => {
  const id = req.query.id as string | undefined;
  if (!id) return null;
  return await User.findById(id);
};

export const getUserByEmail  = async (email: string) => {
  return await User.findOne({ email: email.trim().toLowerCase() });
};
