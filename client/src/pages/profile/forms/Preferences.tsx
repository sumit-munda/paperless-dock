import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { UserProfile } from "@/types/user";
import { useState } from "react";

type Language = "en" | "hi" ;

interface PreferencesFormProps {
  data?: UserProfile;
}

// profile/forms/Preferences.tsx
// Preferences details

const PreferencesForm = ({ data }: PreferencesFormProps) => {
  const [language, setLanguage] = useState<Language>("en");

  const {theme} = data?.settings!;

  const capitalize = (value: string) => {
    return value ? value[0].toUpperCase() + value.slice(1) : "";
  };

  return (
    <div className="w-full max-w-4xl p-8">
      <form>
        <FieldSet>
          <FieldLegend>Preferences</FieldLegend>
          <FieldDescription>Fill in your preferences.</FieldDescription>

          <FieldSeparator />

          <FieldGroup>
            {/* Theme */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Theme</FieldLabel>
                <FieldDescription>
                  Toggle between light and dark mode.
                </FieldDescription>
              </FieldContent>

              <div className="flex items-center space-x-2">
                <Switch id="theme-toggle" />
                <Label htmlFor="airplane-mode">{`${capitalize(theme)} Mode`}</Label>
              </div>
            </Field>

            <FieldSeparator />

            {/* Language */}
            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Language</FieldLabel>
                <FieldDescription>Select your language</FieldDescription>
              </FieldContent>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{language.toUpperCase()}</Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Language</DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuRadioGroup
                    value={language}
                    onValueChange={(value) => setLanguage(value as Language)}
                  >
                    <DropdownMenuRadioItem value="en">
                      English
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="hi">
                      Hindi
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fr">
                      French
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
};

export default PreferencesForm;
