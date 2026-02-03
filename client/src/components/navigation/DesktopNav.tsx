import { Link, useNavigate } from "react-router-dom";
import type { SessionUser } from "@/types/auth";
import { useState } from "react";
import UserMenu from "./UserMenu";
import Logo from "../common/Logo";
import { Button } from "../ui/button";
import { GiLighthouse } from "react-icons/gi";
import GlobalSearch from "../search/GlobalSearch";

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
        <Link to={"/"}>
          <Logo onClick={() => navigate("/")} />
        </Link>

        <Link
          to="/docs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Docs
        </Link>
        <Link
          to="/profile"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Features
        </Link>
        <Link
          to="/settings"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Link>
      </div>

      {/* Right: search, theme, auth */}
      <div className="flex items-center gap-3">
        <GlobalSearch />

        {/* Theme Toggle (UI only for now) */}
        <Button
          variant="ghost"
          size={"icon"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <GiLighthouse />
        </Button>

        {user ? (
          <UserMenu user={user} />
        ) : (
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/register")}
            >
              Create Account
            </Button>
            <Button size="sm" onClick={() => navigate("/login")}>
              Login to Account
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default DesktopNav;
