import { useAppSelector } from "@/redux/hooks";
import { Navigate, Outlet } from "react-router-dom";

// layouts/ProtectedRoute.tsx
// Protects routes that require authentication

const ProtectedRoute = () => {
  const user = useAppSelector((state) => state.auth.user);

  // const user = {}

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
