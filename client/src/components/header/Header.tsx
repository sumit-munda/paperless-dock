import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";

const Header = () => {
  return (
    <div>
      <MobileNav />
      <DesktopNav />
    </div>
  );
};

export default Header;
