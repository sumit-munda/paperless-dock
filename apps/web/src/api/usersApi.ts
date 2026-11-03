import { apiRequest } from "./apiRequest";
import type { AuthUser } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Add it to apps/web/,env and restart the frontend server.",
  );
}

const USERS_API_URL = `${API_BASE_URL}/api/users`;

interface UserProfileResponse {
  user: AuthUser;
}

interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string | null;
}

export async function fetchUserProfile() {
  const response = await apiRequest<UserProfileResponse>(`${USERS_API_URL}/me`);

  return response.user;
}

export async function updateUserProfile(
  input: UpdateProfileInput,
): Promise<AuthUser> {
  const response = await apiRequest<UpdateProfileResponse>(
    `${USERS_API_URL}/me`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  return response.user;
}
