export type SessionUser = {
  id: string;
  role?: "admin" | "seller" | "user";
};

export type SessionUserInfo = {
  user: SessionUser;
  isAuthenticated: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  email: string;
  provider: "credentials" | "google";
  googleId?: string;
  photo: string;
  role: "admin" | "user" | "seller";
  subscription: {
    status: "inactive" | "active" | "cancelled";
    stripeCustomerId: string;
  };
  location?: {
    city?: string;
    country?: string;
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
};

export type UpdateProfilePayload = {
  name: string;
  username: string;
  bio?: string;
  location?: {
    city?: string;
    country?: string;
  };
};
