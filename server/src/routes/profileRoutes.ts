import { Router } from "express";
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import {
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
  updateProfilePhoto,
} from "../controllers/profileController.js";

const router = Router();

router.use(isAuthenticated);

router.get("/", getMyProfile);
router.patch("/info", updateMyProfile);
router.patch("/pic", updateProfilePhoto);
router.delete("/", deleteMyAccount);

export default router;
