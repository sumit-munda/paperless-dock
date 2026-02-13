import { useState } from "react";
import ProfileLayout from "./components/ProfileLayout";
import AccountForm from "./forms/Account";
import PreferencesForm from "./forms/Preferences";
import ProfileForm from "./forms/Profile";
import SecurityForm from "./forms/Security";
import SubscriptionForm from "./forms/Subscription";
import type { ProfileSection } from "./types";
import ProfileSettings from "./settings";
import ProfileTabs from "./components/ProfileTabs";

const ProfilePage = () => {
  const [section, setSection] = useState<ProfileSection>("profile");

  return (
    <ProfileLayout onSelect={setSection} section={section}>
      {section === "tabs" && <ProfileTabs />}
      {section === "profile" && <ProfileForm />}
      {section === "account" && <AccountForm />}
      {section === "subscription" && <SubscriptionForm />}
      {section === "security" && <SecurityForm />}
      {section === "preferences" && <PreferencesForm />}
      {section === "settings" && <ProfileSettings />}
    </ProfileLayout>
  );
};

export default ProfilePage;
