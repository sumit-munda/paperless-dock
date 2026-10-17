import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./apiRequest";
import type { Book } from "../data/books";
import { fetchBookById, fetchBooks } from "./booksApi";

vi.mock("./apiRequest", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const mockBook = {
  id: "book-1",
  title: "The Pragmatic Programmer",
  author: "Andrew Hunt and David Thomas",
  price: 35,
  coverImage: "/images/pragmatic-programmer.jpg",
  category: "Programming",
  rating: 4.8,
} as Book;

describe("booksApi", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchBooks", () => {
    it("returns the catalog when the request succeeds", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        books: [mockBook],
      });

      const result = await fetchBooks();

      expect(result).toEqual([mockBook]);

      expect(mockedApiRequest).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_BASE_URL}/api/books`,
      );
    });

    it("throws an error when the catalog request fails", async () => {
      const error = new Error("API request failed: HTTP 500");

      mockedApiRequest.mockRejectedValueOnce(error);

      await expect(fetchBooks()).rejects.toThrow(
        "API request failed: HTTP 500",
      );
    });
  });

  describe("fetchBookById", () => {
    it("returns the requested book when it exists", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        book: mockBook,
      });

      const result = await fetchBookById("book-1");

      expect(result).toEqual(mockBook);

      expect(mockedApiRequest).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_BASE_URL}/api/books/book-1`,
      );
    });

    it("returns null when the book does not exist", async () => {
      mockedApiRequest.mockRejectedValueOnce(
        new Error("API request failed: HTTP 404"),
      );

      const result = await fetchBookById("missing-book");

      expect(result).toBeNull();
    });

    it("throws an error when the request fails for another reason", async () => {
      const error = new Error("API request failed: HTTP 500");

      mockedApiRequest.mockRejectedValueOnce(error);

      await expect(fetchBookById("book-1")).rejects.toThrow(
        "API request failed: HTTP 500",
      );
    });
  });
});
