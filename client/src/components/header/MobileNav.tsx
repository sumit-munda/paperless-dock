import type { UserProp } from "@/types/types";
import { DoorClosedLocked, Search } from "lucide-react";
import { useState } from "react";
import { GiLighthouse } from "react-icons/gi";
import { HiHomeModern } from "react-icons/hi2";
import { LuDoorOpen } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverTrigger } from "../ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

const MobileNav = ({ user }: UserProp) => {
  const [theme, setTheme] = useState({});

  return (
    <header className="flex items-end justify-between p-2 md:hidden">
      <div className="flex items-end">
        {/* Hamburger Menu */}
        <SheetHamburger />
      </div>

      <div className="flex gap-1.5">
        <DialogMobSearch />

        {/* Theme Toggle */}
        <Button
          variant="unstyled"
          size={"icon-sm"}
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? <GiLighthouse /> : <GiLighthouse />}
        </Button>

        {/* Dropdown Menu in Mob */}
        <DropdownMenuMob user={user} />
      </div>
    </header>
  );
};

export default MobileNav;

const SheetHamburger = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="unstyled" size="sm">
          <img src="./src/assets/logo.png" alt="" className="w-7" />
          <span className="text-start text-[.5rem]/2 ">
            The <br /> Paperless <br /> Dock
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full p-8 flex-col justify-between"
      >
        <div className="flex-col justify-between items-center">
          <h2 className="text-sm text-neutral-500 font-semibold mb-4">Menu</h2>
          {/* Your menu items */}
          <nav className="space-y-2">
            <a href="/" className="block">
              Home
            </a>
            <a href="/profile" className="block">
              Profile
            </a>
            <a href="/settings" className="block">
              Settings
            </a>
          </nav>
        </div>

        <Button>
          <DoorClosedLocked />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export const DialogMobSearch = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outstyled"
          size="sm"
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden min-[322px]:inline">Search...</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 overflow-hidden [&>button]:hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search across your documents and actions
          </DialogDescription>
        </DialogHeader>

        <Command className="flex h-full flex-col">
          {/* Search Input */}
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted px-3">
              <CommandInput placeholder="Search..." className="h-9 text-sm" />
            </div>
          </div>

          {/* Content */}
          <CommandList className="h-[85vh] overflow-y-auto p-2 pt-0">
            <CommandEmpty>No results found.</CommandEmpty>

            {/* GENRES */}
            <CommandGroup heading="Genres">
              <CommandItem>Fiction</CommandItem>
              <CommandItem>Non-Fiction</CommandItem>
              <CommandItem>Fantasy</CommandItem>
              <CommandItem>Science Fiction</CommandItem>
              <CommandItem>Mystery</CommandItem>
            </CommandGroup>

            {/* CATEGORIES */}
            <CommandGroup heading="Categories">
              <CommandItem>Best Sellers</CommandItem>
              <CommandItem>New Releases</CommandItem>
              <CommandItem>Editor&apos;s Picks</CommandItem>
            </CommandGroup>

            {/* RESOURCES */}
            <CommandGroup heading="Resources">
              <CommandItem>Reading Guides</CommandItem>
              <CommandItem>Author Interviews</CommandItem>
              <CommandItem>Community Reviews</CommandItem>
            </CommandGroup>
          </CommandList>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Press <kbd className="rounded border px-1">Enter</kbd> to open
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export const DropdownMenuMob = ({ user }: UserProp) => {
  const navigate = useNavigate();

  return user === null && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={"sm"}>@ Profile</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="mr-2 font-semibold">
        <DropdownMenuItem onClick={() => navigate("/register")}>
          <HiHomeModern className="text-neutral-800" />
          Create
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/login")}>
          <LuDoorOpen className="text-neutral-800" />
          Login
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const PopoverRegister = () => {
  return (
    <Popover>
      <PopoverTrigger>
        <Button></Button>
      </PopoverTrigger>
    </Popover>
  );
};
