import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";

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
      element: <NotFound />,
      path: "*",
    },
  ]);
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
