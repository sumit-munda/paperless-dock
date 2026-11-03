import { NextFunction, Response, Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  addItemToCart,
  CartServiceError,
  clearCart,
  getCart,
  migrateGuestCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";
import {
  addCartItemSchema,
  migrateGuestCartSchema,
  updateCartItemSchema,
} from "../validation/cart.schema.js";

const router = Router();

router.use(requireAuth);

function handleCartError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof CartServiceError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  return next(error);
}

router.post("/migrate", async (req, res, next) => {
  const parsed = migrateGuestCartSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid cart migration data.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const cart = await migrateGuestCart(
      res.locals.user.id,
      parsed.data,
    );

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const cart = await getCart(res.locals.user.id);

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

router.post("/items", async (req, res, next) => {
  const parsed = addCartItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid cart item data.",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const cart = await addItemToCart(res.locals.user.id, parsed.data);

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

router.patch("/items/:bookId", async (req, res, next) => {
  const parsed = updateCartItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid quantity.",
      error: parsed.error.flatten(),
    });
  }

  try {
    const cart = await updateCartItem(
      res.locals.user.id,
      req.params.bookId,
      parsed.data,
    );

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

router.delete("/items/:bookId", async (req, res, next) => {
  try {
    const cart = await removeCartItem(res.locals.user.id, req.params.bookId);

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

router.delete("/", async (_req, res, next) => {
  try {
    const cart = await clearCart(res.locals.user.id);

    return res.json({ cart });
  } catch (error) {
    return handleCartError(error, res, next);
  }
});

export default router;
