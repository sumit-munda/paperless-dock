import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getUserLibrary } from "../api/libraryApi";
import MyLibraryPage from "./MyLibraryPage";

vi.mock("../api/libraryApi", () => ({
  getUserLibrary: vi.fn(),
}));

const mockedGetUserLibrary = vi.mocked(getUserLibrary);

const mockLibraryItem = {
  id: "library-item-001",
  purchasedAt: "2026-11-07T08:00:00.000Z",
  book: {
    id: "book-001",
    title: "Atomic Habits",
    slug: "atomic-habits",
    description: "A practical guide to building better habits.",
    coverImage: "/images/atomic-habits.jpg",
    language: "en",
    pageCount: 320,
    hasContent: true,
    authors: ["James Clear"],
    categories: ["Self-Development"],
  },
  readingProgress: {
    position: "start",
    percentage: 0,
    lastReadAt: null,
  },
};

function renderLibrary() {
  const router = createMemoryRouter(
    [
      {
        path: "/library",
        element: <MyLibraryPage />,
      },
      {
        path: "/library/:bookId/read",
        element: <h1>Reader route: book-001</h1>,
      },
    ],
    {
      initialEntries: ["/library"],
    },
  );

  render(<RouterProvider router={router} />);

  return router;
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("MyLibraryPage", () => {
  it("displays purchased books from the user's library", async () => {
    mockedGetUserLibrary.mockResolvedValue({
      library: [mockLibraryItem],
      count: 1,
    });

    renderLibrary();

    expect(
      await screen.findByRole("heading", {
        name: "Atomic Habits",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("by James Clear")).toBeInTheDocument();

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Book")).toBeInTheDocument();
  });

  it("displays a Read Book button when PDF content is available", async () => {
    mockedGetUserLibrary.mockResolvedValue({
      library: [mockLibraryItem],
      count: 1,
    });

    renderLibrary();

    const readButton = await screen.findByRole("link", {
      name: "Read Book →",
    });

    expect(readButton).toHaveAttribute("href", "/library/book-001/read");
  });

  it("navigates to the reader when Read Book is clicked", async () => {
    mockedGetUserLibrary.mockResolvedValue({
      library: [mockLibraryItem],
      count: 1,
    });

    renderLibrary();

    const readButton = await screen.findByRole("link", {
      name: "Read Book →",
    });

    fireEvent.click(readButton);

    expect(
      await screen.findByRole("heading", {
        name: "Reader route: book-001",
      }),
    ).toBeInTheDocument();
  });

  it("shows an unavailable message when PDF content does not exist", async () => {
    mockedGetUserLibrary.mockResolvedValue({
      library: [
        {
          ...mockLibraryItem,
          book: {
            ...mockLibraryItem.book,
            hasContent: false,
          },
        },
      ],
      count: 1,
    });

    renderLibrary();

    expect(
      await screen.findByText("Reading content coming soon"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("link", {
        name: "Read Book →",
      }),
    ).not.toBeInTheDocument();
  });
});
