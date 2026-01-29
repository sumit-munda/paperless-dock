import { useGetProfileQuery } from "@/redux/api/profileApi";
import { useState } from "react";
import ProfileHeader from "./components/ProfileHeader";
import ProfileTabs from "./components/ProfileTabs";
import EditAccountForm from "./forms/Account";
import EditPreferencesForm from "./forms/Preferences";
import EditProfileForm from "./forms/Profile";
import EditSecurityForm from "./forms/Security";
import EditSubscriptionForm from "./forms/Subscription";
import EditSettings from "./settings";
import type { ProfileSection } from "./types";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
];

// profile/index.tsx

const ProfilePage = () => {
  const [section, setSection] = useState<ProfileSection>("tabs");

  // Profile data (currently logged for dev; UI integration later)
  const { data: profile, isLoading, error } = useGetProfileQuery();
  console.log(profile);

  return (
    <div>
      <div className="min-h-screen px-6 py-4">
        {/* Profile header */}
        <ProfileHeader onEditSelect={setSection}/>

        {/* Content area */}
        <div className="flex justify-center p-2">
          {/* Default tabbed dashboard */}
          {section === "tabs" && <ProfileTabs />}

          {/* Edit sections */}
          {section === "profile" && <EditProfileForm />}
          {section === "account" && <EditAccountForm />}
          {section === "security" && <EditSecurityForm />}
          {section === "subscription" && <EditSubscriptionForm />}
          {section === "preferences" && <EditPreferencesForm />}
          {section === "settings" && <EditSettings />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
