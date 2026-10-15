import { useEffect, useState } from "react";
import type { Book } from "../data/books";
import { fetchBooks } from "../api/booksApi";

interface UseBooksResult {
  books: Book[];
  isLoading: boolean;
  error: string | null;
}

export function useBooks(): UseBooksResult {
  const [books, setBooks] = useState<Book[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadBooks() {
      try {
        const fetchedBooks = await fetchBooks();

        if (isActive) {
          setBooks(fetchedBooks);
        }
      } catch (error) {
        if (isActive) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load books. Please try again.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBooks();

    return () => {
      isActive = false;
    };
  }, []);

  return { books, isLoading, error };
}
