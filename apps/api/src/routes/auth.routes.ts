import bcrypt from "bcryptjs";
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import prisma from "../prisma.js";
import { loginSchema, registerSchema } from "../validation/auth.schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.post("/register", async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid registration details.",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { name, email, password } = validation.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: publicUserSelect,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "An account with this email address already exists.",
      });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid email or password.",
      });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        return next(regenerateError);
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          return next(saveError);
        }

        return res.status(200).json({
          message: "Login successful.",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
      });
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("paperless-dock.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful.",
    });
  });
});

router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.session.userId,
      },
      select: publicUserSelect,
    });

    if (!user) {
      req.session.destroy((error) => {
        if (error) {
          return next(error);
        }

        return res.status(401).json({
          message: "Not authenticated.",
        });
      });

      return;
    }

    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
});

router.get("/protected", requireAuth, (req, res) => {
  return res.status(200).json({
    message: "You are authenticated.",
    user: res.locals.user,
  });
});

export default router;
