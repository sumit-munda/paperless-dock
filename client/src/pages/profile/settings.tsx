import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { logout } from "@/services/auth.service";

// profile/settings.tsx
// User-level account actions: logout, deactivate, delete account

const ProfileSettings = () => {
  const handleLogout = () => {
    logout();
  };

  const handleDeactivateAccount = () => {
    // todo
    console.warn("Deacitvate account not implemented yet");
  };

  const handleDeleteAccount = () => {
    // todo
    console.warn("Delete account not implemented yet");
  };

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Session actions */}
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel>Session</FieldLabel>
            <FieldDescription>
              End your current session on this device.
            </FieldDescription>

            <Button variant="outline" className="mt-2 w-full" onClick={handleLogout}>
              Logout
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Danger zone */}
      <FieldSet className="border border-destructive/40 p-4 rounded-2xl">
        <FieldGroup>
          <Field>
            <FieldLabel className="text-destructive">
              Deactivate account
            </FieldLabel>
            <FieldDescription>
              Temporarily disable your account. You can reactivate later.
            </FieldDescription>

            <Button
              variant="outline"
              className="mt-2 w-full border-destructive text-destructive" onClick={handleDeactivateAccount}
            >
              Deactivate account
            </Button>
          </Field>

          <Field>
            <FieldLabel className="text-destructive">Delete account</FieldLabel>
            <FieldDescription>
              Permanently delete your account and all associated data.
            </FieldDescription>

            <Button variant="destructive" className="mt-2 w-full" onClick={handleDeleteAccount}>
              Delete account permanently
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  );
};

export default ProfileSettings;
