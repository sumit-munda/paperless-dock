import { useAppSelector } from "@/redux/hooks";
import DesktopNav from "../navigation/DesktopNav";
import MobileNav from "../navigation/MobileNav";
import type { SessionUser } from "@/types/auth";

// navigation/Header.tsx
// App Header
// Reads auth state from Redux

const Header = () => {
  const user = useAppSelector((state) => state.auth.user);
  
  // const user:SessionUser = {id: "1234", role: "admin"};

  return (
    <header className="w-full bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        {/* Desktop navigation */}
        <div className="hidden md:flex w-full">
          <DesktopNav user={user} />
        </div>

        {/* Mobile navigation */}
        <div className="flex md:hidden w-full">
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
};

export default Header;
