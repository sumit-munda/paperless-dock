import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./config";

export interface CheckoutOrderItem {
  id: string;
  bookId: string;
  titleSnapshot: string;
  priceSnapshot: string;
  quantity: number;
}

export interface CheckoutOrder {
  id: string;
  subtotal: string;
  currency: string;
  status: "PENDING";
  paymentStatus: string;
  createdAt: string;
  items: CheckoutOrderItem[];
}

interface CheckoutResponse {
  message: string;
  order: CheckoutOrder;
}

export async function createCheckoutOrder(): Promise<CheckoutOrder> {
  const response = await apiRequest<CheckoutResponse>(
    `${API_BASE_URL}/api/checkout`,
    {
      method: "POST",
    },
  );

  return response.order;
}
