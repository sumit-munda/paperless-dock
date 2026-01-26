import { logout } from "@/services/auth.service";
import { DoorClosedLocked } from "lucide-react";
import { useState } from "react";
import { GiLighthouse } from "react-icons/gi";
import { LuSettings } from "react-icons/lu";
import { PiUserFocusBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
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
import { DialogMobSearch, DropdownMenuMob } from "./MobileNav";
import type { SessionUserInfo } from "@/types/types";

const DesktopNav = ({ user, isAuthenticated }: SessionUserInfo) => {
  const [theme, setTheme] = useState({});

  const navigate = useNavigate();

  return (
    <div>
      <header className="hidden flex items-end justify-between px-4 py-2 md:flex">
        <div className="flex items-end gap-5">
          {/* Logo */}
          <Button variant="unstyled" size="sm" onClick={() => navigate("/")}>
            <img src="./src/assets/logo.png" alt="logo" className="w-8" />
            <span className="text-start text-[.6rem]/2.5 ">
              The <br /> Paperless <br /> Dock
            </span>
          </Button>

          <div className="">
            {/* Navbar items */}
            <nav className="flex gap-4 text-sm">
              <a href="/" className="block">
                Docs
              </a>
              <a href="/profile" className="block">
                Features
              </a>
              <a href="/settings" className="block">
                Pricing
              </a>
            </nav>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DialogMobSearch />

          {/* Theme Toggle */}
          <Button
            variant="unstyled"
            size={"icon-lg"}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <GiLighthouse /> : <GiLighthouse />}
          </Button>

          {/* Mobile + Tablet */}
          <div className="block max-[768px]:block min-[769px]:hidden">
            <DropdownMenuMob user={user} isAuthenticated={isAuthenticated} />
          </div>

          {/* Desktop only */}
          {isAuthenticated === true && user !== null ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar
                  className=" h-10 w-10
    ring-2 ring-background
    grayscale"
                >
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Avatar
                      className=" h-10 w-10
    ring-2 ring-background
    grayscale"
                      onClick={() => navigate("/profile")}
                    >
                      <AvatarImage
                        src="https://github.com/shadcn.png"
                        alt="@shadcn"
                      />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="text-[.8rem]">
                      <p>Shad CN</p>
                      <p>@shadcn</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/register")}>
                    <PiUserFocusBold className="text-neutral-700" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/login")}>
                    <LuSettings className="text-neutral-700" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={logout}>
                    <DoorClosedLocked className="text-neutral-700" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden min-[769px]:flex gap-2">
              <Button
                variant="unstyled"
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
      </header>
    </div>
  );
};

export default DesktopNav;
