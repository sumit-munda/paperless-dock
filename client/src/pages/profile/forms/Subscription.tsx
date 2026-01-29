import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const EditSubscriptionForm = () => {
    const subscription = {
        status: "isActive",
        stripeCustomerId: "12324345325"
    }
  return (
   <div className="w-full max-w-md space-y-6">
  <FieldSet>
    <FieldGroup>

      {/* Subscription status (read-only) */}
      <Field>
        <FieldLabel>Subscription status</FieldLabel>
        <Input
          value={subscription.status}
          readOnly
          disabled
        />
        <FieldDescription>
          Current billing status of your account.
        </FieldDescription>
      </Field>

      {/* Stripe Customer ID (read-only, hidden-ish) */}
      <Field>
        <FieldLabel>Stripe customer ID</FieldLabel>
        <Input
          value={subscription.stripeCustomerId || "—"}
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
    <Button className="w-full">
      Upgrade plan
    </Button>

    {subscription.status === "active" && (
      <Button variant="outline" className="w-full">
        Cancel subscription
      </Button>
    )}
  </div>
</div>

  )
}

export default EditSubscriptionForm
