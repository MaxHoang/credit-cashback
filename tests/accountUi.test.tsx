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

  it("shows Cake's fixed groups (info) + a choose-2-of-9 selector and records a group pick", () => {
    const onChange = vi.fn();
    const profile = { owned_cards: ["cake-freedom"], picks: {} };
    render(<MyCards profile={profile} onChange={onChange} onDone={() => {}} />);
    // fixed groups are shown as info
    expect(screen.getByText(/Online ecommerce/i)).toBeInTheDocument();
    // selectable groups are the 9 flexible options
    expect(screen.getByText(/Chọn 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Nhà hàng/i }));
    const picks = onChange.mock.calls.at(-1)![0].picks["cake-freedom"];
    expect(picks.select).toContain("restaurant"); // the group key, not a category
  });

  it("Cake caps the flexible selection at 2 groups (choosing a 3rd drops the oldest)", () => {
    const onChange = vi.fn();
    const profile = { owned_cards: ["cake-freedom"], picks: { "cake-freedom": { select: ["supermarket", "restaurant"] } } };
    render(<MyCards profile={profile} onChange={onChange} onDone={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Rạp phim/i }));
    const sel = onChange.mock.calls.at(-1)![0].picks["cake-freedom"].select;
    expect(sel).toHaveLength(2);
    expect(sel).toContain("cinema");
    expect(sel).not.toContain("supermarket"); // oldest dropped
  });

  it("the Done button calls onDone", () => {
    const onDone = vi.fn();
    render(<MyCards profile={DEFAULT_PROFILE} onChange={() => {}} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Xong/i }));
    expect(onDone).toHaveBeenCalled();
  });
});
