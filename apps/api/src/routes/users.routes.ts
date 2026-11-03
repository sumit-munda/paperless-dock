import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { updateUserSchema } from "../validation/user.schema.js";
import prisma from "../prisma.js";

const router = Router();

router.get("/me", requireAuth, async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: res.locals.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid profile information.",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: res.locals.user.id,
      },
      data: result.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
