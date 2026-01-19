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
import type { Section } from "../Profile";

const EditProfileSheet = ({
  onSelect,
}: {
  onSelect: (section: Section) => void;
}) => {
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
    {/* ✅ REQUIRED for accessibility */}
    <SheetTitle className="sr-only">
      Edit profile
    </SheetTitle>

    <SheetDescription className="sr-only">
      Choose a section to edit your profile settings
    </SheetDescription>

    {/* Content */}
    <div className="flex flex-col gap-4">
      <h2 className="text-sm text-muted-foreground font-semibold">
        Edit
      </h2>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("profile")}
        >
          Profile
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("account")}
        >
          Account
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("security")}
        >
          Security
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("subscription")}
        >
          Subscription
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("preferences")}
        >
          Preferences
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="unstyled"
          className="justify-start"
          onClick={() => onSelect("settings")}
        >
          Settings
        </Button>
      </SheetClose>

      <SheetClose asChild>
        <Button
          variant="ghost"
          className="justify-start"
          onClick={() => onSelect("tabs")}
        >
          Go back
        </Button>
      </SheetClose>
    </div>

    {/* Footer action */}
    <Button size="lg" variant="destructive">
      <DoorClosedLocked />
      Logout
    </Button>
  </SheetContent>
</Sheet>

  );
};

export default EditProfileSheet;
