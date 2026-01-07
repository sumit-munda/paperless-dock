import argon2 from "argon2";

// Hashes plain password before saving to DB
export const hashPassword = async (password: string) => {
  return await argon2.hash(password, { type: argon2.argon2id });
};

// Compares login password with hashed password in DB
export const verifyPassword = async (
  hashPassword: string,
  password: string
) => {
  return argon2.verify(hashPassword, password);
};
