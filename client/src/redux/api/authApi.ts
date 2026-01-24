import type { SessionResponse } from "@/types/auth.types";
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    loginGoogle: builder.mutation({
      query: (data) => ({
        url: "/auth/google",
        method: "POST",
        body: data,
      }),
    }),

    register: builder.mutation({
      query: (data) => ({
        url: "/auth/register",
        method: "POST",
        body: data,
      }),
    }),

    getSession: builder.query<SessionResponse, void>({
      query: () => ({
        url: "/auth/session",
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    refresh: builder.query({
      query: () => ({
        url: "/auth/refresh",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLoginGoogleMutation,
  useRegisterMutation,
  useGetSessionQuery,
  useLogoutMutation,
  useRefreshQuery,
} = authApi;
