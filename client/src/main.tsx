import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./context/auth.context.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.ts";

// src/main.tsx
// App entry point: mount React and wires global providers

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Redux: global app state */}
    <Provider store={store}> 
      {/* Auth context: Firebase auth state */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>,
);
