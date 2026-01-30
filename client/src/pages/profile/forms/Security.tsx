import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// profile/forms/Security.tsx
// Password & security management

const SecurityForm = () => {
  // todo
  const handleForgotPassword = () => {
    console.warn("Forgot password flow not implemented yet");
  };

  const handleLogoutAllDevices = () => {
    console.warn("Logout from all devices not implemented yet");
  };

  return (
    <div className="w-full max-w-md">
      {/* Password change */}
      <FieldSet>
        <FieldLegend>Security</FieldLegend>
        <FieldDescription>
          Manage your password and account security.
        </FieldDescription>

        <FieldGroup>
          {/* Current password */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="currentPassword">
                Current password
              </FieldLabel>

              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
            />
          </Field>

          {/* New password */}
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input id="newPassword" type="password" placeholder="••••••••" />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>

          {/* Confirm password */}
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm new password
            </FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Password status */}
      <FieldSet className="mt-6">
        <FieldLegend>Password status</FieldLegend>

        <FieldGroup>
          <Field>
            <FieldDescription className="text-sm">
              Your password does not require a reset.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Login activity */}
      <FieldSet className="mt-6">
        <FieldLegend>Login activity</FieldLegend>

        <FieldGroup>
          <Field>
            <FieldLabel>Last login</FieldLabel>
            <FieldDescription>March 10, 2026 · 9:42 AM</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Actions */}
      <FieldSet className="mt-6">
        <FieldGroup>
          <Field>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogoutAllDevices}
            >
              Log out from all devices
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  );
};

export default SecurityForm;
