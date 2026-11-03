import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../../context/useAuth";
import ProtectedRoute from "./ProtectedRoute";

vi.mock("../../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.resetAllMocks();

  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
  });
});

function LocationDisplay() {
  const location = useLocation();

  return <p data-testid="current-location">{location.pathname}</p>;
}

function renderProtectedRoute(initialEntry = "/cart") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LocationDisplay />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<h1>Your Shopping Cart</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("displays a loading state while restoring the session", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByText("Checking your session...")).toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: "Your Shopping Cart" }),
    ).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to the login page", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(screen.getByTestId("current-location")).toHaveTextContent("/login");

    expect(
      screen.queryByRole("heading", { name: "Your Shopping Cart" }),
    ).not.toBeInTheDocument();
  });

  it("renders the protected page for authenticated users", () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "user-001",
        name: "Test User",
        email: "test@example.com",
        role: "CUSTOMER",
        avatar: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      updateProfile: vi.fn(),
      logout: vi.fn(),
    });

    renderProtectedRoute();

    expect(
      screen.getByRole("heading", { name: "Your Shopping Cart" }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId("current-location")).not.toBeInTheDocument();
  });
});
