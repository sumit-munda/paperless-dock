import type { DataResponse, MessageResponse } from "@/types/api";
import { baseApi } from "./baseApi";
import type { UserProfile } from "firebase/auth";
import type { UpdateProfilePayload } from "@/types/auth";

// redux/api/profileApi.ts
// Handles current user profile operations

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch current user's profile
    getProfile: builder.query<DataResponse<UserProfile>, void>({
      query: () => ({
        url: "/profile",
      }),
      providesTags: ["profile"],
    }),

    // Update profile info (name, email, etc.)
    updateProfile: builder.mutation<
      DataResponse<UserProfile>,
      UpdateProfilePayload
    >({
      query: (data) => ({
        url: "/profile/info",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["profile"],
    }),

    // Update profile picture
    updateProfilePhoto: builder.mutation<DataResponse<UserProfile>, FormData>({
      query: (data) => ({
        url: "/profile/pic",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["profile"],
    }),

    // Delete user profile
    deleteProfile: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/profile",
        method: "DELETE",
      }),
      invalidatesTags: ["profile"],
    }),
  }),
});

// Export hooks for use in React components
export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateProfilePhotoMutation,
  useDeleteProfileMutation,
} = profileApi;
