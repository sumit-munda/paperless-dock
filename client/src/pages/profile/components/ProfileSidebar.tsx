import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { ProfileSection } from "../types";

interface ProfilSidebarProps {
  activeSection: ProfileSection;
  onSelect: (section: ProfileSection) => void;
}

const profileSections: {
  label: string;
  section: ProfileSection;
}[] = [
  {
    label: "Profile",
    section: "profile",
  },
  { label: "Account", section: "account" },
  { label: "Security", section: "security" },
  { label: "Subscription", section: "subscription" },
  { label: "Preferences", section: "preferences" },
  { label: "Settings", section: "settings" },
];

// ProfileSidebar

const ProfileSidebar = ({ activeSection, onSelect }: ProfilSidebarProps) => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Profile Settings</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {profileSections.map(({ label, section }) => (
                <SidebarMenuItem key={section}>
                  <SidebarMenuButton
                    isActive={activeSection === section}
                    onClick={() => onSelect(section)}
                  >
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default ProfileSidebar;
