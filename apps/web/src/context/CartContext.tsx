import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { books } from "../data/books";

export interface CartItem {
  bookId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (bookId: string) => void;
  increaseQuantity: (bookId: string) => void;
  decreaseQuantity: (bookId: string) => void;
  removeFromCart: (bookId: string) => void;
  itemCount: number;
  subtotal: number;
}

const CART_STORAGE_KEY = "paperless-dock-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.bookId === "string" &&
        books.some((book) => book.id === item.bookId) &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    );
  } catch {
    return [];
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(loadCartItems);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  function addToCart(bookId: string) {
    if (!books.some((book) => book.id === bookId)) {
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.bookId === bookId);

      if (!existingItem) {
        return [...currentItems, { bookId, quantity: 1 }];
      }

      if (existingItem.quantity >= 99) {
        return currentItems;
      }

      return currentItems.map((item) =>
        item.bookId === bookId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }

  function increaseQuantity(bookId: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.bookId === bookId && item.quantity < 99
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(bookId: string) {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(bookId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.bookId !== bookId),
    );
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce((total, item) => {
    const book = books.find((candidate) => candidate.id === item.bookId);

    return total + (book ? book.price * item.quantity : 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider.");
  }

  return context;
}
