// layouts/AppLayout.tsx
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Outlet } from "react-router-dom";

// layouts/AppLayout.tsx
// Default app layout (includes Header and Footer)
// Used by most authenticated & public pages

const AppLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
