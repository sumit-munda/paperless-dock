import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import { useAuth } from "../context/useAuth";

vi.mock("../context/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockRegister = vi.fn();

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<h1>Login page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillRegistrationForm({
  name = "  Jane Reader  ",
  email = "  jane@example.com  ",
  password = "SecurePassword123!",
  confirmPassword = "SecurePassword123!",
} = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: name },
  });

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: email },
  });

  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: password },
  });

  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirmPassword },
  });
}

beforeEach(() => {
  vi.resetAllMocks();

  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: mockRegister,
    updateProfile: vi.fn(),
    logout: vi.fn(),
  });

  mockRegister.mockResolvedValue({
    id: "user-123",
    name: "Jane Reader",
    email: "jane@example.com",
  });
});

afterEach(() => {
  cleanup();
});

describe("RegisterPage", () => {
  it("renders the registration form", () => {
    renderRegisterPage();

    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("registers a user with trimmed name and email", async () => {
    renderRegisterPage();
    fillRegistrationForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Jane Reader",
        email: "jane@example.com",
        password: "SecurePassword123!",
      });
    });

    expect(
      await screen.findByRole("heading", {
        name: /account created successfully/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("rejects passwords shorter than 12 characters", async () => {
    renderRegisterPage();

    fillRegistrationForm({
      password: "Short123!",
      confirmPassword: "Short123!",
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password must contain at least 12 characters.",
    );

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    renderRegisterPage();

    fillRegistrationForm({
      password: "SecurePassword123!",
      confirmPassword: "DifferentPassword123!",
    });

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password do not match.",
    );

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("shows an error when the email address is already registered", async () => {
    mockRegister.mockRejectedValue(new Error("API request failed: HTTP 409"));

    renderRegisterPage();
    fillRegistrationForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email address already exists.",
    );

    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeEnabled();
  });

  it("shows an error when registration fails with HTTP 400", async () => {
    mockRegister.mockRejectedValue(new Error("API request failed: HTTP 400"));

    renderRegisterPage();
    fillRegistrationForm();

    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please check your details and try again.",
    );
  });
});
