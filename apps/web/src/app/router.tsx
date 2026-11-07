/* eslint-disable react-refresh/only-export-components */

import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import HomePage from "../pages/HomePage";
import BooksPage from "../pages/BooksPage";
import BookDetailsPage from "../pages/BookDetailsPage";
import CartPage from "../pages/CartPage";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import MyLibraryPage from "../pages/MyLibraryPage";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import RouteErrorPage from "../pages/RouterErrorPage";

// Load PDF.js and the reader page only when the reader route is visited.
const BookReaderPage = lazy(() => import("../pages/BookReaderPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <RouteErrorPage/>,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "books",
        element: <BooksPage />,
      },
      {
        path: "books/:bookId",
        element: <BookDetailsPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "cart",
            element: <CartPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "library",
            element: <MyLibraryPage />,
          },
          {
            path: "library/:bookId/read",
            element: (
              <Suspense
                fallback={
                  <div className="reader-loading">
                    <p>Loading reader...</p>
                  </div>
                }
              >
                <BookReaderPage />
              </Suspense>
            ),
          },
          {
            path: "orders/:orderId",
            element: <OrderConfirmationPage />,
          },
        ],
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },
]);
