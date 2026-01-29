import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EditAccountForm = () => {
  const { emailVerified, provider, role, createdAt } = {
    emailVerified: true,
    provider: "credentials",
    role: "user",
    createdAt: 12342342422342,
  };
  
  return (
    <div className="w-full max-w-md">
      <FieldSet>
        <FieldGroup>
          {/* Email (editable) */}
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input id="email" type="email" placeholder="you@example.com" />
            <FieldDescription>
              Changing your email requires verification.
            </FieldDescription>
          </Field>

          {/* Email verified (display only) */}
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

          {/* Provider (read-only) */}
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
            <Input value={role} readOnly disabled />
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

export default EditAccountForm;
