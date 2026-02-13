// types/user.ts
// Full user profile returned by backend

import type { UserRole } from "./auth";

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  email: string;
  provider: "credentials" | "google";
  googleId?: string;
  photo: string;
  role: UserRole;
  subscription: {
    status: "inactive" | "active" | "cancelled";
    stripeCustomerId: string;
  };
  location?: {
    city?: string;
    country?: string;
  };
  isActive: boolean;
  emailVerified: boolean;
  settings: {
    theme: "light" | "dark";
    language: "en" | "hi";
  };

  // API sends ISO strings, not Date object
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
};


