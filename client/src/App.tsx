import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import EditProfilePage from "./pages/profile/EditProfile/EditProfilePage";
import Profile from "./pages/profile/Profile";
import Register from "./pages/Register";
import { useGetSessionQuery } from "./redux/api/authApi";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { clearUser, setUser } from "./redux/slices/authSlice";
import type { RootState } from "./redux/store";

// src/App.tsx
// Root application compnent: routing + session sync

const App = () => {
  // Controls whether session API should run
  const { shouldFetch } = useAppSelector((state: RootState) => state.session);

  const { data } = useGetSessionQuery(undefined, { skip: !shouldFetch });
  const dispatch = useAppDispatch();

  // Sync session API response with Redux auth state
  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
    } else {
      dispatch(clearUser());
    }
  }, [data, dispatch]);

  const router = createBrowserRouter([
    {
      element: <Home />,
      path: "/",
    },
    {
      element: <Login />,
      path: "/login",
    },
    {
      element: <Register />,
      path: "/register",
    },
    {
      element: <Profile />,
      path: "/profile",
    },
    {
      element: <EditProfilePage />,
      path: "/profile/edit",
    },
    {
      element: <NotFound />,
      path: "*",
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
};

export default App;
