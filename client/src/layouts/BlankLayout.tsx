import React from "react";
import { Outlet } from "react-router-dom";

// layouts/BlankLayout.tsx
// For auth pages, onboarding, full-screen pages
// Used for login, signup, etc.
// No header, No footer

const BlankLayout = () => {
  return <Outlet />;
};

export default BlankLayout;
