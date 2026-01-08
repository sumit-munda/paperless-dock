import MobileHeader from "./DesktopNav";
import MobileNav from "./MobileNav";

const Header = () => {
  return (
    <div>
      <header className="h-7 border-b">
        <MobileNav/>
        <MobileHeader/>
      </header>
    </div>
  );
};

export default Header;
