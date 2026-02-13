import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import { store } from "./redux/store.ts";

// src/main.tsx
// App entry point: mount React and wires global providers

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Redux: global app state */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
