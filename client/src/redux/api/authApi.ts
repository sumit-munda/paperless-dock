import type { DataResponse, MessageResponse } from "@/types/api";
import { baseApi } from "./baseApi";
import type { GoogleLoginPayload, SessionUser } from "@/types/auth";

// redux/api/authApi.ts
// RTK Query endpoints for authentication

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login with email and password
    login: builder.mutation<
      MessageResponse,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["user"],
    }),

    // Login with Google OAuth token
    loginGoogle: builder.mutation<MessageResponse, GoogleLoginPayload>({
      query: (data) => ({
        url: "/auth/login/google",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // Register a new user account
    register: builder.mutation<
      MessageResponse,
      { email: string; password: string }
    >({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["user"],
    }),

    // Get current user session
    getSession: builder.query<DataResponse<SessionUser>, void>({
      query: () => ({
        url: "/auth/session",
      }),
      providesTags: ["user"],
    }),

    // Logout the current user
    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["user"],
    }),

    // Refresh session or token
    refresh: builder.query<MessageResponse, void>({
      query: () => ({
        url: "/auth/refresh",
      }),
      providesTags: ["user"],
    }),
  }),
});

// Export hooks for use in React components
export const {
  useLoginMutation,
  useLoginGoogleMutation,
  useRegisterMutation,
  useGetSessionQuery,
  useLogoutMutation,
  useRefreshQuery,
} = authApi;
