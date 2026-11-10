import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middleware/requireAuth.js";
import { getOrderById } from "../services/orders.service.js";
import {
  createPaymentOrder,
  PaymentServiceError,
  verifyPayment,
} from "../services/payments.service.js";

const router = Router();

export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.user.id,
});

export const paymentOrderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.user.id,
});

export const paymentVerificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (_req, res) => res.locals.user.id,
});

router.use(requireAuth, orderRateLimiter);

// Retrieve an order.
router.get("/:orderId", async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required.",
      });
    }

    const order = await getOrderById(orderId, res.locals.user.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      order,
    });
  } catch (error) {
    return next(error);
  }
});

// Create a Razorpay payment order.
router.post(
  "/:orderId/payment",
  paymentOrderRateLimiter,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;

      if (typeof orderId !== "string" || !orderId) {
        return res.status(400).json({
          message: "Order ID is required.",
        });
      }

      const payment = await createPaymentOrder(orderId, res.locals.user.id);

      return res.status(201).json({
        message: "Payment order created successfully.",
        payment,
      });
    } catch (error) {
      if (error instanceof PaymentServiceError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      return next(error);
    }
  },
);

// Verify a Razorpay Checkout payment.
router.post(
  "/:orderId/payment/verify",
  paymentVerificationRateLimiter,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;

      if (typeof orderId !== "string" || !orderId) {
        return res.status(400).json({
          message: "Order ID is required.",
        });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body ?? {};

      if (
        typeof razorpay_order_id !== "string" ||
        typeof razorpay_payment_id !== "string" ||
        typeof razorpay_signature !== "string" ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
      ) {
        return res.status(400).json({
          message: "Valid Razorpay payment details are required.",
        });
      }

      const result = await verifyPayment(orderId, res.locals.user.id, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof PaymentServiceError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      return next(error);
    }
  },
);

export default router;
