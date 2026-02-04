import { useGetProfileQuery } from "@/redux/api/profileApi";
import { logout } from "@/services/auth.service";
import { DoorClosedLocked } from "lucide-react";
import { LuSettings } from "react-icons/lu";
import { PiUserFocusBold } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const UserMenu = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useGetProfileQuery();

  if (isLoading || !data?.data) return null; // or skeleton / placeholder

  const { photo, name, username } = data.data;

  const avatarFallback = photo.split("=")[1];

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar
            className=" h-9 w-9
    ring-2 ring-background"
          >
            <AvatarImage src={photo} alt="User avatar" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem className="gap-2">
              <Avatar className=" h-8 w-8">
                <AvatarImage src={photo} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>

              <div className="text-xs">
                <p className="font-medium">{name}</p>
                <p>{username}</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <PiUserFocusBold />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
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
