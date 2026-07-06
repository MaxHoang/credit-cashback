import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Simulate a logged-in user so the "Thẻ của tôi" settings panel is reachable.
const { saveProfile } = vi.hoisted(() => ({ saveProfile: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../src/lib/pb", async (orig) => {
  const actual = await (orig() as Promise<Record<string, unknown>>);
  return {
    ...actual,
    isLoggedIn: () => true,
    currentUser: () => ({ email: "quan@example.com" }),
    loadProfile: () => ({ owned_cards: [], picks: {} }),
    saveProfile,
    searchMerchants: vi.fn().mockResolvedValue([]),
  };
});

import App from "../src/App";

describe("Settings pick flow", () => {
  beforeEach(() => saveProfile.mockClear());

  it("keeps the settings panel open after toggling a card so categories can be picked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Thẻ của tôi/i }));
    expect(screen.getByRole("heading", { name: /Thẻ của tôi/i })).toBeInTheDocument();

    // Own Cake Freedom → panel must stay open AND reveal its flexible pick group.
    fireEvent.click(screen.getByLabelText(/Cake Freedom/i));
    expect(screen.getByRole("heading", { name: /Thẻ của tôi/i })).toBeInTheDocument();
    expect(screen.getByText(/Nhóm linh hoạt/i)).toBeInTheDocument();

    // The choice is persisted to the account.
    expect(saveProfile).toHaveBeenCalled();
    expect(saveProfile.mock.calls.at(-1)![0].owned_cards).toContain("cake-freedom");
  });
});
