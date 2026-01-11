import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import { Toaster } from "./components/ui/sonner";
import Profile from "./pages/Profile";

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
      element: <NotFound />,
      path: "*",
    },
  ]);
  return (
    <>
      <RouterProvider router={router} />
      <Toaster/>
    </>
  );
};

export default App;
