import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCart } from "../context/CartContext";
import { useBooks } from "../hooks/useBooks";
import CartPage from "./CartPage";
import type { Book } from "../data/books";

vi.mock("../context/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock("../hooks/useBooks", () => ({
  useBooks: vi.fn(),
}));

const mockedUseCart = vi.mocked(useCart);
const mockedUseBooks = vi.mocked(useBooks);

const mockBooks: Book[] = [
  {
    id: "book-001",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Development",
    description: "A practical guide to building good habits.",
    price: 499,
    rating: 4.8,
    coverImage: "/images/atomic-habits.jpg",
  },
];

const mockRetryMigration = vi.fn();

function renderCartPage() {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  mockedUseBooks.mockReturnValue({
    books: mockBooks,
    isLoading: false,
    error: null,
  });

  mockedUseCart.mockReturnValue({
    items: [{ bookId: "book-001", quantity: 2 }],
    itemCount: 2,
    isLoading: false,
    error: null,
    migrationPending: false,
    retryMigration: mockRetryMigration,
    increaseQuantity: vi.fn(),
    decreaseQuantity: vi.fn(),
    removeFromCart: vi.fn(),
    addToCart: vi.fn(),
  } as ReturnType<typeof useCart>);
});

afterEach(() => {
  cleanup();
});

describe("CartPage", () => {
  it("displays the books in the cart", () => {
    renderCartPage();

    expect(
      screen.getByRole("heading", { name: "Your Shopping Cart" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Atomic Habits" }),
    ).toBeInTheDocument();

    expect(screen.getByText("₹998.00")).toBeInTheDocument();
  });

  it("displays the migration notice when guest cart migration is pending", () => {
    mockedUseCart.mockReturnValue({
      items: [{ bookId: "book-001", quantity: 2 }],
      itemCount: 2,
      isLoading: false,
      error: "Network error",
      migrationPending: true,
      retryMigration: mockRetryMigration,
      increaseQuantity: vi.fn(),
      decreaseQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    } as ReturnType<typeof useCart>);

    renderCartPage();

    expect(
      screen.getByText(
        /Some items from your guest cart haven't been added to your account yet/,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent("Network error");

    expect(
      screen.getByRole("button", { name: "Retry migration" }),
    ).toBeInTheDocument();

    // The account cart should remain usable.
    expect(
      screen.getByRole("heading", { name: "Atomic Habits" }),
    ).toBeInTheDocument();
  });

  it("retries guest cart migration when the retry button is clicked", () => {
    mockedUseCart.mockReturnValue({
      items: [{ bookId: "book-001", quantity: 2 }],
      itemCount: 2,
      isLoading: false,
      error: "Network error",
      migrationPending: true,
      retryMigration: mockRetryMigration,
      increaseQuantity: vi.fn(),
      decreaseQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    } as ReturnType<typeof useCart>);

    renderCartPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Retry migration" }),
    );

    expect(mockRetryMigration).toHaveBeenCalledTimes(1);
  });

  it("displays the migration notice even when the account cart is empty", () => {
    mockedUseCart.mockReturnValue({
      items: [],
      itemCount: 0,
      isLoading: false,
      error: "Network error",
      migrationPending: true,
      retryMigration: mockRetryMigration,
      increaseQuantity: vi.fn(),
      decreaseQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    } as ReturnType<typeof useCart>);

    renderCartPage();

    expect(
      screen.getByText(/Your cart is empty/),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Retry migration" }),
    ).toBeInTheDocument();
  });

  it("displays the loading state", () => {
    mockedUseCart.mockReturnValue({
      items: [],
      itemCount: 0,
      isLoading: true,
      error: null,
      migrationPending: false,
      retryMigration: mockRetryMigration,
      increaseQuantity: vi.fn(),
      decreaseQuantity: vi.fn(),
      removeFromCart: vi.fn(),
      addToCart: vi.fn(),
    } as ReturnType<typeof useCart>);

    renderCartPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading your cart...",
    );
  });
});