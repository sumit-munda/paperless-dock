import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUserWithCredentials,
  registerUserWithGoogle,
} from "../controllers/authController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", registerUserWithCredentials);
router.post("/google", registerUserWithGoogle);
router.post("/login", loginUser); // Login (email + password)
router.post("/refresh", refreshAccessToken);
router.post("/logout", isAuthenticated, logoutUser);

export default router;
