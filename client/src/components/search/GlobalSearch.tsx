import { Search } from "lucide-react";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type SearchGroup = {
  heading: string;
  items: string[];
};

const SEARCH_GROUPS: SearchGroup[] = [
  {
    heading: "Genres",
    items: ["Fiction", "Non-Fiction", "Fantasy", "Science Fiction", "Mystery"],
  },
  {
    heading: "Categories",
    items: ["Best Sellers", "New Releases", "Editor's Picks"],
  },
  {
    heading: "Resources",
    items: ["Reading Guides", "Author Interviews", "Community Reviews"],
  },
];

// Helper component

interface SearchGroupProps {
  group: SearchGroup;
}

const SearchResultGroup = ({ group }: SearchGroupProps) => {
  return (
    <CommandGroup heading={group.heading}>
      {group.items.map((item) => (
        <CommandItem key={item}>{item}</CommandItem>
      ))}
    </CommandGroup>
  );
};

export const GlobalSearch = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outstyled" className="flex items-center gap-2">
          <Search className="h-4 w-4" />

          <span className="hidden min-[376px]:inline min-[768px]:hidden">
            Search…
          </span>
          <span className="hidden min-[769px]:inline">
            Search books by genre or category…
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 overflow-hidden [&>button]:hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search across your documents and actions
          </DialogDescription>
        </DialogHeader>

        <Command className="flex h-full flex-col">
          {/* Search Input */}
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted px-3">
              <CommandInput placeholder="Search..." className="h-9 text-sm" />
            </div>
          </div>

          {/* Results */}
          <CommandList className="h-[85vh] overflow-y-auto p-2 pt-0">
            <CommandEmpty>No results found.</CommandEmpty>

          {SEARCH_GROUPS.map((group) => (
            <SearchResultGroup key={group.heading} group={group}/>
          ))}
          </CommandList>

          {/* Footer */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">
              Press <kbd className="rounded border px-1">Enter</kbd> to open
            </span>
            <span className="sm:hidden">Tap a result to open</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
