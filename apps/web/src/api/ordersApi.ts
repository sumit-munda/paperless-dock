import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./config";

export interface OrderItem {
  id: string;
  bookId: string;
  titleSnapshot: string;
  priceSnapshot: string;
  quantity: number;
}

export interface OrderDetails {
  id: string;
  userId: string;
  subtotal: string;
  currency: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface OrderResponse {
  order: OrderDetails;
}

export interface PaymentOrder {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  internalOrderId: string;
}

interface PaymentOrderResponse {
  message: string;
  payment: PaymentOrder;
}

export interface RazorpayVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResult {
  message: string;
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
}

export async function getOrderById(orderId: string): Promise<OrderDetails> {
  const response = await apiRequest<OrderResponse>(
    `${API_BASE_URL}/api/orders/${orderId}`,
  );

  return response.order;
}

export async function createPaymentOrder(
  orderId: string,
): Promise<PaymentOrder> {
  const response = await apiRequest<PaymentOrderResponse>(
    `${API_BASE_URL}/api/orders/${orderId}/payment`,
    {
      method: "POST",
    },
  );

  return response.payment;
}

export async function verifyOrderPayment(
  orderId: string,
  paymentDetails: RazorpayVerificationInput,
): Promise<PaymentVerificationResult> {
  return apiRequest<PaymentVerificationResult>(
    `${API_BASE_URL}/api/orders/${orderId}/payment/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentDetails),
    },
  );
}
