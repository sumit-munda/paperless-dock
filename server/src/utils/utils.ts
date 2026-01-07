import { customAlphabet } from "nanoid";
import crypto from "crypto";

const Base62Charset: string =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const generateFirebaseLikeId = customAlphabet(Base62Charset, 28);

export function generatePhotoFromInitials(name?: string): string | undefined {
  if (!name) return undefined;

  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`;
}

export const generateShortId = customAlphabet(Base62Charset, 4);

export const generateUsernameFromEmail = (email: string): string => {
  let username = email.split("@")[0];
  username = username.replace(/[0-9]/g, "");
  username = username.replace(/[\.\-]/g, "_");
  username = username.replace(/_+/g, "_");
  username = username.toLowerCase();
  username = `${username}_${generateShortId()}`;

  return username;
};

export const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
