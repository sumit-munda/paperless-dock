import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SubscriptionStatus = "active" | "canceled" | "trialing" | "inactive";

// profile/form/Subscription.tsx
// Subscription details

const SubscriptionForm = () => {
  const subscription: {
    status: SubscriptionStatus;
    stripeCustomerId?: string;
  } = {
    status: "active",
    stripeCustomerId: "12324345325",
  };

  const statusLabel: Record<SubscriptionStatus, string> = {
    active: "Active",
    canceled: "Canceled",
    trialing: "Trial",
    inactive: "Inactive",
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <FieldSet>
        <FieldGroup>
          {/* Subscription status (read-only) */}
          <Field>
            <FieldLabel>Subscription status</FieldLabel>
            <Input value={statusLabel[subscription.status]} readOnly disabled />
            <FieldDescription>
              Current billing status of your account.
            </FieldDescription>
          </Field>

          {/* Stripe Customer ID (read-only, hidden-ish) */}
          <Field>
            <FieldLabel>Stripe customer ID</FieldLabel>
            <Input
              value={subscription.stripeCustomerId ?? "—"}
              readOnly
              disabled
            />
            <FieldDescription>
              Used internally for billing support.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button className="w-full">Upgrade plan</Button>

        {subscription.status === "active" && (
          <Button variant="outline" className="w-full">
            Cancel subscription
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionForm;
