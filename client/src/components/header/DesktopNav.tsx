import React, { useState } from "react";
import { DialogMobSearch, DropdownMenuMob } from "./MobileNav";
import { Button } from "../ui/button";
import { GiLighthouse } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

const DesktopNav = () => {
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
            <DropdownMenuMob />
          </div>

          {/* Desktop only */}
          <div className="hidden min-[769px]:flex gap-2">
            <Button variant="unstyled" size="sm" onClick={() => navigate("/register")}>
              Create Account
            </Button>
            <Button size="sm" onClick={() => navigate("/login")}>Login to Account</Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default DesktopNav;
