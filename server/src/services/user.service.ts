import { User } from "../models/userModel.js";

// Fetch user from query or headers
export const getUserById = async (id: string) => {
  return User.findById(id);
};

export const getUserByEmail = async (email: string) => {
  return User.findOne({ email: email.trim().toLowerCase() });
};
