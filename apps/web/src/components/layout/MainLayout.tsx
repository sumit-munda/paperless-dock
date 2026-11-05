import { Link, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/useAuth";

const MainLayout = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

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

          {user ? (
            <>
              <Link to="/library">My Library </Link>

              <span className="user-greeting">Hi, {user.name}</span>

              <Link to="/profile">Profile</Link>

              <button
                className="nav-button"
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </>
          )}
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
