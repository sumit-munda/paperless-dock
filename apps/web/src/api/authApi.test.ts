import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, clearCsrfToken } from "./apiRequest";
import {
  fetchCurrentUser,
  login,
  logout,
  register,
  type AuthUser,
} from "./authApi";

vi.mock("./apiRequest", () => ({
  apiRequest: vi.fn(),
  clearCsrfToken: vi.fn(),
}));

const mockApiRequest = vi.mocked(apiRequest);
const mockClearCsrfToken = vi.mocked(clearCsrfToken);

const testUser: AuthUser = {
  id: "user-123",
  name: "Jane Reader",
  email: "jane@example.com",
  role: "CUSTOMER",
  avatar: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("authApi", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a user using the correct endpoint and request body", async () => {
    mockApiRequest.mockResolvedValue({
      message: "Account created successfully",
      user: testUser,
    });

    const input = {
      name: "Jane Reader",
      email: "jane@example.com",
      password: "SecurePassword123!",
    };

    const result = await register(input);

    expect(mockApiRequest).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );

    expect(result.user).toEqual(testUser);
  });

  it("logs in using the correct endpoint and request body", async () => {
    mockApiRequest.mockResolvedValue({
      message: "Login successful",
      user: testUser,
    });

    const input = {
      email: "jane@example.com",
      password: "SecurePassword123!",
    };

    const result = await login(input);

    expect(mockApiRequest).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );

    expect(result.user).toEqual(testUser);

    expect(mockClearCsrfToken).toHaveBeenCalledOnce();
  });

  it("logs out using a POST request", async () => {
    mockApiRequest.mockResolvedValue({
      message: "Logged out successfully",
    });

    const result = await logout();

    expect(mockApiRequest).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`,
      {
        method: "POST",
      },
    );

    expect(result).toEqual({
      message: "Logged out successfully",
    });
  });

  it("fetches the current user and returns the user object", async () => {
    mockApiRequest.mockResolvedValue({
      user: testUser,
    });

    const result = await fetchCurrentUser();

    expect(mockApiRequest).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
    );

    expect(result).toEqual(testUser);
  });

  it("propagates registration API errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("API request failed: HTTP 409"));

    await expect(
      register({
        name: "Jane Reader",
        email: "jane@example.com",
        password: "SecurePassword123!",
      }),
    ).rejects.toThrow("API request failed: HTTP 409");
  });

  it("propagates login API errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("API request failed: HTTP 401"));

    await expect(
      login({
        email: "jane@example.com",
        password: "SecurePassword123!",
      }),
    ).rejects.toThrow("API request failed: HTTP 401");
  });

  it("propagates current-user API errors", async () => {
    mockApiRequest.mockRejectedValue(new Error("API request failed: HTTP 401"));

    await expect(fetchCurrentUser()).rejects.toThrow(
      "API request failed: HTTP 401",
    );
  });
});
