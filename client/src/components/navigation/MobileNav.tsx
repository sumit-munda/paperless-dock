import { logout } from "@/services/auth.service";
import type { SessionUser } from "@/types/auth";
import { DoorClosedLocked } from "lucide-react";
import { useState } from "react";
import { GiLighthouse } from "react-icons/gi";
import { HiOutlineHomeModern } from "react-icons/hi2";
import { LuDoorOpen, LuSettings } from "react-icons/lu";
import { PiUserFocusBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import Logo from "../common/Logo";
import GlobalSearch from "../search/GlobalSearch";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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

interface MobNavProps {
  user: SessionUser | null;
}

const MobileNav = ({ user }: MobNavProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <header className="flex items-end justify-between px-4 py-2 md:hidden">
      <SheetHamburger />

      <div className="flex items-center gap-1">
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

      <SheetContent side="left" className="w-full p-8 flex-col justify-between">
        <div>
          <h2 className="text-sm text-neutral-500 font-semibold mb-4">Menu</h2>

          <nav className="space-y-1 text-lg">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/profile")}>Profile</button>
            <button onClick={() => navigate("/settings")}>Settings</button>
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
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar
          className="h-10 w-10
    ring-2 ring-background
    grayscale"
        >
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <Avatar className=" h-8 w-8" onClick={() => navigate("/profile")}>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>

            <div className="ml-2 text-xs">
              <p>Shad CN</p>
              <p className="text-muted-foreground">@shadcn</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <PiUserFocusBold />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <LuSettings />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout}>
          <DoorClosedLocked />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
