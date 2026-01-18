import { useState } from "react";
import EditProfileForm from "./EditProfileForm";
import EditProfileLayout from "./EditProfileLayout";

export default function EditProfilePage() {
  const [section, setSection] = useState("profile");

  return (
    <EditProfileLayout>
      {section === "profile" && <EditProfileForm />}
      {/* {section === "security" && <SecurityForm />}
      {section === "preferences" && <PreferencesForm />} */}
    </EditProfileLayout>
  );
}


