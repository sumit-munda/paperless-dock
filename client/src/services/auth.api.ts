import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/v1";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // IMPORTANT for cookies (refresh, logout)
  headers: {
    "Content-Type": "application/json",
  },
});

/* =======================
   AUTH ROUTES
======================= */

// Register (email + password)
export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post("/register", data);

// Register / Login with Google
export const registerWithGoogle = (data: {
  token: string;
}) => api.post("/google", data);

// Login
export const loginUser = (data: {
  email: string;
  password: string;
}) => api.post("/login", data);

// Refresh access token
export const refreshAccessToken = () =>
  api.post("/refresh");

// Logout (protected)
export const logoutUser = () =>
  api.post("/logout");

/* =======================
   PASSWORD ROUTES
======================= */

// Forgot password
export const forgotPassword = (data: {
  email: string;
}) => api.post("/forgot-password", data);

// Reset password
export const resetPassword = (
  token: string,
  data: { password: string }
) => api.post(`/reset-password/${token}`, data);

/* =======================
   PROFILE ROUTES
======================= */

// Get my profile
export const getMyProfile = () =>
  api.get("/");

// Update profile info
export const updateMyProfile = (data: {
  name?: string;
  email?: string;
}) => api.patch("/info", data);

// Update profile picture
export const updateProfilePhoto = (formData: FormData) =>
  api.patch("/pic", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Delete account
export const deleteMyAccount = () =>
  api.delete("/");



