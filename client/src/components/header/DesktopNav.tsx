
import { MenuIcon, MoonIcon, PlusIcon, SunIcon, XIcon } from "lucide-react"; // or your icon set
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
// import { useTheme } from "next-themes"

export default function MobileHeader() {
  const [ theme, setTheme ] = useState({})

  return (
    <header className="flex items-center justify-between p-4 md:hidden">
      {/* Hamburger Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Menu</h2>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <XIcon className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          </div>

          {/* Your menu items */}
          <nav className="space-y-2">
            <a href="/" className="block">Home</a>
            <a href="/profile" className="block">Profile</a>
            <a href="/settings" className="block">Settings</a>
          </nav>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </SheetContent>
      </Sheet>

      {/* Logo / Title */}
      <div className="text-xl font-bold">App Name</div>

      {/* + New Button */}
      <Button variant="default" size="sm">
        <PlusIcon className="w-4 h-4 mr-2" />
        New
      </Button>
    </header>
  )
}
