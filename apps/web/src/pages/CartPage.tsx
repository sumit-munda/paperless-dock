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

        <div className="demo-payment-notice">
          <p>
            <strong>Demo Payment Mode — No real money is charged.</strong>
            <br />
            Paperless Dock uses Razorpay Test Mode. You can explore the checkout
            process using the test credentials below.
          </p>

          <details>
            <summary>How to test payments</summary>

            <div className="demo-payment-instructions">
              <h3>Contact Details</h3>
              <p>
                Enter your own email address and mobile number when prompted. No
                special test credentials are required.
              </p>

              <h3>Netbanking (Recommended)</h3>
              <ol>
                <li>Select Netbanking in the Razorpay checkout window.</li>
                <li>Choose any listed bank.</li>
                <li>
                  On the simulated bank page, select Success to complete the
                  test payment.
                </li>
              </ol>

              <p>
                You can also select Failure to explore an unsuccessful payment.
              </p>

              <p>
                Your contact details are submitted to Razorpay during checkout.
              </p>

              <h3>Card</h3>
              <p>
                Visa test card: <code>4100 2800 0000 1007</code>
              </p>
              <p>CVV: Any CVV · Expiry: Any future date</p>

              <p>
                For more test cards and payment scenarios, see{" "}
                <a
                  href="https://razorpay.com/docs/payments/payments/test-card-upi-details/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Razorpay's official test payment documentation
                </a>
                .
              </p>
            </div>
          </details>
        </div>

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
