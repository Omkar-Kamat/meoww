import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { LoginForm } from "../LoginForm";

// Mock out api
vi.mock("../../api/authApi", () => ({
  authApi: {
    login: vi.fn(),
  },
}));

// Mock out auth store
vi.mock("../../store/useAuthStore", () => ({
  useAuthStore: () => ({
    fetchMe: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  it("renders correctly", () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
  });
});
