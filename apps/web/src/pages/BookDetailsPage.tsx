import { Link, useParams } from "react-router-dom";
import { books } from "../data/books";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const BookDetailsPage = () => {
  const { bookId } = useParams();

  const { addToCart } = useCart();

  const [addedToCart, setAddedToCart] = useState(false);

  const book = books.find((item) => item.id === bookId);

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
