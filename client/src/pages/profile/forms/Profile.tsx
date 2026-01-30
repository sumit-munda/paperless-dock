import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChangeEvent } from "react";
import { BsCameraFill } from "react-icons/bs";

// profile/forms/Profile.tsx
// Profile information (mostly edit-only)

const ProfileForm = () => {
  // WIP
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Selected profile image", file);
  };

  return (
    <div className="w-full max-w-4xl p-8">
      <form className="space-y-6">
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>

          <FieldSeparator />

          <FieldGroup>
            {/* Profile photo */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Photo</FieldLabel>
                <FieldDescription>Upload a profile picture.</FieldDescription>
              </FieldContent>

              <div className="flex items-center gap-4">
                <Avatar
                  className=" h-14 w-14
    ring-2 ring-background
    grayscale"
                >
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="Profile avatar"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>

                <label>
                  <Button variant="outstyled" size={"sm"} asChild>
                    <span>
                      <BsCameraFill />
                      Change photo
                    </span>
                  </Button>

                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </Field>

            <FieldSeparator />

            {/* Name */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>Your full name.</FieldDescription>
              </FieldContent>

              <Input
                id="name"
                placeholder="Evil Rabbit"
                autoComplete="name"
                required
              />
            </Field>

            {/* Username */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <FieldDescription>
                  This will be visible to other users.
                </FieldDescription>
              </FieldContent>

              <Input
                id="username"
                placeholder="Evil Rabbit"
                autoComplete="username"
                required
              />
            </Field>

            <FieldSeparator />

            {/* Bio */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="bio">Bio</FieldLabel>
                <FieldDescription>
                  Brief description (max ~100 characters).
                </FieldDescription>
              </FieldContent>

              <Textarea
                id="bio"
                placeholder="Hello, world!"
                className="min-h-[100px] resize-none sm:min-w-[300px]"
              />
            </Field>

            <FieldSeparator />

            {/* Location */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="location">Location</FieldLabel>
                <FieldDescription>City or country (optional).</FieldDescription>
              </FieldContent>

              <Input id="location" placeholder="Bangalore, India" />
            </Field>

            {/* Actions */}
            <Field orientation="responsive">
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
};

export default ProfileForm;
