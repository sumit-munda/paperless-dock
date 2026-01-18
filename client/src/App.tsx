import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import { Toaster } from "./components/ui/sonner";
import Profile from "./pages/profile/Profile";
import EditProfile from "./pages/profile/EditProfile/EditProfileLayout";
import { AppLayout } from "./layouts/AppLayout";
import EditProfilePage from "./pages/profile/EditProfile/EditProfilePage";

const App = () => {
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
