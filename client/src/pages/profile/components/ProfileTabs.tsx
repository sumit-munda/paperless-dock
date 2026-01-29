import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ProfileTabs
// Default "tabs" section  of Profile page

const ProfileTabs = () => {
  return (
    <Tabs defaultValue="library" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        <TabsTrigger value="statistics">Statistics</TabsTrigger>
        <TabsTrigger value="billings">Billings</TabsTrigger>
      </TabsList>

      {["library", "bookmarks", "statistics", "billings"].map((tab) => (
        <TabsContent key={tab} value={tab}>
          <ExampleCard />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ProfileTabs;

// Subcomponents

// ExampleCard
const ExampleCard = () => {
  return (
    <Card className="grid gap-2 lg:grid-cols-[.75fr_1fr]">
      <CardContent className="grid grid-cols-[1fr_2fr] gap-3">
        <div>
          <div className=" text-lg font-medium ">shadcn/ui</div>
          <p className="text-sm text-muted-foreground leading-tight">
            Beautifully designed components built with Tailwind CSS.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <CardTitle>Introduction</CardTitle>
          <CardDescription>
            Re-usable components built using Radix UI and Tailwind CSS.
          </CardDescription>
          <CardAction>
            <Button variant="link">Read</Button>
          </CardAction>
        </div>
      </CardContent>
    </Card>
  );
};
