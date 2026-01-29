import { useState } from "react";
import EditProfileForm from "./forms/Profile";
import EditProfileLayout from "./EditProfileLayout";

const EditProfilePage = () => {
  const [section, setSection] = useState("profile");

  return (
    <EditProfileLayout>
      {section === "profile" && <EditProfileForm />}
      {/* {section === "security" && <SecurityForm />}
      {section === "preferences" && <PreferencesForm />} */}
    </EditProfileLayout>
  );
};

export default EditProfilePage;
