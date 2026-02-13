import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "./slices/authSlice";
import sessionReducer from "./slices/sessionSlice";

// redux/store.ts
// Central Redux store configuration

export const store = configureStore({
  reducer: {
    // RTK Query reducer
    [baseApi.reducerPath]: baseApi.reducer,

    // Auth state (session user)
    auth: authReducer,

    // Controls when session API should run
    session: sessionReducer,
  },

  // Add RTK Query middleware
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

// Middleware per reducer → wrong
// Middleware per store → correct

// Inferred types for app-wide usage
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
