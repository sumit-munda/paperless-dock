import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import HomePage from "../pages/HomePage";
import BooksPage from "../pages/BooksPage";
import BookDetailsPage from "../pages/BookDetailsPage";
import CartPage from "../pages/CartPage";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import ProfilePage from "../pages/ProfilePage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import MyLibraryPage from "../pages/MyLibraryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
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
