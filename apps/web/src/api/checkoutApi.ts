import { apiRequest } from "./apiRequest";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Add it to apps/web/.env and restart the frontend server.",
  );
}

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
