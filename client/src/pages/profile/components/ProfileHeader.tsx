import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileSheet from "./ProfileSheet";
import type { ProfileSection } from "../types";

interface ProfileHeaderProps {
  onEditSelect: (section: ProfileSection) => void;
}

// ProfileHeader
// Displays user avatar + basic info

const ProfileHeader = ({
  onEditSelect
}: ProfileHeaderProps) => {
  return (
    <div className="flex items-end justify-between gap-2 p-2">
      <div className="flex gap-3">
        <Avatar
          className=" h-14 w-14
    ring-2 ring-background
    grayscale"
        >
          <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        <div className="flex flex-col justify-end">
          <p className="font-semibold">Shad CN</p>
          <p className="text-xs text-muted-foreground">@shadcn</p>
        </div>

        {/* Opens sheet to select edit section */}
      </div>
      <EditProfileSheet onSelect={onEditSelect} />
    </div>
  );
};

export default ProfileHeader;
