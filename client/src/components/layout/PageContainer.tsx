import { type ReactNode } from "react";

const PageContainer = ({ children }: { children: ReactNode }) => {
  return (
    <section className="w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ">
        {children}
      </div>
    </section>
  );
};

export default PageContainer;
