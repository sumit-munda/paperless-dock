import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { clearUser } from "../slices/authSlice";
import { disableFetch } from "../slices/sessionSlice";

// redux/api/baseApi.ts
// Base RTK Query API for the app
// Configures the base URL, credentials, headers, and caching tags
// All feature APIs (like authApi) will inject endpoints into this baseApi

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_SERVER_URL, // Server URL from env variables
  credentials: "include", // Send cookies with requests
  prepareHeaders(headers) {
    // Set default headers for all requests
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// You should not call /auth/session when access token is expired AND refresh is in progress.

let isRefreshing = false;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isRefreshing) {
    // Attempt refresh
    isRefreshing = true;

    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions,
    );

    isRefreshing = false;

    if (refreshResult.data) {
      // Retry original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed -> logout hard
      api.dispatch(clearUser());
      api.dispatch(disableFetch());
    }
  }

  return result;
};

export const baseApi = createApi({
  // Unique key for this slice of the store
  reducerPath: "api",

  // Base query configuration using fetchBaseQuery
  baseQuery: baseQueryWithReauth,

  // Tags used for cache invalidation and automatic refetching
  tagTypes: ["user", "profile"],

  // Placeholder for endpoints; feature APIs will inject their own endpoints
  endpoints: () => ({}),
});
