import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";

describe("App v2", () => {
  it("shows a Google login control when logged out", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Đăng nhập với Google/i })).toBeInTheDocument();
  });
  it("amount input re-ranks a category by estimated cashback", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Bảo hiểm"));
    const amt = screen.getByPlaceholderText(/số tiền/i);
    fireEvent.change(amt, { target: { value: "10000000" } });
    // MB JCB Ultimate should now be first (400k > Cake 200k) — assert it renders before Cake
    const names = screen.getAllByText(/MB JCB Ultimate|Cake Freedom/).map((n) => n.textContent);
    expect(names.indexOf("MB JCB Ultimate")).toBeLessThan(names.indexOf("Cake Freedom"));
  });
});
