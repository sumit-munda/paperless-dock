import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import "../styles/index.css";
import { router } from "./router";
import { useCallback, useEffect, useState } from "react";
import { checkApiHealth } from "../api/healthApi";

const RETRY_INTERVAL = 3000;
const MAX_WAIT_TIME = 120000;

const App = () => {
  const [isApiReady, setIsApiReady] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setHasTimedOut(false);
    setRetryKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let intervalId: number | undefined;

    async function checkServer() {
      const isHealthy = await checkApiHealth();

      if (cancelled) return;

      if (isHealthy) {
        setIsApiReady(true);

        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
        }

        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }

        return;
      }

      if (intervalId === undefined) {
        intervalId = window.setInterval(() => {
          void checkServer();
        }, RETRY_INTERVAL);
      }
    }

    setIsApiReady(false);

    void checkServer();

    timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setHasTimedOut(true);

        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      }
    }, MAX_WAIT_TIME);

    return () => {
      cancelled = true;

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [retryKey]);

  if (!isApiReady) {
    return (
      <main className="api-startup">
        <div className="api-startup-content">
          {!hasTimedOut && <div className="api-startup-spinner"></div>}

          <h1>
            {hasTimedOut
              ? "Server is taking longer than expected"
              : "Starting demo server..."}
          </h1>

          <p>
            {hasTimedOut
              ? "The demo server hasn't responded yet. Please try again."
              : "The server may be sleeping after a period of inactivity. Please wait while it starts."}
          </p>

          {hasTimedOut && (
            <button type="button" onClick={retry}>
              Try again
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
