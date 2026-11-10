import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./config";

const CART_API_URL = `${API_BASE_URL}/api/cart`;

export interface CartBook {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  coverImage: string | null;
  author: string;
}

export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  book: CartBook;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CartResponse {
  cart: Cart;
}

export interface GuestCartMigrationItem {
  bookId: string;
  quantity: number;
}

export interface GuestCartMigrationInput {
  migrationId: string;
  items: GuestCartMigrationItem[];
}

export async function fetchCart(): Promise<Cart> {
  const response = await apiRequest<CartResponse>(CART_API_URL);

  return response.cart;
}

export async function migrateGuestCart(
  input: GuestCartMigrationInput,
): Promise<Cart> {
  const response = await apiRequest<CartResponse>(`${CART_API_URL}/migrate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return response.cart;
}

export async function addCartItem(bookId: string, quantity = 1): Promise<Cart> {
  const response = await apiRequest<CartResponse>(`${CART_API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookId, quantity }),
  });

  return response.cart;
}

export async function updateCartItem(
  bookId: string,
  quantity: number,
): Promise<Cart> {
  const response = await apiRequest<CartResponse>(
    `${CART_API_URL}/items/${encodeURIComponent(bookId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    },
  );

  return response.cart;
}

export async function removeCartItem(bookId: string): Promise<Cart> {
  const response = await apiRequest<CartResponse>(
    `${CART_API_URL}/items/${encodeURIComponent(bookId)}`,
    {
      method: "DELETE",
    },
  );

  return response.cart;
}

export async function clearCart(): Promise<Cart> {
  const response = await apiRequest<CartResponse>(CART_API_URL, {
    method: "DELETE",
  });

  return response.cart;
}
