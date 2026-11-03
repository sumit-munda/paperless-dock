import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AuthContext } from "./authContextValue";

import {
  fetchCart,
  addCartItem as addCartItemRequest,
  migrateGuestCart as migrateGuestCartRequest,
  updateCartItem as updateCartItemRequest,
  removeCartItem as removeCartItemRequest,
} from "../api/cartApi";

export interface CartItem {
  bookId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  addToCart: (bookId: string) => Promise<void>;
  increaseQuantity: (bookId: string) => Promise<void>;
  decreaseQuantity: (bookId: string) => Promise<void>;
  removeFromCart: (bookId: string) => Promise<void>;
  migrationPending: boolean;
  retryMigration: () => Promise<void>;
}

const CART_STORAGE_KEY = "paperless-dock-cart";

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartMode = "loading" | "guest" | "account";

interface PendingCartMigration {
  migrationId: string;
  items: CartItem[];
}

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
        item.bookId.trim().length > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99,
    );
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors.
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("CartProvider must be used inside an AuthProvider.");
  }

  const { user, isLoading: authLoading } = auth;

  const [items, setItems] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<CartMode>("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [migrationPending, setMigrationPending] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  const operationQueueRef = useRef<Promise<void>>(Promise.resolve());

  userIdRef.current = user?.id ?? null;

  const retryingMigrationRef = useRef(false);

  function updateItems(nextItems: CartItem[]) {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function getMigrationKey(userId: string) {
    return `paperless-dock-cart-migration-${userId}`;
  }

  function getPendingMigration(
    userId: string,
    guestItems: CartItem[],
  ): PendingCartMigration {
    const key = getMigrationKey(userId);

    try {
      const savedMigration = window.localStorage.getItem(key);

      if (savedMigration) {
        const parsed: unknown = JSON.parse(savedMigration);

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "migrationId" in parsed &&
          typeof parsed.migrationId === "string" &&
          crypto.randomUUID() &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            parsed.migrationId,
          ) &&
          "items" in parsed &&
          Array.isArray(parsed.items) &&
          parsed.items.length > 0 &&
          parsed.items.length <= 100 &&
          parsed.items.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              "bookId" in item &&
              typeof item.bookId === "string" &&
              item.bookId.trim().length > 0 &&
              "quantity" in item &&
              Number.isSafeInteger(item.quantity) &&
              item.quantity >= 1 &&
              item.quantity <= 99,
          )
        ) {
          return parsed as PendingCartMigration;
        }
      }

      const migration: PendingCartMigration = {
        migrationId: crypto.randomUUID(),
        items: guestItems,
      };

      window.localStorage.setItem(key, JSON.stringify(migration));

      return migration;
    } catch {
      throw new Error(
        "Unable to prepare cart migration. Please check your browser storage settings.",
      );
    }
  }

  async function migrateGuestCart(userId: string): Promise<void> {
    const guestItems = loadCartItems();

    if (guestItems.length === 0) {
      return;
    }

    const migration = getPendingMigration(userId, guestItems);

    await migrateGuestCartRequest(migration);

    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.localStorage.removeItem(getMigrationKey(userId));
  }

  async function retryMigration(): Promise<void> {
    const currentUserId = userIdRef.current;

    if (!currentUserId || !migrationPending || retryingMigrationRef.current) {
      return;
    }

    retryingMigrationRef.current = true;
    setError(null);

    let migrationSucceeded = false;

    try {
      await migrateGuestCart(currentUserId);

      migrationSucceeded = true;

      if (userIdRef.current !== currentUserId) {
        return;
      }

      // Migration succeeded. It should no longer be marked as pending.
      setMigrationPending(false);

      const updatedCart = await fetchCart();

      if (userIdRef.current !== currentUserId) {
        return;
      }

      setItems(updatedCart.items);
    } catch (err) {
      if (userIdRef.current === currentUserId) {
        if (!migrationSucceeded) {
          setMigrationPending(true);
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to migrate your guest cart. Please try again.",
        );
      }
    } finally {
      retryingMigrationRef.current = false;
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    async function initializeCart() {
      updateItems([]);
      setMode("loading");
      setIsLoading(true);
      setError(null);

      if (!user) {
        const guestItems = loadCartItems();

        if (!cancelled) {
          updateItems(guestItems);
          setMode("guest");
          setIsLoading(false);
        }

        return;
      }

      try {
        setMigrationPending(loadCartItems().length > 0);

        await migrateGuestCart(user.id);

        setMigrationPending(false);
      } catch (err) {
        setMigrationPending(
          window.localStorage.getItem(getMigrationKey(user.id)) !== null,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to migrate your guest cart.",
          );
        }
      }

      try {
        const cart = await fetchCart();

        if (cancelled || userIdRef.current !== user.id) {
          return;
        }

        updateItems(
          cart.items.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
        );

        setMode("account");
      } catch (err) {
        if (cancelled || userIdRef.current !== user.id) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Unable to load your cart.",
        );

        setMode("account");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initializeCart();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (mode === "guest") {
      saveCartItems(items);
    }
  }, [items, mode]);

  function runAccountOperation(
    operation: (
      currentItems: CartItem[],
    ) => Promise<{ items: { bookId: string; quantity: number }[] }>,
  ): Promise<void> {
    const userId = userIdRef.current;

    if (!userId) {
      return Promise.resolve();
    }

    const task = operationQueueRef.current.then(async () => {
      if (userIdRef.current !== userId || mode !== "account") {
        return;
      }

      const updatedCart = await operation(itemsRef.current);

      if (userIdRef.current !== userId) {
        return;
      }

      updateItems(
        updatedCart.items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
      );
    });

    const handledTask = task.catch((err: unknown) => {
      if (userIdRef.current === userId) {
        setError(
          err instanceof Error ? err.message : "Unable to update your cart.",
        );
      }
    });

    operationQueueRef.current = handledTask;

    return handledTask;
  }

  async function addToCart(bookId: string) {
    if (typeof bookId !== "string" || bookId.trim().length === 0) {
      return;
    }

    if (mode === "account") {
      await runAccountOperation(() => addCartItemRequest(bookId));

      return;
    }

    if (mode !== "guest" || migrationPending) {
      return;
    }

    const existingItem = itemsRef.current.find(
      (item) => item.bookId === bookId,
    );

    if (!existingItem) {
      updateItems([...itemsRef.current, { bookId, quantity: 1 }]);

      return;
    }

    if (existingItem.quantity >= 99) {
      return;
    }

    updateItems(
      itemsRef.current.map((item) =>
        item.bookId === bookId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  async function increaseQuantity(bookId: string) {
    if (mode === "account") {
      await runAccountOperation((currentItems) => {
        const item = currentItems.find(
          (cartItem) => cartItem.bookId === bookId,
        );

        if (!item || item.quantity >= 99) {
          return Promise.resolve({ items: currentItems });
        }

        return updateCartItemRequest(bookId, item.quantity + 1);
      });

      return;
    }

    if (mode !== "guest" || migrationPending) {
      return;
    }

    updateItems(
      itemsRef.current.map((item) =>
        item.bookId === bookId && item.quantity < 99
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  async function decreaseQuantity(bookId: string) {
    if (mode === "account") {
      await runAccountOperation((currentItems) => {
        const item = currentItems.find(
          (cartItem) => cartItem.bookId === bookId,
        );

        if (!item) {
          return Promise.resolve({ items: currentItems });
        }

        if (item.quantity <= 1) {
          return removeCartItemRequest(bookId);
        }

        return updateCartItemRequest(bookId, item.quantity - 1);
      });

      return;
    }

    if (mode !== "guest" || migrationPending) {
      return;
    }

    updateItems(
      itemsRef.current
        .map((item) =>
          item.bookId === bookId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  async function removeFromCart(bookId: string) {
    if (mode === "account") {
      await runAccountOperation(() => removeCartItemRequest(bookId));

      return;
    }

    if (mode !== "guest" || migrationPending) {
      return;
    }

    updateItems(itemsRef.current.filter((item) => item.bookId !== bookId));
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isLoading,
        error,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        migrationPending,
        retryMigration,
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
