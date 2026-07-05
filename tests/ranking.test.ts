import { describe, it, expect } from "vitest";
import { effectiveRate, rankCards } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("effectiveRate", () => {
  it("returns 0 & ineligible for an excluded category", () => {
    const r = effectiveRate(card("cake-freedom"), "xang-dau", {});
    expect(r.eligible).toBe(false);
    expect(r.rate).toBe(0);
  });

  it("auto-picks the best-achievable tier for spend-tier cards", () => {
    const r = effectiveRate(card("vpbank-stepup"), "mua-sam-online", {});
    expect(r.rate).toBe(0.15);
    expect(r.conditions.some((c) => c.toLowerCase().includes("theo mức chi tiêu"))).toBe(true);
  });

  it("drops to default_rate when the merchant is excluded from the category rate", () => {
    const r = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { merchant: "Shopee" });
    expect(r.rate).toBe(0.001);
    expect(r.conditions.some((c) => c.toLowerCase().includes("shopee"))).toBe(true);
  });

  it("surfaces min-spend and cap conditions", () => {
    const r = effectiveRate(card("mb-priority-visa-signature"), "an-uong", {});
    expect(r.rate).toBe(0.1);
    expect(r.conditions.some((c) => c.includes("tối thiểu"))).toBe(true);
    expect(r.conditions.some((c) => c.toLowerCase().includes("cap"))).toBe(true);
  });

  it("flags points/miles estimation", () => {
    const r = effectiveRate(card("tcb-spark"), "du-lich", {});
    expect(r.conditions.some((c) => c.toLowerCase().includes("ước tính"))).toBe(true);
  });
});

describe("rankCards", () => {
  it("ranks Cake Freedom #1 for insurance (20%, best-achievable flex rate)", () => {
    const ranked = rankCards("bao-hiem", cards, {});
    expect(ranked[0].card.id).toBe("cake-freedom");
    expect(ranked[0].rate).toBe(0.2);
    expect(ranked[0].conditions.some((c) => c.includes("linh hoạt"))).toBe(true);
  });

  it("sorts by rate descending", () => {
    const ranked = rankCards("an-uong", cards, {});
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].rate).toBeGreaterThanOrEqual(ranked[i].rate);
  });

  it("surfaces the pick-group mutual-exclusion warning for an-uong's top result", () => {
    const ranked = rankCards("an-uong", cards, {});
    expect(
      ranked[0].conditions.some((c) => c.includes("chọn nhóm") || c.includes("Mâm") || c.includes("linh hoạt")),
    ).toBe(true);
  });

  it("surfaces the pick-group mutual-exclusion warning for giai-tri's top result", () => {
    const ranked = rankCards("giai-tri", cards, {});
    expect(
      ranked[0].conditions.some((c) => c.includes("chọn nhóm") || c.includes("Mâm") || c.includes("linh hoạt")),
    ).toBe(true);
  });
});
