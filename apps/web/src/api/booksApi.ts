import type { Book } from "../data/books";
import { apiRequest } from "./apiRequest";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing VITE_API_BASE_URL. Add it too apps/web/.env and restart the frontend server.",
  );
}

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
