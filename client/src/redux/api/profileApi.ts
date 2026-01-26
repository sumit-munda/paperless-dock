import type { DataResponse, MessageResponse } from "@/types/api.types";
import { baseApi } from "./baseApi";
import type { UserProfile } from "firebase/auth";
import type { UpdateProfilePayload } from "@/types/types";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<DataResponse<UserProfile>, void>({
      query: () => ({
        url: "/profile",
      }),
      providesTags: ["profile"],
    }),

    updateProfile: builder.mutation<
      DataResponse<UserProfile>,
      UpdateProfilePayload
    >({
      query: (data: UpdateProfilePayload) => ({
        url: "/profile/info",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["profile"],
    }),

    updateProfilePhoto: builder.mutation<DataResponse<UserProfile>, FormData>({
      query: (data: FormData) => ({
        url: "/profile/pic",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["profile"],
    }),

    deleteProfile: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/profile",
        method: "DELETE",
      }),
      invalidatesTags: ["profile"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdateProfilePhotoMutation,
  useDeleteProfileMutation,
} = profileApi;
