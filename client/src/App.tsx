import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import AppLayout from "./layouts/AppLayout";
import BlankLayout from "./layouts/BlankLayout";
import ProtectedRoute from "./layouts/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/profile";
import EditProfilePage from "./pages/profile/edit";
import Register from "./pages/Register";
import { useGetSessionQuery } from "./redux/api/authApi";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { clearUser, setUser } from "./redux/slices/authSlice";
import { disableFetch } from "./redux/slices/sessionSlice";
import Books from "./pages/books/index";
import Read from "./pages/Read";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Help from "./pages/Help";

// src/App.tsx
// Root application compnent: routing + session sync

const App = () => {
  // Controls whether session API should run
  const { shouldFetch } = useAppSelector((state) => state.session);

  const { data, error, isLoading, isUninitialized } = useGetSessionQuery(
    undefined,
    { skip: !shouldFetch },
  );
  const dispatch = useAppDispatch();

  // Sync session API response with Redux auth state
  useEffect(() => {
    // Still loading or query not started -> do nothing
    if (isLoading || isUninitialized) return;

    // Successful session
    if (data?.data) {
      dispatch(setUser(data.data));
      return;
    }

    // Session explicitly failed (401)
    if (error && "status" in error && error.status === 401) {
      dispatch(clearUser());
      dispatch(disableFetch()); // prevent retry loop
    }
  }, [data, error, isLoading, isUninitialized, dispatch]);

  const router = createBrowserRouter([
    // Public pages with header/footer
    {
      element: <AppLayout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },
        {
          path: "/books",
          element: <Books />,
        },
        {
          path: "/read",
          element: <Read />,
        },
        {
          path: "/about",
          element: <About />,
        },
        {
          path: "/help",
          element: <Help />,
        },
        {
          path: "/contact",
          element: <Contact />,
        },
      ],
    },

    // Auth pages (no header/footer)
    {
      element: <BlankLayout />,
      children: [
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/register",
          element: <Register />,
        },
      ],
    },

    // Protected pages
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              path: "/profile",
              element: <Profile />,
            },
            {
              path: "/profile/edit",
              element: <EditProfilePage />,
            },
            {
              path: "/cart",
              element: <Cart />,
            },
          ],
        },
      ],
    },

    {
      path: "*",
      element: <NotFound />,
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
