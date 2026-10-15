import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBookById } from "../api/booksApi";
import { useCart } from "../context/CartContext";
import type { Book } from "../data/books";

const BookDetailsPage = () => {
  const { bookId } = useParams();

  const { addToCart } = useCart();

  const [book, setBook] = useState<Book | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    let isActive = true;

    setBook(null);
    setError(null);
    setIsLoading(true);
    setAddedToCart(false);

    async function loadBook() {
      try {
        if (!bookId) {
          throw new Error("No book ID was provided in the URL.");
        }

        const fetchedBook = await fetchBookById(bookId);

        if (isActive) {
          setBook(fetchedBook);
        }
      } catch (error) {
        if (!isActive) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load this book. Please try again.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadBook();

    return () => {
      isActive = false;
    };
  }, [bookId]);

  if (isLoading) {
    return (
      <section className="book-details" aria-labelledby="book-details-title">
        <h1 id="book-details-title">Loading Book...</h1>

        <p role="status" aria-live="polite">
          Please wait while we retrieve the book details.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="book-details" aria-labelledby="book-details-title">
        <h1 id="book-details-title">Unable to load Book</h1>

        <p role="alert">We couldn't load this book. {error}</p>

        <Link className="button" to="/books">
          Back to Discover Books
        </Link>
      </section>
    );
  }

  if (!book) {
    return (
      <section className="book-details">
        <h1>Book Not Found</h1>

        <p>
          We couldn't find that book. It may have been removed or the link may
          be incorrect.
        </p>

        <Link className="button" to="/books">
          Back to Discover Books
        </Link>
      </section>
    );
  }

  function handleAddToCart() {
    addToCart(String(book?.id));

    setAddedToCart(true);
  }

  return (
    <section className="book-details">
      <Link className="book-details__back-link" to="/books">
        ← Back to Discover Books
      </Link>

      <div className="book-details__layout">
        <img
          className="book-details__cover"
          src={book.coverImage}
          alt={`Cover of ${book.title}`}
        />

        <div className="book-details__content">
          <p className="book-card__category">{book.category}</p>

          <h1>{book.title}</h1>

          <p className="book-details__author">by {book.author}</p>

          <p
            className="book-card__rating"
            aria-label={`Rating: ${book.rating} out of 5`}
          >
            <span aria-hidden="true">★</span> {book.rating.toFixed(1)} / 5
          </p>

          <p className="book-details__description">{book.description}</p>

          <p className="book-details__price">
            {book.price.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            })}
          </p>

          <button
            className="button"
            type="button"
            onClick={handleAddToCart}
            aria-describedby="purchase-notice"
          >
            Add to Cart
          </button>

          <p
            id="purchase-notice"
            className="book-details__notice"
            aria-live="polite"
          >
            {addedToCart
              ? `${book.title} added to your cart!`
              : "Add this book to your shopping cart."}
          </p>

          {addedToCart && (
            <Link className="button" to="/cart">
              View Cart
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default BookDetailsPage;
