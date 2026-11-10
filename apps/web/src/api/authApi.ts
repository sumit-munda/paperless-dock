import { apiRequest, clearCsrfToken } from "./apiRequest";
import { API_BASE_URL } from "./config";

const AUTH_API_URL = `${API_BASE_URL}/api/auth`;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  message: string;
  user: AuthUser;
}

interface CurrentUserResponse {
  user: AuthUser;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(`${AUTH_API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(`${AUTH_API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  clearCsrfToken();

  return response;
}

export async function logout(): Promise<{ message: string }> {
  const response = await apiRequest<{ message: string }>(
    `${AUTH_API_URL}/logout`,
    {
      method: "POST",
    },
  );

  clearCsrfToken();

  return response;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiRequest<CurrentUserResponse>(`${AUTH_API_URL}/me`);

  return response.user;
}
