import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCart,
  addCartItem,
  migrateGuestCart,
  updateCartItem,
  removeCartItem,
  type Cart,
} from "../api/cartApi";

import { AuthContext } from "./authContextValue";
import type { AuthContextValue } from "./authContextValue";
import { CartProvider, useCart } from "./CartContext";

vi.mock("../api/cartApi", () => ({
  fetchCart: vi.fn(),
  addCartItem: vi.fn(),
  migrateGuestCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

const mockFetchCart = vi.mocked(fetchCart);
const mockAddCartItem = vi.mocked(addCartItem);
const mockUpdateCartItem = vi.mocked(updateCartItem);
const mockRemoveCartItem = vi.mocked(removeCartItem);
const mockMigrateGuestCart = vi.mocked(migrateGuestCart);

const testCart: Cart = {
  id: "cart-123",
  items: [
    {
      id: "item-123",
      bookId: "book-001",
      quantity: 2,
      book: {
        id: "book-001",
        title: "Atomic Habits",
        slug: "atomic-habits",
        price: 499,
        currency: "INR",
        coverImage: null,
        author: "James Clear",
      },
    },
  ],
  itemCount: 2,
  createdAt: "2026-10-30T00:00:00.000Z",
  updatedAt: "2026-10-30T00:00:00.000Z",
};

const guestAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  logout: vi.fn(),
};

const accountAuthValue: AuthContextValue = {
  ...guestAuthValue,
  user: {
    id: "user-123",
    name: "Jane Reader",
    email: "jane@example.com",
    role: "CUSTOMER",
    avatar: null,
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-30T00:00:00.000Z",
  },
};

function TestConsumer() {
  const {
    items,
    itemCount,
    isLoading,
    error,
    addToCart,
    removeFromCart,
    migrationPending,
    retryMigration,
  } = useCart();

  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="error">{error ?? "No error"}</p>
      <p data-testid="item-count">{itemCount}</p>
      <p data-testid="migration-pending">{String(migrationPending)}</p>

      {items.map((item) => (
        <p key={item.bookId} data-testid={`item-${item.bookId}`}>
          {item.quantity}
        </p>
      ))}

      <button onClick={() => void addToCart("book-001")}>Add book</button>

      <button onClick={() => void removeFromCart("book-001")}>
        Remove book
      </button>

      <button onClick={() => void retryMigration()}>Retry migration</button>
    </div>
  );
}

function renderCartProvider(authValue: AuthContextValue = guestAuthValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  window.localStorage.clear();

  mockFetchCart.mockResolvedValue(testCart);
  mockAddCartItem.mockResolvedValue(testCart);
  mockUpdateCartItem.mockResolvedValue(testCart);
  mockMigrateGuestCart.mockResolvedValue(testCart);

  mockRemoveCartItem.mockResolvedValue({
    ...testCart,
    items: [],
    itemCount: 0,
  });
});

afterEach(() => {
  cleanup();
});

describe("CartContext", () => {
  it("loads an empty guest cart when localStorage is empty", async () => {
    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
    expect(mockFetchCart).not.toHaveBeenCalled();
  });

  it("normalizes legacy guest cart quantities to one", async () => {
    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify([{ bookId: "book-001", quantity: 2 }]),
    );

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
    });

    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
  });

  it("adds a book to the guest cart with quantity one", async () => {
    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Add book" }).click();
    });

    expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
  });

  it("does not add a duplicate book to the guest cart", async () => {
    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify([{ bookId: "book-001", quantity: 1 }]),
    );

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Add book" }).click();
    });

    expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
  });

  it("removes a book from the guest cart", async () => {
    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify([{ bookId: "book-001", quantity: 2 }]),
    );

    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("item-book-001")).toBeInTheDocument();
    });

    await act(async () => {
      screen.getByRole("button", { name: "Remove book" }).click();
    });

    expect(screen.queryByTestId("item-book-001")).not.toBeInTheDocument();
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
  });

  it("persists normalized guest cart changes in localStorage", async () => {
    renderCartProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Add book" }).click();
    });

    await waitFor(() => {
      const savedCart = JSON.parse(
        window.localStorage.getItem("paperless-dock-cart") ?? "[]",
      );

      expect(savedCart).toEqual([{ bookId: "book-001", quantity: 1 }]);
    });
  });

  it("loads an authenticated user's cart with quantity one", async () => {
    renderCartProvider(accountAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
    });

    expect(mockFetchCart).toHaveBeenCalledOnce();
    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
  });

  it("adds a book through the API for an authenticated user", async () => {
    renderCartProvider(accountAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Add book" }).click();
    });

    expect(mockAddCartItem).toHaveBeenCalledWith("book-001");
    expect(screen.getByTestId("item-count")).toHaveTextContent("1");
    expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");
  });

  it("removes an authenticated user's cart item through the API", async () => {
    renderCartProvider(accountAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Remove book" }).click();
    });

    expect(mockRemoveCartItem).toHaveBeenCalledWith("book-001");
    expect(screen.getByTestId("item-count")).toHaveTextContent("0");
  });

  it("migrates the entire guest cart in a single API request", async () => {
    const guestItems = [
      { bookId: "book-001", quantity: 2 },
      { bookId: "book-002", quantity: 3 },
    ];

    const normalizedItems = [
      { bookId: "book-001", quantity: 1 },
      { bookId: "book-002", quantity: 1 },
    ];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(mockMigrateGuestCart).toHaveBeenCalledOnce();
    });

    expect(mockMigrateGuestCart).toHaveBeenCalledWith({
      migrationId: expect.any(String),
      items: normalizedItems,
    });

    await waitFor(() => {
      expect(mockFetchCart).toHaveBeenCalled();
      expect(window.localStorage.getItem("paperless-dock-cart")).toBeNull();
    });

    expect(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123"),
    ).toBeNull();
  });

  it("retains guest cart data and loads the account cart when migration fails", async () => {
    const guestItems = [
      { bookId: "book-001", quantity: 2 },
      { bookId: "book-002", quantity: 3 },
    ];

    const normalizedItems = [
      { bookId: "book-001", quantity: 1 },
      { bookId: "book-002", quantity: 1 },
    ];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart.mockRejectedValueOnce(new Error("Network error"));

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(mockFetchCart).toHaveBeenCalledOnce();
    expect(screen.getByTestId("item-book-001")).toHaveTextContent("1");

    const pendingMigration = JSON.parse(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123") ??
        "null",
    );

    expect(pendingMigration).toEqual({
      migrationId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      items: normalizedItems,
    });
  });

  it("retries a failed migration using the same migration ID and snapshot", async () => {
    const guestItems = [
      { bookId: "book-001", quantity: 2 },
      { bookId: "book-002", quantity: 3 },
    ];

    const normalizedItems = [
      { bookId: "book-001", quantity: 1 },
      { bookId: "book-002", quantity: 1 },
    ];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(testCart);

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    });

    const firstMigration = mockMigrateGuestCart.mock.calls[0][0];

    expect(firstMigration.items).toEqual(normalizedItems);

    cleanup();

    renderCartProvider(accountAuthValue);

    await waitFor(() => {
      expect(mockMigrateGuestCart).toHaveBeenCalledTimes(2);
    });

    const secondMigration = mockMigrateGuestCart.mock.calls[1][0];

    expect(secondMigration.migrationId).toBe(firstMigration.migrationId);
    expect(secondMigration.items).toEqual(firstMigration.items);

    await waitFor(() => {
      expect(window.localStorage.getItem("paperless-dock-cart")).toBeNull();
    });

    expect(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123"),
    ).toBeNull();
  });

  it("retries a failed migration without remounting the component", async () => {
    const guestItems = [{ bookId: "book-001", quantity: 2 }];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(testCart);

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("migration-pending")).toHaveTextContent("true");
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    });

    const firstMigration = mockMigrateGuestCart.mock.calls[0][0];

    await act(async () => {
      screen.getByRole("button", { name: "Retry migration" }).click();
    });

    await waitFor(() => {
      expect(mockMigrateGuestCart).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("migration-pending")).toHaveTextContent(
        "false",
      );
    });

    const secondMigration = mockMigrateGuestCart.mock.calls[1][0];

    expect(secondMigration.migrationId).toBe(firstMigration.migrationId);
    expect(secondMigration.items).toEqual(firstMigration.items);

    expect(window.localStorage.getItem("paperless-dock-cart")).toBeNull();
    expect(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123"),
    ).toBeNull();
  });

  it("preserves the migration snapshot when retry fails", async () => {
    const guestItems = [{ bookId: "book-001", quantity: 2 }];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Retry failed"));

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
      expect(screen.getByTestId("migration-pending")).toHaveTextContent("true");
    });

    const originalMigration = JSON.parse(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123")!,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Retry migration" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Retry failed");
    });

    expect(screen.getByTestId("migration-pending")).toHaveTextContent("true");

    const savedMigration = JSON.parse(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123")!,
    );

    expect(savedMigration).toEqual(originalMigration);

    expect(mockMigrateGuestCart).toHaveBeenCalledTimes(2);
  });

  it("refreshes the account cart after a successful retry", async () => {
    const guestItems = [{ bookId: "book-001", quantity: 2 }];

    const updatedCart: Cart = {
      ...testCart,
      items: [
        {
          id: "item-123",
          bookId: "book-001",
          quantity: 1,
          book: testCart.items[0].book,
        },
        {
          id: "item-456",
          bookId: "book-002",
          quantity: 3,
          book: {
            id: "book-002",
            title: "Deep Work",
            slug: "deep-work",
            price: 599,
            currency: "INR",
            coverImage: null,
            author: "Cal Newport",
          },
        },
      ],
      itemCount: 4,
    };

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(updatedCart);

    mockFetchCart
      .mockResolvedValueOnce(testCart)
      .mockResolvedValueOnce(updatedCart);

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("migration-pending")).toHaveTextContent("true");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Retry migration" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("item-book-002")).toHaveTextContent("1");
      expect(screen.getByTestId("item-count")).toHaveTextContent("2");
      expect(screen.getByTestId("migration-pending")).toHaveTextContent(
        "false",
      );
    });

    expect(mockFetchCart).toHaveBeenCalledTimes(2);
  });

  it("does not mark migration as pending when cart refresh fails after successful migration", async () => {
    const guestItems = [{ bookId: "book-001", quantity: 2 }];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(testCart);

    mockFetchCart
      .mockResolvedValueOnce(testCart)
      .mockRejectedValueOnce(new Error("Unable to refresh account cart."));

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("migration-pending")).toHaveTextContent("true");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Retry migration" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("migration-pending")).toHaveTextContent(
        "false",
      );
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Unable to refresh account cart.",
      );
    });

    expect(mockMigrateGuestCart).toHaveBeenCalledTimes(2);
    expect(mockFetchCart).toHaveBeenCalledTimes(2);

    expect(window.localStorage.getItem("paperless-dock-cart")).toBeNull();

    expect(
      window.localStorage.getItem("paperless-dock-cart-migration-user-123"),
    ).toBeNull();
  });

  it("reuses the original normalized migration snapshot if guest cart data changes", async () => {
    const originalGuestItems = [
      { bookId: "book-001", quantity: 2 },
      { bookId: "book-002", quantity: 3 },
    ];

    const normalizedOriginalItems = [
      { bookId: "book-001", quantity: 1 },
      { bookId: "book-002", quantity: 1 },
    ];

    const changedGuestItems = [{ bookId: "book-003", quantity: 1 }];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(originalGuestItems),
    );

    mockMigrateGuestCart
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(testCart);

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    });

    const firstMigration = mockMigrateGuestCart.mock.calls[0][0];

    expect(firstMigration.items).toEqual(normalizedOriginalItems);

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(changedGuestItems),
    );

    cleanup();

    renderCartProvider(accountAuthValue);

    await waitFor(() => {
      expect(mockMigrateGuestCart).toHaveBeenCalledTimes(2);
    });

    const secondMigration = mockMigrateGuestCart.mock.calls[1][0];

    expect(secondMigration.migrationId).toBe(firstMigration.migrationId);
    expect(secondMigration.items).toEqual(normalizedOriginalItems);
    expect(secondMigration.items).not.toEqual(changedGuestItems);
  });

  it("blocks cart actions while guest cart migration is pending", async () => {
    const guestItems = [{ bookId: "book-001", quantity: 2 }];

    window.localStorage.setItem(
      "paperless-dock-cart",
      JSON.stringify(guestItems),
    );

    let resolveMigration!: (cart: Cart) => void;

    const migrationPromise = new Promise<Cart>((resolve) => {
      resolveMigration = resolve;
    });

    mockMigrateGuestCart.mockReturnValueOnce(migrationPromise);

    const { rerender } = renderCartProvider(guestAuthValue);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    rerender(
      <AuthContext.Provider value={accountAuthValue}>
        <CartProvider>
          <TestConsumer />
        </CartProvider>
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(mockMigrateGuestCart).toHaveBeenCalledOnce();
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await act(async () => {
      screen.getByRole("button", { name: "Add book" }).click();
      screen.getByRole("button", { name: "Remove book" }).click();
    });

    expect(mockAddCartItem).not.toHaveBeenCalled();
    expect(mockUpdateCartItem).not.toHaveBeenCalled();
    expect(mockRemoveCartItem).not.toHaveBeenCalled();

    await act(async () => {
      resolveMigration(testCart);
      await migrationPromise;
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
  });
});
