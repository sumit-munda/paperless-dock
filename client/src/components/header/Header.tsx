import { useAppSelector } from "@/redux/hooks";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { RootState } from "@/redux/store";

const Header = () => {
  const user = useAppSelector((state: RootState) => state.auth.user);

  console.log(user);

  return (
    <div>
      <MobileNav user={user} />
      <DesktopNav user={user} />
    </div>
  );
};

export default Header;
