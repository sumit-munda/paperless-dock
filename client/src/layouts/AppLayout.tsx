// layouts/AppLayout.tsx
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Outlet } from "react-router-dom";

// layouts/AppLayout.tsx
// Default app layout (includes Header and Footer)
// Used by most authenticated & public pages

// const AppLayout = ({ children }: { children: React.ReactNode }) => {
//   return (
//     <SidebarProvider>
//       <AppSidebar />
//       <main>
//         <SidebarTrigger />
//         {children}
//       </main>
//     </SidebarProvider>
//   );
// };

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
