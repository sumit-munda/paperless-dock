import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useBooks } from "../hooks/useBooks";

const CartPage = () => {
  const {
    items,
    removeFromCart,
    isLoading,
    error,
    migrationPending,
    retryMigration,
    checkout,
  } = useCart();

  const { books } = useBooks();
  const navigate = useNavigate();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const subtotal = items.reduce((total, item) => {
    const book = books.find((candidate) => candidate.id === item.bookId);

    return total + (book ? book.price : 0);
  }, 0);

  async function handleCheckout() {
    if (isCheckingOut || migrationPending || items.length === 0) {
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const order = await checkout();

      navigate(`/orders/${order.id}`);
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : "Unable to create your order. Please try again.",
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  const migrationNotice = migrationPending ? (
    <div className="cart-migration-notice">
      <p>
        Some items from your guest cart haven't been added to your account yet.
        Your account cart is still available.
      </p>

      {error && <p role="alert">{error}</p>}

      <button
        type="button"
        className="button"
        onClick={() => void retryMigration()}
      >
        Retry migration
      </button>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <section className="cart-page" aria-labelledby="cart-title">
        <h1 id="cart-title">Your Shopping Cart</h1>

        <p role="status" aria-live="polite">
          Loading your cart...
        </p>
      </section>
    );
  }

  if (error && !migrationPending) {
    return (
      <section className="cart-page" aria-labelledby="cart-title">
        <h1 id="cart-title">Your Shopping Cart</h1>

        {migrationNotice}

        <p role="alert">
          We couldn't load your cart's book information. {error}
        </p>

        <Link to="/books" className="button">
          Discover Books
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <h1>Your Shopping Cart</h1>

        {migrationNotice}

        <p>Your cart is empty. Discover a book you'd love to read.</p>

        <Link to="/books" className="button">
          Discover Books
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <h1>Your Shopping Cart</h1>

      {migrationNotice}

      <p>Review your selected books before checkout.</p>

      <div className="cart-items">
        {items.map((item) => {
          const book = books.find((candidate) => candidate.id === item.bookId);

          if (!book) {
            return (
              <article className="cart-item" key={item.bookId}>
                <div className="cart-item-details">
                  <h2>Book unavailable</h2>

                  <p>This book could not be found in the current catalog.</p>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => void removeFromCart(item.bookId)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          }

          return (
            <article className="cart-item" key={item.bookId}>
              <img
                className="cart-item-cover"
                src={book.coverImage}
                alt={`Cover of ${book.title}`}
              />

              <div className="cart-item-details">
                <h2>{book.title}</h2>

                <p>By {book.author}</p>

                <p>Price: ₹{book.price.toFixed(2)}</p>

                <p>Digital edition · Single purchase</p>

                <button
                  type="button"
                  className="remove-item-button"
                  onClick={() => void removeFromCart(book.id)}
                >
                  Remove
                </button>
              </div>

              <p className="cart-item-total">₹{book.price.toFixed(2)}</p>
            </article>
          );
        })}
      </div>

      <aside className="cart-summary">
        <h2>Order Summary</h2>

        <p className="cart-subtotal">
          <span>Subtotal</span>
          <strong>₹{subtotal.toFixed(2)}</strong>
        </p>

        {checkoutError && (
          <p role="alert" className="checkout-error">
            {checkoutError}
          </p>
        )}

        <p className="checkout-note">
          Your order will be created with payment pending. No library access
          will be granted until payment is verified.
        </p>

        <button
          type="button"
          className="button"
          onClick={() => void handleCheckout()}
          disabled={isCheckingOut || migrationPending}
        >
          {isCheckingOut ? "Creating Order..." : "Proceed to Checkout"}
        </button>

        <Link to="/books" className="continue-shopping-link">
          Continue Shopping
        </Link>
      </aside>
    </section>
  );
};

export default CartPage;
