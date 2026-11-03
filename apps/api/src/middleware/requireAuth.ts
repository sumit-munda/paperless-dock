import { Request, Response, NextFunction } from "express";
import prisma from "../prisma.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      req.session.destroy((error) => {
        if (error) {
          return next(error);
        }

        return res.status(401).json({
          message: "Authentication required.",
        });
      });

      return;
    }

    res.locals.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}
