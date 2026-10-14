import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import HomePage from "../pages/HomePage";
import BooksPage from "../pages/BooksPage";
import BookDetailsPage from "../pages/BookDetailsPage";
import CartPage from "../pages/CartPage";

export const router = createBrowserRouter([
    {
        path:"/",
        element: <MainLayout/>,
        children : [
            {
                path:"/",
                element: <HomePage/>
            },
            {
                path: "books",
                element: <BooksPage/>
            },
            {
                path: "books/:bookId",
                element: <BookDetailsPage/>
            },
            {
                path: "cart",
                element: <CartPage/>
            }
        ]
    }
])

