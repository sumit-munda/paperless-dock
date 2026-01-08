import { HiHomeModern } from "react-icons/hi2";
import { LuDoorOpen } from "react-icons/lu";
import { MdFace4 } from "react-icons/md";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "../ui/dropdown-menu";

const MobileNav = () => {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={"sm"}>
            <MdFace4 />
            Profile
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem><HiHomeModern />Create</DropdownMenuItem>
          <DropdownMenuItem><LuDoorOpen />Login</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MobileNav;
