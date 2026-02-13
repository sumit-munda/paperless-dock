import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/types/user";

interface AccountFormProps {
  data?: UserProfile;
}

// profile/forms/Profile.tsx
// Account-level information (mostly read-only)

const AccountForm = ({ data }: AccountFormProps) => {
  // Temporarily static data
  // const { email, emailVerified, provider, role, createdAt } = {
  //   email: "you@example.com",
  //   emailVerified: true,
  //   provider: "credentials" as "credentials" | "google",
  //   role: "user",
  //   createdAt: 12342342422342,
  // };

  const { email, emailVerified, provider, role, createdAt } = data!;

  const capitalize = (value: string) => {
    return value ? value[0].toUpperCase() + value.slice(1) : "";
  };

  return (
    <div className="w-full max-w-md">
      <FieldSet>
        <FieldGroup>
          {/* Email (editable) */}
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={email}
              defaultValue={email}
            />
            <FieldDescription>
              Changing your email requires verification.
            </FieldDescription>
          </Field>

          {/* Email verified status (display only) */}
          <Field>
            <FieldLabel>Email verified</FieldLabel>
            <Input
              value={emailVerified ? "Verified" : "Not verified"}
              readOnly
              disabled
            />
            {!emailVerified && (
              <FieldDescription>
                Please verify your email to secure your account.
              </FieldDescription>
            )}
          </Field>

          {/* Auth Provider (read-only) */}
          <Field>
            <FieldLabel>Sign-in provider</FieldLabel>
            <Input
              value={provider === "google" ? "Google" : "Email & Password"}
              readOnly
              disabled
            />
            <FieldDescription>This cannot be changed.</FieldDescription>
          </Field>

          {/* Role (read-only) */}
          <Field>
            <FieldLabel>Account role</FieldLabel>
            <Input value={capitalize(role)} readOnly disabled />
            <FieldDescription>Managed by the system.</FieldDescription>
          </Field>

          {/* Created at (display only) */}
          <Field>
            <FieldLabel>Account created</FieldLabel>
            <Input
              value={new Date(createdAt).toLocaleDateString()}
              readOnly
              disabled
            />
            <FieldDescription>
              The date your account was created.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  );
};

export default AccountForm;
