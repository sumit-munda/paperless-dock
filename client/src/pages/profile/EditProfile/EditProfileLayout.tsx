import MobileNav from "@/components/navigation/MobileNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type ReactNode } from "react";
import { EditProfileSidebar } from "./EditProfileSidebar";

const EditProfileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {/* Mobile */}
      <header className="md:hidden mb-4">
        <MobileNav />
        {/* <EditProfileSheet  /> */}
      </header>

      {/* Desktop */}
      <div className="flex">
        <aside className="hidden md:block w-64">
          <SidebarProvider>
            <div className="flex min-h-[calc(100vh-3.5rem)]">
              <aside className="w-64 border">
                <EditProfileSidebar />
              </aside>

              <main className="flex-1 p-6">
                <SidebarTrigger />
                {children}
              </main>
            </div>
          </SidebarProvider>
        </aside>
      </div>

      {/* Main */}
      <main className="flex-1">{children}</main>
    </>
  );
};

export default EditProfileLayout;
