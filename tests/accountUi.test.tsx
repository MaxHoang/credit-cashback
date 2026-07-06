import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyCards } from "../src/components/MyCards";
import { DEFAULT_PROFILE } from "../src/lib/pb";

describe("MyCards", () => {
  it("lists all 7 cards as ownership toggles", () => {
    render(<MyCards profile={DEFAULT_PROFILE} onChange={() => {}} onDone={() => {}} />);
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
    expect(screen.getByText("Cake Freedom")).toBeInTheDocument();
  });

  it("toggling ownership calls onChange (not onDone) with the card added", () => {
    const onChange = vi.fn();
    const onDone = vi.fn();
    render(<MyCards profile={DEFAULT_PROFILE} onChange={onChange} onDone={onDone} />);
    fireEvent.click(screen.getByLabelText(/Cake Freedom/i));
    expect(onChange).toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    expect(onChange.mock.calls.at(-1)![0].owned_cards).toContain("cake-freedom");
  });

  it("shows the flexible pick-groups for an owned pick-n card and records a pick", () => {
    const onChange = vi.fn();
    const profile = { owned_cards: ["cake-freedom"], picks: {} };
    render(<MyCards profile={profile} onChange={onChange} onDone={() => {}} />);
    expect(screen.getByText(/Nhóm linh hoạt/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ăn uống/i }));
    const picks = onChange.mock.calls.at(-1)![0].picks["cake-freedom"];
    expect(picks.flex).toContain("an-uong");
  });

  it("the Done button calls onDone", () => {
    const onDone = vi.fn();
    render(<MyCards profile={DEFAULT_PROFILE} onChange={() => {}} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Xong/i }));
    expect(onDone).toHaveBeenCalled();
  });
});
