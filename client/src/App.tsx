import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import { Toaster } from "./components/ui/sonner";
import { useGetSessionQuery } from "./redux/api/authApi";
import { clearUser, setUser } from "./redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import type { RootState } from "./redux/store";
import { useEffect } from "react";

// src/App.tsx
// Root application compnent: routing + session sync

const App = () => {
  // Controls whether session API should run
  const { shouldFetch } = useAppSelector((state: RootState) => state.auth);

  const { data } = useGetSessionQuery(undefined, { skip: !shouldFetch });
  const dispatch = useAppDispatch();

  // Sync session API response with Redux auth state
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
