import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../context/useAuth";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "./LoginPage";

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockLogin = vi.fn();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.resetAllMocks();

  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    login: mockLogin,
    register: vi.fn(),
    updateProfile: vi.fn(),
    logout: vi.fn(),
  });
});

function LocationDisplay() {
  const location = useLocation();

  return <p data-testid="current-location">{location.pathname}</p>;
}

function renderLoginPage(
  initialEntry:
    | string
    | {
        pathname: string;
        state?: { from: { pathname: string } };
      } = "/login",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/books" element={<LocationDisplay />} />
        <Route path="/cart" element={<LocationDisplay />} />
        <Route path="/register" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('"LoginPage', () => {
  it("renders the login form", () => {
    renderLoginPage();

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Create an account" }),
    ).toHaveAttribute("href", "/register");
  });

  it("logs in successfully and navigates to the books page by default", async () => {
    mockLogin.mockResolvedValue({
      id: "user-001",
      name: "Test User",
      email: "test@example.com",
      role: "CUSTOMER",
      avatar: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "  test@example.com  " },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "correct-password-123",
      });
    });

    expect(await screen.findByTestId("current-location")).toHaveTextContent(
      "/books",
    );
  });

  it("returns to the originally requested page after login", async () => {
    mockLogin.mockResolvedValue({
      id: "user-001",
      name: "Test User",
      email: "test@example.com",
      role: "CUSTOMER",
      avatar: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    renderLoginPage({
      pathname: "/login",
      state: {
        from: {
          pathname: "/cart",
        },
      },
    });

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-password-123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByTestId("current-location")).toHaveTextContent(
      "/cart",
    );
  });

  it("displays an error when credentials are invalid", async () => {
    mockLogin.mockRejectedValue(new Error("API request failed: HTTP 401"));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "invalid@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "incorrect-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );

    expect(screen.getByRole("button", { name: /log in/i })).toBeEnabled();
  });
});
