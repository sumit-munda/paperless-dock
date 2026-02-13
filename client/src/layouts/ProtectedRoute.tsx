import { useAppSelector } from "@/redux/hooks";
import { Navigate, Outlet } from "react-router-dom";

// layouts/ProtectedRoute.tsx
// Protects routes that require authentication

const ProtectedRoute = () => {
  const { user, initialized } = useAppSelector((state) => state.auth);

  // ⏳ wait for session check
  if (!initialized) {
    return null; // or spinner
  }

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
