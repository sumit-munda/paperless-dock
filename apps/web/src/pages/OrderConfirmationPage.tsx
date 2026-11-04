import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  createPaymentOrder,
  getOrderById,
  verifyOrderPayment,
  type OrderDetails,
  type RazorpayVerificationInput,
} from "../api/ordersApi";

// Razorpay Checkout response.
interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Razorpay payment failure response.
interface RazorpayPaymentFailedResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

// Razorpay Checkout configuration.
interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;

  modal?: {
    ondismiss?: () => void;
  };

  theme?: {
    color?: string;
  };
}

// Razorpay Checkout instance.
interface RazorpayInstance {
  open: () => void;

  on: (
    event: string,
    callback: (response: RazorpayPaymentFailedResponse) => void,
  ) => void;
}

// Razorpay Checkout constructor.
interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

// Add Razorpay to the browser window type.
declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

// Load Razorpay Checkout script.
let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        razorpayScriptPromise = null;
        reject(new Error("Razorpay Checkout could not be initialized."));
      }
    };

    script.onerror = () => {
      razorpayScriptPromise = null;

      reject(new Error("Unable to load Razorpay Checkout. Please try again."));
    };

    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

const OrderConfirmationPage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  // Retrieve the internal order.
  useEffect(() => {
    let isActive = true;

    async function fetchOrder() {
      if (!orderId) {
        setError("Order ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const orderData = await getOrderById(orderId);

        if (isActive) {
          setOrder(orderData);
        }
      } catch (error) {
        if (isActive) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to retrieve your order.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      isActive = false;
    };
  }, [orderId]);

  // Verify the payment response received from Razorpay Checkout.
  async function handlePaymentVerification(response: RazorpayCheckoutResponse) {
    if (!orderId) {
      setPaymentError("Order ID is missing.");
      return;
    }

    const paymentDetails: RazorpayVerificationInput = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    };

    setIsCheckoutOpen(false);
    setIsVerifying(true);
    setPaymentError(null);
    setPaymentMessage(null);

    try {
      const result = await verifyOrderPayment(orderId, paymentDetails);

      setOrder((currentOrder) => {
        if (!currentOrder) {
          return currentOrder;
        }

        return {
          ...currentOrder,
          status: result.orderStatus,
          paymentStatus: result.paymentStatus,
        };
      });

      setPaymentMessage(result.message);
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to verify your payment.",
      );

      // Check whether the webhook has already completed the order.
      try {
        const latestOrder = await getOrderById(orderId);
        setOrder(latestOrder);

        if (latestOrder.paymentStatus === "PAID") {
          setPaymentError(null);
          setPaymentMessage("Your payment has been verified successfully.");
        }
      } catch {
        // Keep the original verification error visible.
      }
    } finally {
      setIsVerifying(false);
    }
  }

  // Create a Razorpay payment order and open Checkout.
  async function handlePayment() {
    if (!orderId || !order) {
      return;
    }

    if (order.status !== "PENDING" || order.paymentStatus !== "PENDING") {
      setPaymentError("This order is not available for payment.");
      return;
    }

    try {
      setIsStartingPayment(true);
      setPaymentError(null);
      setPaymentMessage(null);

      // Load Razorpay Checkout.
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }

      // Create a payment attempt for the existing internal order.
      const payment = await createPaymentOrder(orderId);

      const options: RazorpayCheckoutOptions = {
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Paperless Dock",
        description: "Digital Book Purchase",
        order_id: payment.razorpayOrderId,

        handler: async (response) => {
          await handlePaymentVerification(response);
        },

        modal: {
          ondismiss: () => {
            setIsCheckoutOpen(false);

            setPaymentMessage(
              "Checkout was closed. Your order is still pending. You can retry payment.",
            );
          },
        },

        theme: {
          color: "#aa3bff",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setIsCheckoutOpen(false);

        setPaymentError(
          response.error?.description ?? "Payment failed. Please try again.",
        );
      });

      setIsCheckoutOpen(true);
      razorpay.open();
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to start the payment process.",
      );
    } finally {
      setIsStartingPayment(false);
    }
  }

  if (isLoading) {
    return (
      <section className="order-confirmation-page">
        <h1>Loading Order...</h1>

        <p>Please wait while we retrieve your order details.</p>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="order-confirmation-page">
        <h1>Unable to Load Order</h1>

        <p>{error ?? "Order not found."}</p>

        <Link to="/books" className="button">
          Return to Books
        </Link>
      </section>
    );
  }

  const isPaid = order.paymentStatus === "PAID";

  return (
    <section className="order-confirmation-page">
      <h1>{isPaid ? "Payment Successful!" : "Order Created Successfully!"}</h1>

      <p>
        {isPaid
          ? "Your payment has been verified and your books are now available in your library."
          : "Your order has been created. Complete payment to access your books."}
      </p>

      <div className="order-confirmation-details">
        <h2>Order Details</h2>

        <p>
          <strong>Order ID:</strong> {order.id}
        </p>

        <p>
          <strong>Order Status:</strong> {order.status}
        </p>

        <p>
          <strong>Payment Status:</strong> {order.paymentStatus}
        </p>

        <p>
          <strong>Total:</strong> {order.currency}{" "}
          {Number(order.subtotal).toFixed(2)}
        </p>
      </div>

      <div className="order-confirmation-items">
        <h2>Books Ordered</h2>

        {order.items.map((item) => (
          <article key={item.id}>
            <h3>{item.titleSnapshot}</h3>

            <p>Quantity: {item.quantity}</p>

            <p>
              Price: {order.currency} {Number(item.priceSnapshot).toFixed(2)}
            </p>
          </article>
        ))}
      </div>

      {isPaid ? (
        <div className="payment-success-status">
          <h2>Payment Verified</h2>

          <p>
            Your payment has been successfully verified by our server. Your
            purchased books have been added to your library.
          </p>
        </div>
      ) : (
        <div className="payment-pending-status">
          <h2>Payment Pending</h2>

          <p>
            Your order is recorded, but payment has not yet been verified. Your
            books will become available in your library only after successful
            payment verification.
          </p>

          {paymentError && <p role="alert">{paymentError}</p>}

          {paymentMessage && <p role="status">{paymentMessage}</p>}

          <button
            type="button"
            className="button"
            onClick={handlePayment}
            disabled={
              isStartingPayment ||
              isCheckoutOpen ||
              isVerifying ||
              order.status !== "PENDING"
            }
          >
            {isStartingPayment
              ? "Starting Payment..."
              : isVerifying
                ? "Verifying Payment..."
                : "Pay Now"}
          </button>
        </div>
      )}

      <Link to="/books" className="button">
        Continue Exploring Books
      </Link>
    </section>
  );
};

export default OrderConfirmationPage;
