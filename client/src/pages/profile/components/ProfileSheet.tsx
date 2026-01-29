import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DoorClosedLocked } from "lucide-react";
import { FiEdit3 } from "react-icons/fi";
import { logout } from "@/services/auth.service";
import type { ProfileSection } from "../types";

interface ProfileSheetProps {
  onSelect: (section: ProfileSection) => void;
}

// ProfileSheet
// Switches profile sections via parent state

const EditProfileSheet = ({ onSelect }: ProfileSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outstyled" size="sm">
          <FiEdit3 />
          Edit Profile
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] p-6 flex flex-col justify-between"
      >
        {/* Required for screen readers */}
        <SheetTitle className="sr-only">Edit profile</SheetTitle>

        <SheetDescription className="sr-only">
          Choose a section to edit your profile settings
        </SheetDescription>

        {/* Section links */}
        <nav className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground font-semibold">Edit</p>

          <SectionButton
            label="Profile"
            section="profile"
            onSelect={onSelect}
          />
          <SectionButton
            label="Account"
            section="account"
            onSelect={onSelect}
          />
          <SectionButton
            label="Security"
            section="security"
            onSelect={onSelect}
          />
          <SectionButton
            label="Subscription"
            section="subscription"
            onSelect={onSelect}
          />
          <SectionButton
            label="Preferences"
            section="preferences"
            onSelect={onSelect}
          />
          <SectionButton
            label="Settings"
            section="settings"
            onSelect={onSelect}
          />

          <SheetClose asChild>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => onSelect("tabs")}
            >
              Go back
            </Button>
          </SheetClose>
        </nav>

        {/* Logout action */}
        <Button size="lg" variant="destructive" onClick={logout}>
          <DoorClosedLocked />
          Logout
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default EditProfileSheet;

// Helper Component

interface SectionButtonProps {
  label: string;
  section: ProfileSection;
  onSelect: (section: ProfileSection) => void;
}

// SectionButton

const SectionButton = ({ label, section, onSelect }: SectionButtonProps) => {
  return (
    <SheetClose asChild>
      <Button
        variant="unstyled"
        className="justify-start"
        onClick={() => onSelect(section)}
      >
        {label}
      </Button>
    </SheetClose>
  );
};
