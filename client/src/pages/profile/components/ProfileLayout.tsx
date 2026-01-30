import MobileNav from "@/components/navigation/MobileNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type ReactNode } from "react";
import { useAppSelector } from "@/redux/hooks";
import ProfileSheet from "./ProfileSheet";
import type { ProfileSection } from "../types";
import ProfileSidebar from "./ProfileSidebar";

interface EditProfileLayoutProps {
  section: ProfileSection;
  onSelect: (section: ProfileSection) => void;
  children: ReactNode;
}

const ProfileLayout = ({ onSelect,section, children }: EditProfileLayoutProps) => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <>
      <SidebarProvider>
        {/* Mobile */}
        <header className="md:hidden mb-4">
          <MobileNav user={user} />
          <ProfileSheet onSelect={onSelect} />
        </header>

        {/* Desktop */}
        <div className="flex min-h-[calc(100vh-3.5rem)]">
          <aside className="hidden md:block w-64 border-r">
            <aside className="w-64 border">
              <ProfileSidebar activeSection={section} onSelect={onSelect} />
            </aside>

            <main className="flex-1 p-6">
              <div className="hidden md:flex mb-4">
                <SidebarTrigger />
              </div>
              {children}
            </main>
          </aside>
        </div>
      </SidebarProvider>
    </>
  );
};

export default ProfileLayout;
