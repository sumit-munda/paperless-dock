import { Link, Outlet } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const MainLayout = () => {
  const { itemCount } = useCart();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          PAPERLESS DOCK
        </Link>

        <nav aria-label="Main navigation">
          <Link to="/">Home</Link>

          <Link to="/books">Discover Books</Link>

          <Link to="/cart" className="cart-link">
            Cart{" "}
            <span
              className="cart-count"
              aria-label={`${itemCount} items in cart`}
            >
              {itemCount}
            </span>
          </Link>
        </nav>
      </header>

      <main id="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} PAPERLESS DOCK. Read more, anywhere.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
