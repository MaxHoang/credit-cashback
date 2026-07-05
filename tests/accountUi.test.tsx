import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyCards } from "../src/components/MyCards";
import { DEFAULT_PROFILE } from "../src/lib/pb";

describe("MyCards", () => {
  it("lists all 7 cards as ownership toggles", () => {
    render(<MyCards profile={DEFAULT_PROFILE} onChange={() => {}} />);
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
    expect(screen.getByText("Cake Freedom")).toBeInTheDocument();
  });
  it("toggling a card ownership calls onChange with the card added", () => {
    const onChange = vi.fn();
    render(<MyCards profile={DEFAULT_PROFILE} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Cake Freedom/i));
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls.at(-1)![0];
    expect(arg.owned_cards).toContain("cake-freedom");
  });
});
