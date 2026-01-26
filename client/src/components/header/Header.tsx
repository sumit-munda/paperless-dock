import { useAppSelector } from "@/redux/hooks";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { RootState } from "@/redux/store";

const Header = () => {
  const  {user, isAuthenticated}  = useAppSelector((state: RootState) => state.auth);

  console.log(user, isAuthenticated);
  
  
  return (
    <div>
      <MobileNav user={user!} isAuthenticated={isAuthenticated}/>
      <DesktopNav user={user!} isAuthenticated={isAuthenticated}/>
    </div>
  );
};

export default Header;
