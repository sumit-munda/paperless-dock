import type { ReactNode } from "react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "../ui/combobox";
import { InputGroupAddon } from "../ui/input-group";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

export function ComboBox({
  items,
  placeholder,
  icon,
}: {
  items: string[];
  placeholder: string;
  icon: ReactNode;
}) {
  return (
    <Combobox items={items} multiple>
      <ComboboxInput placeholder={placeholder}>
        <InputGroupAddon>{icon}</InputGroupAddon>
      </ComboboxInput>
      <ComboboxContent alignOffset={-28} className="w-60">
        <ComboboxEmpty>No timezones found.</ComboboxEmpty>
        <ComboboxList>
          {(group) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
