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
import { BsCameraFill } from "react-icons/bs";

const EditProfileForm = () => {
  const handleUpload = () => {};

  return (
    <div className="w-full max-w-4xl p-8">
      <form>
        <FieldSet>
          <FieldLegend>Profile</FieldLegend>
          <FieldDescription>Fill in your profile information.</FieldDescription>
          <FieldSeparator />
          <FieldGroup>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Photo</FieldLabel>
                <FieldDescription>You can upload a new photo</FieldDescription>
              </FieldContent>
              <div className="flex items-center gap-4">
                <Avatar
                  className=" h-15 w-15
    ring-2 ring-background
    grayscale"
                >
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
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
                    onChange={handleUpload}
                  />
                </label>
              </div>
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <FieldDescription>
                  Provide your full name for identification
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Evil Rabbit" required />
            </Field>
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Username</FieldLabel>
                <FieldDescription>
                  Provide your user name for identification
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Evil Rabbit" required />
            </Field>
            <FieldSeparator />
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="lastName">Bio</FieldLabel>
                <FieldDescription>
                  Brief description of your profile. Keep it short, preferably
                  under 100 characters.
                </FieldDescription>
              </FieldContent>
              <Textarea
                id="message"
                placeholder="Hello, world!"
                required
                className="min-h-[100px] resize-none sm:min-w-[300px]"
              />
            </Field>
            <FieldSeparator />
              <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="name">Location</FieldLabel>
                <FieldDescription>
                  Provide your location details
                </FieldDescription>
              </FieldContent>
              <Input id="name" placeholder="Evil Rabbit" required />
            </Field>
            <Field orientation="responsive">
              <Button type="submit">Submit</Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
};

export default EditProfileForm;
