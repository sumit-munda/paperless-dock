import { Router } from "express";
import {
  forgotPassword,
  getSessionUser,
  loginUser,
  loginUserWithGoogle,
  logoutUser,
  refreshAccessToken,
  registerUserWithCredentials,
  registerUserWithGoogle,
  resetPassword,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

// PUBLIC ROUTES (no auth)

// registration
router.post("/register", registerUserWithCredentials);
router.post("/register/google", registerUserWithGoogle);

// login
router.post("/login", loginUser); // Login (email + password)
router.post("/login/google", loginUserWithGoogle); // Login (google)

// Auth lifecycle
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// PROTECTED ROUTES
router.get("/session", isAuthenticated, getSessionUser);

export default router;
