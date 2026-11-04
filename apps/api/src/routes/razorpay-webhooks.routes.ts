import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, type Request, type Response } from "express";
import prisma from "../prisma.js";
import {
  fulfillCapturedPayment,
  PaymentServiceError,
} from "../services/payments.service.js";

const router = Router();

interface RazorpayWebhookPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
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
    webhookEvent = await prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: "RAZORPAY",
          providerEventId: eventId,
        },
      },
    });

    if (!webhookEvent) {
      return res.status(500).json({
        message: "Unable to retrieve existing webhook event.",
      });
    }
  }

  // Atomically claim the event so simultaneous deliveries cannot
  // process the same event concurrently.
  const claimed = await prisma.paymentWebhookEvent.updateMany({
    where: {
      id: webhookEvent.id,
      status: {
        in: ["RECEIVED", "FAILED"],
      },
    },
    data: {
      status: "PROCESSING",
      processingError: null,
    },
  });

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
    }

    // Other event types, including payment.authorized and
    // payment.failed, are recorded but never grant library access.

    await prisma.paymentWebhookEvent.update({
      where: {
        id: webhookEvent.id,
      },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        processingError: null,
      },
    });

    return res.status(200).json({
      message: "Webhook processed successfully.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown webhook processing error.";

    try {
      await prisma.paymentWebhookEvent.update({
        where: {
          id: webhookEvent.id,
        },
        data: {
          status: "FAILED",
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