import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import EditProfilePage from "./pages/profile/EditProfile/EditProfilePage";
import Profile from "./pages/profile/Profile";
import Register from "./pages/Register";
import { useGetSessionQuery } from "./redux/api/authApi";
import { clearUser, setUser } from "./redux/slices/authSlice";
import { useAppSelector } from "./redux/hooks";
import type { RootState } from "./redux/store";

const App = () => {
  const { shouldFetch } = useAppSelector((state: RootState) => state.session);

  const { data } = useGetSessionQuery(undefined, { skip: !shouldFetch });
  const dispatch = useDispatch();

  useEffect(() => {
    if (data?.data) {
      dispatch(setUser(data.data));
    } else {
      dispatch(clearUser());
    }
  }, [data]);

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
