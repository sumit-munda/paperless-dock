import Footer from "@/components/header/Footer";
import Header from "@/components/header/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditProfileSheet from "./EditProfile/EditProfileSheet";
import { useState } from "react";
import EditProfileForm from "./EditProfile/EditProfileForm";
import EditPreferencesForm from "./EditProfile/EditPreferencesForm";
import EditSecurityForm from "./EditProfile/EditSecurityForm";
import EditAccountForm from "./EditProfile/EditAccountForm";
import EditSettings from "./EditProfile/EditSettings";
import EditSubscriptionForm from "./EditProfile/EditSubscriptionForm";
import { useGetProfileQuery } from "@/redux/api/profileApi";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
];

export type Section =
  | "tabs"
  | "profile"
  | "account"
  | "security"
  | "subscription"
  | "preferences"
  | "settings";

const Profile = () => {
  const [section, setSection] = useState<Section>("tabs");

  const { data, isLoading, error } = useGetProfileQuery();
  console.log(data);

  return (
    <div>
      <Header />
      <div className="min-h-screen px-8 py-4">
        <div className="flex justify-between items-end gap-2 p-2">
          <div className="flex gap-2">
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
          <EditProfileSheet onSelect={setSection} />
        </div>

        <div>
          <div className="flex justify-center gap-2 p-2">
            {section === "tabs" && (
              <div className="flex flex-col gap-2 w-full">
                <Tabs defaultValue="account">
                  <TabsList className="w-full">
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="billings">Billings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="library">
                    <div>
                      <Card className="grid gap-2 md:w-full lg:w-full lg:grid-cols-[.75fr_1fr]">
                        <CardContent className="grid grid-cols-[1fr_2fr] gap-2">
                          <div className="from-muted/50 to-muted">
                            <div className=" text-lg font-medium ">
                              shadcn/ui
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              Beautifully designed components built with
                              Tailwind CSS.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <CardTitle>Introduction</CardTitle>
                            <CardDescription>
                              Re-usable components built using Radix UI and
                              Tailwind CSS.
                            </CardDescription>
                            <CardAction>
                              <Button variant="link">Read</Button>
                            </CardAction>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="bookmarks">
                    <div>
                      <Card className="grid gap-2 md:w-full lg:w-full lg:grid-cols-[.75fr_1fr]">
                        <CardContent className="grid grid-cols-[1fr_2fr] gap-2">
                          <div className="from-muted/50 to-muted">
                            <div className=" text-lg font-medium ">
                              shadcn/ui
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              Beautifully designed components built with
                              Tailwind CSS.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <CardTitle>Introduction</CardTitle>
                            <CardDescription>
                              Re-usable components built using Radix UI and
                              Tailwind CSS.
                            </CardDescription>
                            <CardAction>
                              <Button variant="link">Read</Button>
                            </CardAction>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="statistics">
                    <div>
                      <Card className="grid gap-2 md:w-full lg:w-full lg:grid-cols-[.75fr_1fr]">
                        <CardContent className="grid grid-cols-[1fr_2fr] gap-2">
                          <div className="from-muted/50 to-muted">
                            <div className=" text-lg font-medium ">
                              shadcn/ui
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              Beautifully designed components built with
                              Tailwind CSS.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <CardTitle>Introduction</CardTitle>
                            <CardDescription>
                              Re-usable components built using Radix UI and
                              Tailwind CSS.
                            </CardDescription>
                            <CardAction>
                              <Button variant="link">Read</Button>
                            </CardAction>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="billings">
                    <div>
                      <Card className="grid gap-2 md:w-full lg:w-full lg:grid-cols-[.75fr_1fr]">
                        <CardContent className="grid grid-cols-[1fr_2fr] gap-2">
                          <div className="from-muted/50 to-muted">
                            <div className=" text-lg font-medium ">
                              shadcn/ui
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              Beautifully designed components built with
                              Tailwind CSS.
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <CardTitle>Introduction</CardTitle>
                            <CardDescription>
                              Re-usable components built using Radix UI and
                              Tailwind CSS.
                            </CardDescription>
                            <CardAction>
                              <Button variant="link">Read</Button>
                            </CardAction>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {section === "profile" && <EditProfileForm />}
            {section === "account" && <EditAccountForm />}
            {section === "security" && <EditSecurityForm />}
            {section === "subscription" && <EditSubscriptionForm />}
            {section === "preferences" && <EditPreferencesForm />}
            {section === "settings" && <EditSettings />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
