import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "../styles/index.css";
import { CartProvider } from "../context/CartContext";

const App = () => {
  return (
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
};

export default App;
