import type { Book } from "../data/books";
import { apiRequest } from "./apiRequest";
import { API_BASE_URL } from "./config";

const BOOKS_API_URL = `${API_BASE_URL}/api/books`;

interface BooksApiResponse {
  books: Book[];
}

interface SingleBookApiResponse {
  book: Book;
}

export async function fetchBooks(): Promise<Book[]> {
  const data = await apiRequest<BooksApiResponse>(BOOKS_API_URL);

  return data.books;
}

export async function fetchBookById(bookId: string): Promise<Book | null> {
  const url = `${BOOKS_API_URL}/${bookId}`;

  try {
    const data = await apiRequest<SingleBookApiResponse>(url);

    return data.book;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "API request failed: HTTP 404"
    ) {
      return null;
    }

    throw error;
  }
}
