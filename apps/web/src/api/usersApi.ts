import { apiRequest } from "./apiRequest";
import type { AuthUser } from "./authApi";
import { API_BASE_URL } from "./config";

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
