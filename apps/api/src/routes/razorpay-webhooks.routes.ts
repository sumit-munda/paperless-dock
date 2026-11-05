import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import prisma from "../prisma.js";
import {
  fulfillCapturedPayment,
  recordFailedPayment,
  PaymentServiceError,
} from "../services/payments.service.js";

const router = Router();

const PROCESSING_LEASE_MS = 10 * 60 * 1000;

interface RazorpayWebhookPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPayment;
    };
  };
}

function verifyWebhookSignature(
  rawBody: Buffer,
  receivedSignature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured.");
  }

  if (!/^[a-fA-F0-9]{64}$/.test(receivedSignature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(receivedSignature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isValidPayment(payment: unknown): payment is RazorpayWebhookPayment {
  if (!payment || typeof payment !== "object") {
    return false;
  }

  const candidate = payment as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.order_id === "string" &&
    typeof candidate.amount === "number" &&
    Number.isSafeInteger(candidate.amount) &&
    candidate.amount > 0 &&
    typeof candidate.currency === "string" &&
    typeof candidate.status === "string"
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

router.post("/", async (req: Request, res: Response) => {
  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    return res.status(400).json({
      message: "Expected a raw webhook request body.",
    });
  }

  const signature = req.get("X-Razorpay-Signature");
  const eventId = req.get("x-razorpay-event-id");

  if (!signature) {
    return res.status(400).json({
      message: "Missing webhook signature.",
    });
  }

  if (!eventId) {
    return res.status(400).json({
      message: "Missing webhook event ID.",
    });
  }

  let signatureValid: boolean;

  try {
    signatureValid = verifyWebhookSignature(rawBody, signature);
  } catch {
    return res.status(500).json({
      message: "Webhook verification is not configured.",
    });
  }

  if (!signatureValid) {
    return res.status(400).json({
      message: "Invalid webhook signature.",
    });
  }

  let event: RazorpayWebhookPayload;

  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({
      message: "Invalid webhook JSON.",
    });
  }

  if (!event || typeof event !== "object" || typeof event.event !== "string") {
    return res.status(400).json({
      message: "Invalid webhook event.",
    });
  }

  // Store the event before processing it.
  let webhookEvent;

  try {
    webhookEvent = await prisma.paymentWebhookEvent.create({
      data: {
        provider: "RAZORPAY",
        providerEventId: eventId,
        eventType: event.event,
        payload: JSON.parse(JSON.stringify(event)),
        status: "RECEIVED",
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      console.error("Unable to store Razorpay webhook event:", error);

      return res.status(500).json({
        message: "Unable to store webhook event.",
      });
    }

    // This event ID has already been received.
    try {
      webhookEvent = await prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "RAZORPAY",
            providerEventId: eventId,
          },
        },
      });
    } catch (lookupError) {
      console.error("Unable to retrieve existing webhook event:", lookupError);

      return res.status(500).json({
        message: "Unable to retrieve existing webhook event.",
      });
    }

    if (!webhookEvent) {
      return res.status(500).json({
        message: "Unable to retrieve existing webhook event.",
      });
    }
  }

  // Generate a unique token for this processing attempt.
  const processingToken = randomUUID();

  // Events stuck in PROCESSING for longer than this lease
  // can be reclaimed by a subsequent delivery.
  const staleProcessingTime = new Date(Date.now() - PROCESSING_LEASE_MS);

  let claimed;

  try {
    claimed = await prisma.paymentWebhookEvent.updateMany({
      where: {
        id: webhookEvent.id,
        OR: [
          {
            status: {
              in: ["RECEIVED", "FAILED"],
            },
          },
          {
            status: "PROCESSING",
            updatedAt: {
              lt: staleProcessingTime,
            },
          },
        ],
      },
      data: {
        status: "PROCESSING",
        processingToken,
        processingError: null,
      },
    });
  } catch (error) {
    console.error("Unable to claim webhook event:", error);

    return res.status(500).json({
      message: "Unable to claim webhook event.",
    });
  }

  if (claimed.count === 0) {
    return res.status(200).json({
      message: "Webhook event already processed or being processed.",
    });
  }

  try {
    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      if (!isValidPayment(payment) || payment.status !== "captured") {
        throw new PaymentServiceError("Invalid captured payment payload.", 400);
      }

      await fulfillCapturedPayment({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
      });
    } else if (event.event === "payment.failed") {
      const payment = event.payload?.payment?.entity;

      if (!isValidPayment(payment) || payment.status !== "failed") {
        throw new PaymentServiceError("Invalid failed payment payload.", 400);
      }

      await recordFailedPayment({
        razorpayOrderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        failureCode:
          typeof payment.error_code === "string" ? payment.error_code : null,
        failureDescription:
          typeof payment.error_description === "string"
            ? payment.error_description
            : null,
      });
    }

    // Other event types are recorded without granting library access.

    // Only the worker holding the current token may mark
    // this event as successfully processed.
    const completed = await prisma.paymentWebhookEvent.updateMany({
      where: {
        id: webhookEvent.id,
        status: "PROCESSING",
        processingToken,
      },
      data: {
        status: "PROCESSED",
        processingToken: null,
        processedAt: new Date(),
        processingError: null,
      },
    });

    if (completed.count === 0) {
      console.warn(
        "Webhook processing lease was lost before completion:",
        eventId,
      );
    }

    return res.status(200).json({
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown webhook processing error.";

    try {
      // An older worker must never overwrite a newer worker's result.
      await prisma.paymentWebhookEvent.updateMany({
        where: {
          id: webhookEvent.id,
          status: "PROCESSING",
          processingToken,
        },
        data: {
          status: "FAILED",
          processingToken: null,
          processingError: errorMessage,
        },
      });
    } catch (updateError) {
      console.error("Unable to update failed webhook event:", updateError);
    }

    console.error("Razorpay webhook processing failed:", error);

    return res.status(500).json({
      message: "Webhook processing failed. Please retry.",
    });
  }
});

export default router;
