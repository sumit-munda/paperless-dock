import Footer from "@/components/header/Footer";
import Header from "@/components/header/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  return (
    <div>
      <Header />
      <div className="min-h-screen px-8 py-4">
        <div className="flex gap-2 p-2">
          <Avatar
            className=" h-15 w-15
    ring-2 ring-background
    grayscale"
          >
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-end">
            <p className="font-bold">Shad CN</p>
            <p className="text-[.8rem]">@shadcn</p>
          </div>
        </div>

        {/* <div>
          <div className="flex gap-2">
            <Button variant={"outstyled"} size={"sm"}>Edit Profile</Button>
            <div className="flex flex-col gap-2">
              <Tabs defaultValue="account">
                <TabsList>
                  <TabsTrigger value="library">Library</TabsTrigger>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                  <TabsTrigger value="bookmarks">Billings</TabsTrigger>
                </TabsList>
                <TabsContent value="library">
                  <p>Library</p>
                </TabsContent>
                <TabsContent value="bookmarks">
                  <p>Bookmarks</p>
                </TabsContent>
                <TabsContent value="billings">
                  <p>Billings</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div> */}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
