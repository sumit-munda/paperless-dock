import { Link, useNavigate } from "react-router-dom";
import type { SessionUser } from "@/types/auth";
import { useState } from "react";
import UserMenu from "./UserMenu";
import Logo from "../common/Logo";
import { Button } from "../ui/button";
import { GiLighthouse } from "react-icons/gi";
import GlobalSearch from "../search/GlobalSearch";
import { LiaShoppingBagSolid } from "react-icons/lia";

// navigation/DesktopNav.tsx
// Desktop navigation
// Visible on md+ screens only

interface DesktopNavProps {
  user: SessionUser | null;
}

const DesktopNav = ({ user }: DesktopNavProps) => {
  // Local-only theme toggle placeholder
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const navigate = useNavigate();

  return (
    <nav className="flex w-full items-center justify-between">
      {/* Left: logo + primary link */}
      <div className="flex items-end gap-6">
        <Link to="/">
          <Logo />
        </Link>

        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Home
        </Link>
        <Link
          to="/explore"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Explore
        </Link>
        <Link
          to="/books"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Books
        </Link>
        <Link
          to="/read"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Read
        </Link>
        <Link
          to="/about"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          About
        </Link>
        <Link
          to="/help"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Help
        </Link>
        {user && user.role === "admin" && (
          <Link
            to="/help"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
        )}
        {user && user.role === "seller" && (
          <Link
            to="/help"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Seller
          </Link>
        )}
      </div>

      {/* Right: search, theme, auth */}
      <div className="flex items-center gap-2">
        <GlobalSearch />

        {/* Theme Toggle (UI only for now) */}
        <Button
          variant="unstyled"
          size={"icon"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <GiLighthouse />
        </Button>

        {/* Cart Button */}
        {user && (
          <Button
            variant="ghost"
            size={"icon"}
            onClick={() => navigate("/cart")}
          >
            <LiaShoppingBagSolid />
          </Button>
        )}

        {user ? (
          <UserMenu />
        ) : (
          <div className="hidden md:flex">
            <Button size="sm" onClick={() => navigate("/login")}>
              @ Sign in
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DesktopNav;
