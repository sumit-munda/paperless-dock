import { Router } from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUserWithCredentials,
  registerUserWithGoogle,
  resetPassword,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

// PUBLIC ROUTES (no auth)
router.post("/register", registerUserWithCredentials);
router.post("/google", registerUserWithGoogle);
router.post("/login", loginUser); // Login (email + password)
router.post("/google", loginUser); // Login (google)
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// PROTECTED ROUTES
router.post("/logout", isAuthenticated, logoutUser);

export default router;
