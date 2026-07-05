import { describe, it, expect } from "vitest";
import { resolveQuery } from "../src/lib/resolve";
import merchantsData from "../src/data/merchants.json";
import { CATEGORIES } from "../src/data/categories";
import type { Merchant } from "../src/lib/types";

const merchants = merchantsData as Merchant[];

describe("resolveQuery", () => {
  it("resolves a known merchant to its mcc + category", () => {
    const r = resolveQuery("Shopee", merchants, CATEGORIES);
    expect(r.kind).toBe("merchant");
    expect(r.mcc).toBe("5399");
    expect(r.categoryId).toBe("mua-sam-online");
  });

  it("matches merchant aliases case-insensitively", () => {
    expect(resolveQuery("circlek", merchants, CATEGORIES).categoryId).toBe("tien-loi");
  });

  it("resolves a category by label ignoring diacritics", () => {
    const r = resolveQuery("an uong", merchants, CATEGORIES);
    expect(r.kind).toBe("category");
    expect(r.categoryId).toBe("an-uong");
  });

  it("returns suggestions for partial input", () => {
    const r = resolveQuery("gr", merchants, CATEGORIES);
    expect(r.kind).toBe("none");
    expect(r.suggestions.some((s) => s.label === "Grab")).toBe(true);
  });

  it("returns none with empty suggestions for gibberish", () => {
    const r = resolveQuery("zzzzz", merchants, CATEGORIES);
    expect(r.kind).toBe("none");
    expect(r.suggestions).toEqual([]);
  });
});
