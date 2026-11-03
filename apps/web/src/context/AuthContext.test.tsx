import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
} from "../api/authApi";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

vi.mock("../api/authApi", () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

const mockFetchCurrentUser = vi.mocked(fetchCurrentUser);
const mockLoginRequest = vi.mocked(loginRequest);
const mockLogoutRequest = vi.mocked(logoutRequest);
const mockRegisterRequest = vi.mocked(registerRequest);

const testUser: AuthUser = {
  id: "user-123",
  name: "Jane Reader",
  email: "jane@example.com",
  role: "CUSTOMER",
  avatar: null,
  createdAt: "2026-10-29T00:00:00.000Z",
  updatedAt: "2026-10-29T00:00:00.000Z",
};

function TestConsumer() {
  const { user, isLoading, login, register, logout } = useAuth();

  return (
    <div>
      <p data-testid="loading">{String(isLoading)}</p>
      <p data-testid="user">{user ? user.name : "No user"}</p>
      <p data-testid="email">{user ? user.email : "No email"}</p>

      <button
        onClick={() =>
          void login({
            email: "jane@example.com",
            password: "SecurePassword123!",
          })
        }
      >
        Test login
      </button>

      <button
        onClick={() =>
          void register({
            name: "Jane Reader",
            email: "jane@example.com",
            password: "SecurePassword123!",
          })
        }
      >
        Test register
      </button>

      <button onClick={() => void logout().catch(() => {})}>Test logout</button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  mockFetchCurrentUser.mockResolvedValue(testUser);
  mockLoginRequest.mockResolvedValue({
    message: "Login successful",
    user: testUser,
  });
  mockRegisterRequest.mockResolvedValue({
    message: "Registration successful",
    user: testUser,
  });
  mockLogoutRequest.mockResolvedValue({ message: "Logout successful" });
});

afterEach(() => {
  cleanup();
});

describe("AuthContext", () => {
  it("restores an existing session when the provider mounts", async () => {
    renderAuthProvider();

    expect(mockFetchCurrentUser).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Jane Reader");
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("sets the user to null when session restoration fails", async () => {
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("No user");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
  });

  it("updates the current user after a successful login", async () => {
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Test login" }).click();
    });

    expect(mockLoginRequest).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "SecurePassword123!",
    });

    expect(screen.getByTestId("user")).toHaveTextContent("Jane Reader");
    expect(screen.getByTestId("email")).toHaveTextContent("jane@example.com");
  });

  it("registers a user without automatically logging them in", async () => {
    mockFetchCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Test register" }).click();
    });

    expect(mockRegisterRequest).toHaveBeenCalledWith({
      name: "Jane Reader",
      email: "jane@example.com",
      password: "SecurePassword123!",
    });

    expect(screen.getByTestId("user")).toHaveTextContent("No user");
    expect(mockLoginRequest).not.toHaveBeenCalled();
  });

  it("clears the current user after a successful logout", async () => {
    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Jane Reader");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Test logout" }).click();
    });

    expect(mockLogoutRequest).toHaveBeenCalledOnce();
    expect(screen.getByTestId("user")).toHaveTextContent("No user");
  });

  it("preserves the current user when logout fails", async () => {
    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Jane Reader");
    });

    mockLogoutRequest.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      screen.getByRole("button", { name: "Test logout" }).click();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("Jane Reader");
  });
});
