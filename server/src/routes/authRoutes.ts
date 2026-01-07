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

router.post("/register", registerUserWithCredentials);
router.post("/google", registerUserWithGoogle);
router.post("/login", loginUser); // Login (email + password)
router.post("/refresh", refreshAccessToken);
router.post("/logout", isAuthenticated, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
