import { describe, it, expect } from "vitest";
import { effectiveRate } from "../src/lib/ranking";
import type { Card } from "../src/lib/types";

// Card whose health/education bonus is defined by a real MCC list (as banks do).
const card: Card = {
  id: "test-mcc", name: "Test", issuer: "X", network: "Visa",
  annual_fee: 0, reward_type: "cashback", scheme: "flat",
  min_monthly_spend: 0, monthly_cap_total: null, default_rate: 0,
  excluded_categories: [], confidence: "high", as_of: "2026-07-06", sources: [], notes: [],
  rates: [
    { category: "suc-khoe-giao-duc", rate: 0.1, cap_monthly: 800000, mccs: ["8011", "8021", "8299"], confidence: "high" },
  ],
};

describe("MCC-aware effectiveRate", () => {
  it("applies the bonus when the merchant MCC is in the card's documented list", () => {
    const e = effectiveRate(card, "suc-khoe-giao-duc", { mcc: "8011" });
    expect(e.rate).toBe(0.1);
    expect(e.conditions.some((c) => c.includes("8011") && c.includes("✓"))).toBe(true);
  });

  it("falls back to the base rate when the merchant MCC is NOT in the documented list", () => {
    // A dermatology-adjacent merchant that resolved to the health category but whose
    // real MCC isn't a bonus MCC → bank would not pay the bonus.
    const e = effectiveRate(card, "suc-khoe-giao-duc", { mcc: "5999" });
    expect(e.rate).toBe(0); // default_rate
    expect(e.conditions.some((c) => c.toLowerCase().includes("không thuộc"))).toBe(true);
  });

  it("keeps category-based behavior when no MCC is supplied (back-compat)", () => {
    const e = effectiveRate(card, "suc-khoe-giao-duc", {});
    expect(e.rate).toBe(0.1);
  });

  it("ignores MCC filtering for rates that do not document MCCs", () => {
    const catOnly: Card = { ...card, rates: [{ category: "an-uong", rate: 0.05 }] };
    const e = effectiveRate(catOnly, "an-uong", { mcc: "9999" });
    expect(e.rate).toBe(0.05);
  });
});
