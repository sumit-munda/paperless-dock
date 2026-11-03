import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <section aria-live="polite" aria-busy="true">
        <p>Checking your session...</p>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }}></Navigate>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
