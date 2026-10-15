import type { Book } from "../data/books";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BOOKS_API_URL = `${API_BASE_URL}/api/books`;

interface BooksApiResponse {
  books: Book[];
}

interface SingleBookApiResponse {
  book: Book;
}

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(BOOKS_API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch books: HTTP ${response.status}`);
  }

  const data = (await response.json()) as BooksApiResponse;

  return data.books;
}

export async function fetchBookById(bookId: string): Promise<Book | null> {
  const response = await fetch(`${BOOKS_API_URL}/${bookId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch book: HTTP ${response.status}`);
  }

  const data = (await response.json()) as SingleBookApiResponse;

  return data.book;
}
