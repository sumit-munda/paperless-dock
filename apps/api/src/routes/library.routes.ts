import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getUserLibrary } from "../services/library.service.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const library = await getUserLibrary(res.locals.user.id);

    return res.status(200).json({
      library,
      count: library.length,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
