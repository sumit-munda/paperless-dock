import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EditProfileSheet from "./ProfileSheet";
import type { ProfileSection } from "../types";
import type { UserProfile } from "@/types/user";

interface ProfileHeaderProps {
  data?: UserProfile;
  onEditSelect: (section: ProfileSection) => void;
}

// ProfileHeader
// Displays user avatar + basic info

const ProfileHeader = ({ data, onEditSelect }: ProfileHeaderProps) => {
  if (!data) return null;

  const { photo, name, username } = data;
  const avatarFallback = data.photo.split("=")[1];

  return (
    <div className="flex items-end justify-between gap-2 p-2">
      <div className="flex gap-3">
        <Avatar
          className=" h-14 w-14
    ring-2 ring-background"
        >
          <AvatarImage src={photo} alt="User avatar" />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col justify-end">
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted-foreground">{username}</p>
        </div>

        {/* Opens sheet to select edit section */}
      </div>
      <EditProfileSheet onSelect={onEditSelect} />
    </div>
  );
};

export default ProfileHeader;
