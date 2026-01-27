import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// redux/api/baseApi.ts
// Base RTK Query API for the app
// Configures the base URL, credentials, headers, and caching tags
// All feature APIs (like authApi) will inject endpoints into this baseApi

export const baseApi = createApi({
  // Unique key for this slice of the store
  reducerPath: "api",

  // Base query configuration using fetchBaseQuery
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_SERVER_URL, // Server URL for env variables
    credentials: "include", // Send cookies with requests
    prepareHeaders(headers) {
      // Set default headers for all requests
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  // Tags used for cache invalidation and automatic refetching
  tagTypes: ["user", "profile"],

  // Placeholder for endpoints; feature APIs will inject their own endpoints
  endpoints: () => ({}),
});
