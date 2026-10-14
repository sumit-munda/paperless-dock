import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { books } from "../data/books";

const CartPage = () => {
  const {
    items,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    subtotal,
  } = useCart();

  if (items.length === 0) {
    return (
      <section className="cart-page">
        <h1>Your Shopping Cart</h1>

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

      <p>Review your books and adjust quantities before checkout.</p>

      <div className="cart-items">
        {items.map((item) => {
          const book = books.find((candidate) => candidate.id === item.bookId);

          if (!book) {
            return null;
          }

          const itemTotal = book.price * item.quantity;

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

                <p>Price: ₹{book.price.toFixed(2)} </p>

                <div
                  className="quantity-controls"
                  aria-label={`Quantity controls for ${book.title}`}
                >
                  <button
                    type="button"
                    onClick={() => decreaseQuantity(book.id)}
                    aria-label={`Decrease quantity of ${book.title}`}
                  >
                    -
                  </button>

                  <span aria-live="polite">{item.quantity}</span>

                  <button
                    type="button"
                    onClick={() => increaseQuantity(book.id)}
                    disabled={item.quantity >= 99}
                    aria-label={`Increase quantity of ${book.title}`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="remove-item-button"
                  onClick={() => removeFromCart(book.id)}
                >
                  Remove
                </button>
              </div>

              <p className="cart-item-total">₹ {itemTotal.toFixed(2)}</p>
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

        <p className="checkout-note">
          Checkout will be available in a future step.
        </p>

        <button type="button" className="button" disabled>
          Proceed to Checkout
        </button>

        <Link to="/books" className="continue-shopping-link">
          Continue Shopping
        </Link>
      </aside>
    </section>
  );
};

export default CartPage;
