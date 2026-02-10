import ExampleCard from "@/components/common/ExampleCard";
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
