import { useGetProfileQuery } from "@/redux/api/profileApi";
import { useState } from "react";
import ProfileHeader from "./components/ProfileHeader";
import ProfileTabs from "./components/ProfileTabs";
import AccountForm from "./forms/Account";
import PreferencesForm from "./forms/Preferences";
import ProfileForm from "./forms/Profile";
import SecurityForm from "./forms/Security";
import SubscriptionForm from "./forms/Subscription";
import ProfileSettings from "./settings";
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
  const { data, isLoading, error } = useGetProfileQuery();

  const userProfileInfo = data?.data;

  return (
    <section aria-labelledby="profile-page" className="px-6 py-4">
      {/* Profile header */}
      <ProfileHeader onEditSelect={setSection} data={userProfileInfo} />

      {/* Content area */}
      <div className="flex justify-center p-2">
        {/* Default tabbed dashboard */}
        {section === "tabs" && <ProfileTabs />}

        {/* Edit sections */}
        {section === "profile" && <ProfileForm data={userProfileInfo} />}
        {section === "account" && <AccountForm data={userProfileInfo} />}
        {section === "security" && <SecurityForm data={userProfileInfo} />}
        {section === "subscription" && (
          <SubscriptionForm data={userProfileInfo} />
        )}
        {section === "preferences" && (
          <PreferencesForm data={userProfileInfo} />
        )}
        {section === "settings" && <ProfileSettings />}
      </div>
    </section>
  );
};

export default ProfilePage;
