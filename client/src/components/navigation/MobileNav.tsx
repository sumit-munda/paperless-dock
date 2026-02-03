import { logout } from "@/services/auth.service";
import type { SessionUser } from "@/types/auth";
import { DoorClosedLocked } from "lucide-react";
import { useState } from "react";
import { GiLighthouse } from "react-icons/gi";
import { HiOutlineHomeModern } from "react-icons/hi2";
import { LuDoorOpen, LuSettings } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../common/Logo";
import GlobalSearch from "../search/GlobalSearch";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import UserMenu from "./UserMenu";

interface MobNavProps {
  user: SessionUser | null;
}

const MobileNav = ({ user }: MobNavProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <header className="flex w-full items-end justify-between md:hidden">
      <SheetHamburger />

      <div className="flex items-center gap-1 shrink-0">
        <GlobalSearch />

        {/* Theme Toggle (UI-only for now) */}
        <Button
          variant="unstyled"
          size={"icon-lg"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <GiLighthouse />
        </Button>

        <DropdownMenuMob user={user} />
      </div>
    </header>
  );
};

export default MobileNav;

/* ---------------- Sheet / Hamburger ---------------- */

export const SheetHamburger = () => {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Logo />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full p-8 flex flex-col justify-between shrink-0"
      >
        <div>
          <h2 className="text-sm text-neutral-500 font-semibold mb-4">Menu</h2>

          <nav className="space-y-1 text-lg">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
            <Link to="/settings" className="nav-link">
              Settings
            </Link>
          </nav>
        </div>

        <Button size={"lg"} onClick={logout}>
          <DoorClosedLocked />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
};

/* ---------------- Dropdown Menu ---------------- */

export const DropdownMenuMob = ({ user }: MobNavProps) => {
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>@ Profile</Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/register")}>
                <HiOutlineHomeModern />
                Create Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/login")}>
                <LuDoorOpen />
                Login to Account
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <LuSettings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div>
      <UserMenu user={user} />
    </div>
  );
};
