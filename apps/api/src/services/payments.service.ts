import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import prisma from "../prisma.js";
import { getRazorpayClient, getRazorpayKeyId } from "../razorpay.js";

export class PaymentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

export interface RazorpayVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CapturedPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
}

function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function createPaymentOrder(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      subtotal: true,
      currency: true,
      status: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    throw new PaymentServiceError("Order not found.", 404);
  }

  if (order.status !== "PENDING" || order.paymentStatus !== "PENDING") {
    throw new PaymentServiceError(
      "This order is not available for payment.",
      409,
    );
  }

  if (order.currency !== "INR") {
    throw new PaymentServiceError(
      "Only INR payments are currently supported.",
      400,
    );
  }

  const amountInPaise = order.subtotal.mul(100).toNumber();

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
    throw new PaymentServiceError(
      "The order has an invalid payment amount.",
      400,
    );
  }

  const attemptId = randomUUID();
  const receipt = `pd_${randomUUID().replaceAll("-", "")}`;

  const razorpay = getRazorpayClient();

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: order.currency,
    receipt,
    notes: {
      internalOrderId: order.id,
      paymentAttemptId: attemptId,
    },
  });

  if (
    Number(razorpayOrder.amount) !== amountInPaise ||
    razorpayOrder.currency !== order.currency
  ) {
    throw new PaymentServiceError(
      "Razorpay returned an unexpected order amount or currency.",
      502,
    );
  }

  await prisma.paymentAttempt.create({
    data: {
      id: attemptId,
      orderId: order.id,
      provider: "RAZORPAY",
      providerOrderId: razorpayOrder.id,
      amount: order.subtotal,
      currency: order.currency,
      status: "CREATED",
    },
  });

  return {
    keyId: getRazorpayKeyId(),
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: order.currency,
    internalOrderId: order.id,
  };
}

/**
 * The single fulfillment path used by both:
 * - The frontend checkout verification callback.
 * - The Razorpay payment.captured webhook.
 *
 * The caller must independently establish that the payment is captured
 * and that its source is authentic.
 */
export async function fulfillCapturedPayment(input: CapturedPaymentInput) {
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      provider: "RAZORPAY",
      providerOrderId: input.razorpayOrderId,
    },
    select: {
      id: true,
      orderId: true,
      providerOrderId: true,
      providerPaymentId: true,
      amount: true,
      currency: true,
      status: true,
    },
  });

  if (!attempt) {
    throw new PaymentServiceError("Payment attempt not found.", 404);
  }

  const expectedAmount = attempt.amount.mul(100).toNumber();

  if (input.amount !== expectedAmount || input.currency !== attempt.currency) {
    throw new PaymentServiceError(
      "Payment details do not match the order.",
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    // Serialize all fulfillment attempts for this internal order.
    await tx.$queryRaw`
      SELECT "id"
      FROM "Order"
      WHERE "id" = ${attempt.orderId}
      FOR UPDATE
    `;

    const currentAttempt = await tx.paymentAttempt.findUnique({
      where: { id: attempt.id },
    });

    const currentOrder = await tx.order.findUnique({
      where: { id: attempt.orderId },
      include: {
        items: {
          select: {
            bookId: true,
          },
        },
      },
    });

    if (!currentAttempt || !currentOrder) {
      throw new PaymentServiceError("Order not found.", 404);
    }

    // A repeated notification for the same captured payment is safe.
    if (
      currentAttempt.status === "CAPTURED" &&
      currentAttempt.providerPaymentId === input.razorpayPaymentId &&
      currentOrder.status === "COMPLETED" &&
      currentOrder.paymentStatus === "PAID"
    ) {
      return {
        message: "Payment has already been verified.",
        orderId: currentOrder.id,
        paymentStatus: currentOrder.paymentStatus,
        orderStatus: currentOrder.status,
      };
    }

    // Never let a different payment attempt fulfill an already-paid order.
    if (
      currentOrder.status !== "PENDING" ||
      currentOrder.paymentStatus !== "PENDING"
    ) {
      throw new PaymentServiceError(
        "This order has already been processed.",
        409,
      );
    }

    if (currentAttempt.status === "CAPTURED") {
      throw new PaymentServiceError(
        "This payment attempt has already been processed.",
        409,
      );
    }

    // Prevent a payment ID from being associated with another attempt.
    if (
      currentAttempt.providerPaymentId &&
      currentAttempt.providerPaymentId !== input.razorpayPaymentId
    ) {
      throw new PaymentServiceError(
        "A different payment is already associated with this attempt.",
        409,
      );
    }

    await tx.paymentAttempt.update({
      where: { id: currentAttempt.id },
      data: {
        providerPaymentId: input.razorpayPaymentId,
        status: "CAPTURED",
        capturedAt: new Date(),
        failureCode: null,
        failureDescription: null,
      },
    });

    await tx.order.update({
      where: { id: currentOrder.id },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
    });

    await tx.libraryItem.createMany({
      data: currentOrder.items.map((item) => ({
        userId: currentOrder.userId,
        bookId: item.bookId,
        orderId: currentOrder.id,
      })),
      skipDuplicates: true,
    });

    return {
      message: "Payment verified successfully.",
      orderId: currentOrder.id,
      paymentStatus: "PAID" as const,
      orderStatus: "COMPLETED" as const,
    };
  });
}

export async function verifyPayment(
  orderId: string,
  userId: string,
  input: RazorpayVerificationInput,
) {
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      provider: "RAZORPAY",
      providerOrderId: input.razorpay_order_id,
      orderId,
      order: {
        userId,
      },
    },
    select: {
      providerOrderId: true,
    },
  });

  if (!attempt) {
    throw new PaymentServiceError("Payment attempt not found.", 404);
  }

  if (
    !verifyCheckoutSignature(
      attempt.providerOrderId,
      input.razorpay_payment_id,
      input.razorpay_signature,
    )
  ) {
    throw new PaymentServiceError(
      "Payment signature verification failed.",
      400,
    );
  }

  const razorpay = getRazorpayClient();

  let providerPayment;

  try {
    providerPayment = await razorpay.payments.fetch(input.razorpay_payment_id);
  } catch {
    throw new PaymentServiceError(
      "Unable to verify the payment with Razorpay.",
      502,
    );
  }

  if (
    providerPayment.id !== input.razorpay_payment_id ||
    providerPayment.order_id !== attempt.providerOrderId
  ) {
    throw new PaymentServiceError(
      "Payment details do not match the order.",
      400,
    );
  }

  if (providerPayment.status !== "captured") {
    throw new PaymentServiceError("Payment has not been captured yet.", 409);
  }

  const amount = Number(providerPayment.amount);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new PaymentServiceError(
      "Razorpay returned an invalid payment amount.",
      400,
    );
  }

  return fulfillCapturedPayment({
    razorpayOrderId: providerPayment.order_id,
    razorpayPaymentId: providerPayment.id,
    amount,
    currency: providerPayment.currency,
  });
}
