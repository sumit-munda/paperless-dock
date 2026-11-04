import { NextFunction, Response, Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  CheckoutServiceError,
  createOrder,
} from "../services/checkout.service.js";

const router = Router();

router.use(requireAuth);

function handleCheckoutError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof CheckoutServiceError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  return next(error);
}

router.post("/", async (_req, res, next) => {
  try {
    const order = await createOrder(res.locals.user.id);

    return res.status(201).json({
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    return handleCheckoutError(error, res, next);
  }
});

export default router;