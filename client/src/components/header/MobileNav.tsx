import { DoorClosedLocked, Search } from "lucide-react";
import { useState } from "react";
import { GiLighthouse } from "react-icons/gi";
import { HiHomeModern, HiOutlineHomeModern } from "react-icons/hi2";
import { LuDoorOpen, LuSettings } from "react-icons/lu";
import { PiUserFocusBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverTrigger } from "../ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

const MobileNav = () => {
  const [theme, setTheme] = useState({});

  return (
    <header className="flex items-end justify-between px-4 py-2 md:hidden">
      <div className="flex items-end">
        {/* Hamburger Menu */}
        <SheetHamburger />
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

        {/* Dropdown Menu */}
        <DropdownMenuMob />
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
          <img src="./src/assets/logo.png" alt="logo" className="w-8" />
          <span className="text-start text-[.6rem]/2.5 ">
            The <br /> Paperless <br /> Dock
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full p-8 flex-col justify-between">
        <div className="flex-col justify-between items-center">
          <h2 className="text-sm text-neutral-500 font-semibold mb-4">Menu</h2>
          {/* Your menu items */}
          <nav className="space-y-1 text-lg">
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

        <Button size={"lg"}>
          <DoorClosedLocked />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
};

const DialogMobSearch = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outstyled" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden min-[376px]:inline">Search...</span>
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
            <span className="hidden sm:inline">
              Press <kbd className="rounded border px-1">Enter</kbd> to open
            </span>
            <span className="sm:hidden">Tap a result to open</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const DropdownMenuMob = () => {
  const navigate = useNavigate();

  const isLogin = false;

  return isLogin ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>@ Profile</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-45">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/register")}>
            <HiOutlineHomeModern className="text-neutral-700" />
            Create Account
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/login")}>
            <LuDoorOpen className="text-neutral-700" />
            Login to Account
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/register")}>
            <LuSettings className="text-neutral-700" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar
          className=" h-10 w-10
    ring-2 ring-background
    grayscale"
        >
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
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
          <DropdownMenuItem onClick={() => navigate("/register")}>
            <DoorClosedLocked className="text-neutral-700" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
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
