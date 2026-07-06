import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchBar } from "../src/components/SearchBar";

// Mock only the backend call; keep the rest of pb.ts real.
vi.mock("../src/lib/pb", async (orig) => {
  const actual = await (orig() as Promise<Record<string, unknown>>);
  return {
    ...actual,
    searchMerchants: vi.fn().mockResolvedValue([
      { name: "KBANK SHOPEE 19001221 VN", aliases: [], mcc: "5732", category: "mua-sam-offline" },
    ]),
  };
});

describe("SearchBar backend fallback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a long-tail backend merchant not in the curated set", async () => {
    render(<SearchBar onResolve={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "shopeepay19001" } });
    await waitFor(() => expect(screen.getByText(/KBANK SHOPEE/)).toBeInTheDocument());
  });

  it("resolves a picked backend merchant with its MCC + category", async () => {
    const onResolve = vi.fn();
    render(<SearchBar onResolve={onResolve} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "shopeepay19001" } });
    const item = await screen.findByText(/KBANK SHOPEE/);
    fireEvent.click(item);
    expect(onResolve).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "merchant", mcc: "5732", categoryId: "mua-sam-offline" })
    );
  });

  it("does not hit the backend when a curated merchant matches exactly", async () => {
    const pb = await import("../src/lib/pb");
    render(<SearchBar onResolve={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Shopee" } });
    // give any debounce a chance
    await new Promise((r) => setTimeout(r, 350));
    expect(pb.searchMerchants).not.toHaveBeenCalled();
  });
});
