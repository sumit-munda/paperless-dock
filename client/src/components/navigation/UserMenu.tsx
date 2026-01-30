import type { SessionUser } from "@/types/auth";
import { logout } from "@/services/auth.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LuSettings } from "react-icons/lu";
import { PiUserFocusBold } from "react-icons/pi";
import { DoorClosedLocked } from "lucide-react";

interface UserMenuProps {
  user: SessionUser | null;
}

const UserMenu = ({ user }: UserMenuProps) => {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar
            className=" h-9 w-9
    ring-2 ring-background"
          >
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt="User avatar"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem className="gap-2">
              <Avatar className=" h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>

              <div className="text-xs">
                <p className="font-medium">User</p>
                <p>@user</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem>
              <PiUserFocusBold />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LuSettings />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={logout}>
              <DoorClosedLocked />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
