import { describe, it, expect, vi, beforeEach } from "vitest";
import { pb, recordToMerchant, searchMerchants, merchantsToSuggestions } from "../src/lib/pb";
import { CATEGORY_IDS } from "../src/data/categories";

describe("recordToMerchant", () => {
  it("maps a backend merchant record to a Merchant", () => {
    const m = recordToMerchant({ name: "GRAB CO VN", mcc: "4121", category: "du-lich" });
    expect(m).toEqual({ name: "GRAB CO VN", aliases: [], mcc: "4121", category: "du-lich" });
  });

  it("falls back to 'khac' for an unknown/invalid category", () => {
    expect(recordToMerchant({ name: "X", mcc: "0000", category: "not-a-real-cat" }).category).toBe("khac");
    expect(CATEGORY_IDS.has(recordToMerchant({ name: "X", mcc: "0000", category: "not-a-real-cat" }).category)).toBe(true);
  });

  it("is safe with missing fields", () => {
    expect(recordToMerchant({})).toEqual({ name: "", aliases: [], mcc: "", category: "khac" });
  });
});

describe("merchantsToSuggestions", () => {
  it("maps merchants to merchant-kind suggestions", () => {
    const s = merchantsToSuggestions([{ name: "Foo", aliases: [], mcc: "5411", category: "sieu-thi" }]);
    expect(s).toEqual([{ kind: "merchant", label: "Foo", categoryId: "sieu-thi" }]);
  });
});

describe("searchMerchants", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns [] for queries shorter than 2 chars without calling the backend", async () => {
    const spy = vi.spyOn(pb, "collection");
    expect(await searchMerchants("a")).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("queries the merchants collection and maps items", async () => {
    const getList = vi.fn().mockResolvedValue({
      items: [{ name: "SHOPEEPAY", mcc: "7399", category: "khac" }],
    });
    vi.spyOn(pb, "collection").mockReturnValue({ getList } as never);
    const res = await searchMerchants("shopee");
    expect(getList).toHaveBeenCalledOnce();
    expect(res).toEqual([{ name: "SHOPEEPAY", aliases: [], mcc: "7399", category: "khac" }]);
  });

  it("returns [] (never throws) when the backend is unreachable", async () => {
    vi.spyOn(pb, "collection").mockReturnValue({
      getList: vi.fn().mockRejectedValue(new Error("network down")),
    } as never);
    expect(await searchMerchants("shopee")).toEqual([]);
  });
});
