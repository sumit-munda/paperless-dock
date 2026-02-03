import argon2 from "argon2";

// Hashes plain password before saving to DB
export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, { type: argon2.argon2id });
};

// Compares login password with hashed password in DB
export const verifyPassword = async (
  hashedPassword: string,
  password: string,
): Promise<boolean> => {
  return argon2.verify(hashedPassword, password);
};
