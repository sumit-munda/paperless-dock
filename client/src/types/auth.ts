// types/auth.ts
// Auth/Session-related types

export type UserRole = "admin" | "seller" | "user";

// Matches backend/session payload
export interface SessionUser {
  id: string;
  role: UserRole;
}

// Payloads sent TO the backend
export interface UpdateProfilePayload {
  name: string;
  username: string;
  bio?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

// Payload sent to backend for Google login
export interface GoogleLoginPayload {
  email: string;
  googleId: string;
  name?: string;
  photo?: string;
}
