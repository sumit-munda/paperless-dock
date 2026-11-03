import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/dashboard", requireAuth, requireRole("ADMIN"), (req, res) => {
  return res.status(200).json({
    message: "Welcome to the admin dashboard.",
    user: res.locals.user,
  });
});

export default router;
