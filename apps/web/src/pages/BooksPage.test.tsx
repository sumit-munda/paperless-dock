import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBooks } from "../hooks/useBooks";
import BooksPage from "./BooksPage";
import type { Book } from "../data/books";

vi.mock("../hooks/useBooks", () => ({
  useBooks: vi.fn(),
}));

const mockedUseBooks = vi.mocked(useBooks);

const mockBooks: Book[] = [
  {
    id: "book-001",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-Development",
    description:
      "A practical guide to building good habits and breaking bad ones.",
    price: 499,
    rating: 4.8,
    coverImage: "/images/atomic-habits.jpg",
  },
  {
    id: "book-002",
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    description:
      "Learn how focused work can help you produce valuable results.",
    price: 399,
    rating: 4.6,
    coverImage: "/images/deep-work.jpg",
  },
  {
    id: "book-003",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Finance",
    description:
      "Explore how people think about money, risk, and financial decisions.",
    price: 349,
    rating: 4.9,
    coverImage: "/images/psychology-of-money.jpg",
  },
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("BooksPage", () => {
  it("displays a loading state while books are loading", () => {
    mockedUseBooks.mockReturnValue({
      books: [],
      isLoading: true,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading books...");
  });

  it("displays an empty state when the catalog contains no books", () => {
    mockedUseBooks.mockReturnValue({
      books: [],
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "No books found" }),
    ).toBeInTheDocument();

    expect(screen.getByText("0 books found")).toBeInTheDocument();
  });

  it("displays an error state when loading books fails", () => {
    mockedUseBooks.mockReturnValue({
      books: [],
      isLoading: false,
      error: "Unable to connect to the server.",
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load the books.",
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to connect to the server.",
    );
  });

  it("displays books returned by the books hook", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Atomic Habits" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Deep Work" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "The Psychology of Money" }),
    ).toBeInTheDocument();
  });

  it("filters books by title or author", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search books" }), {
      target: { value: "Morgan Housel" },
    });

    expect(
      screen.getByRole("heading", { name: "The Psychology of Money" }),
    ).toBeInTheDocument();

    expect(screen.getByText("1 book found")).toBeInTheDocument();
  });

  it("filters books by category", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Category" }), {
      target: { value: "Productivity" },
    });

    expect(
      screen.getByRole("heading", { name: "Deep Work" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: "Atomic Habits" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("1 book found")).toBeInTheDocument();
  });

  it("sorts books by price from low to high", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "price-low" },
    });

    const bookHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(bookHeadings).toEqual([
      "The Psychology of Money",
      "Deep Work",
      "Atomic Habits",
    ]);
  });

  it("clears search and filters", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search books" }), {
      target: { value: "No Such Book Exists" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Clear search and filters" }),
    );

    expect(
      screen.getByRole("heading", { name: "Atomic Habits" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Deep Work" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "The Psychology of Money" }),
    ).toBeInTheDocument();

    expect(screen.getByText("3 books found")).toBeInTheDocument();
  });

  it("sorts books by title from A to Z", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "title" },
    });

    const bookHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(bookHeadings).toEqual([
      "Atomic Habits",
      "Deep Work",
      "The Psychology of Money",
    ]);
  });

  it("sorts books by rating from highest to lowest", () => {
    mockedUseBooks.mockReturnValue({
      books: mockBooks,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
      target: { value: "rating" },
    });

    const bookHeadings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(bookHeadings).toEqual([
      "The Psychology of Money",
      "Atomic Habits",
      "Deep Work",
    ]);
  });
});
