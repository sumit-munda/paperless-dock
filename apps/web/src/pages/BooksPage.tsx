import { Link } from "react-router-dom";
import BookCard from "../components/BookCard";
import { useEffect, useState } from "react";
import { fetchBooks } from "../api/booksApi";
import type { Book } from "../data/books";

type SortOption = "title" | "price-low" | "price-high" | "rating";

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [sortOption, setSortOption] = useState<SortOption>("title");

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

  const categories = ["All", ...new Set(books.map((book) => book.category))];

  const filteredBooks = books.filter((book) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);

    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((firstBook, secondBook) => {
    if (sortOption === "title") {
      return firstBook.title.localeCompare(secondBook.title);
    }

    if (sortOption === "price-low") {
      return firstBook.price - secondBook.price;
    }

    if (sortOption === "price-high") {
      return secondBook.price - firstBook.price;
    }

    return secondBook.rating - firstBook.rating;
  });

  if (isLoading) {
    return (
      <section className="book-page" aria-labelledby="books-title">
        <h1 id="books-title">Discover Books</h1>

        <p role="status" aria-live="polite">
          Loading books...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="books-page" aria-labelledby="books-title">
        <h1 id="books-title">Discover Books</h1>

        <p role="alert">We couldn't load the books. {error}</p>

        <Link to="/">Back to Home</Link>
      </section>
    );
  }

  return (
    <section className="books-page" aria-labelledby="books-title">
      <h1 id="books-title">Discover Books</h1>

      <p>
        Explore digital books, find authors you love, and discover your next
        great read.
      </p>

      <div className="books-toolbar">
        <div className="books-toolbar__field">
          <label htmlFor="book-search">Search books</label>

          <input
            id="book-search"
            type="search"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="books-toolbar__field">
          <label htmlFor="book-category">Category</label>

          <select
            id="book-category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </select>
        </div>

        <div className="books-toolbar__field">
          <label htmlFor="book-sort">Sort by</label>

          <select
            id="book-sort"
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value as SortOption)
            }
          >
            <option value="title">Title: A to Z</option>

            <option value="price-low">Price: Low to High</option>

            <option value="price-high">Price: High to Low</option>

            <option value="rating">Rating: Highest First</option>
          </select>
        </div>
      </div>

      <p className="books-results-count" aria-live="polite">
        {sortedBooks.length} {sortedBooks.length === 1 ? "book" : "books"} found
      </p>

      {sortedBooks.length > 0 ? (
        <div className="books-grid">
          {sortedBooks.map((book) => (
            <BookCard book={book} key={book.id} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No books found</h2>

          <p>Try another search term or choose a different category.</p>

          <button
            className="button"
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSortOption("title");
            }}
          >
            Clear search and filters
          </button>
        </div>
      )}

      <p className="books-page__back-link">
        <Link to="/">Back to Home</Link>
      </p>
    </section>
  );
};

export default BooksPage;
