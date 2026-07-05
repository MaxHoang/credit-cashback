import { describe, it, expect } from "vitest";
import { effectiveRate, rankCards } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("effectiveRate", () => {
  it("returns 0 & ineligible for an excluded category", () => {
    const r = effectiveRate(card("cake-freedom"), "xang-dau", { spendTier: "m10_30" });
    expect(r.eligible).toBe(false);
    expect(r.rate).toBe(0);
  });

  it("uses the tier-matching rate for spend-tier cards", () => {
    const low = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "lt10" });
    const mid = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "m10_30" });
    expect(low.rate).toBe(0.06);
    expect(mid.rate).toBe(0.15);
  });

  it("drops to default_rate when the merchant is excluded from the category rate", () => {
    const r = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "m10_30", merchant: "Shopee" });
    expect(r.rate).toBe(0.001);
    expect(r.conditions.some((c) => c.toLowerCase().includes("shopee"))).toBe(true);
  });

  it("surfaces min-spend and cap conditions", () => {
    const r = effectiveRate(card("mb-priority-visa-signature"), "an-uong", { spendTier: "m10_30" });
    expect(r.rate).toBe(0.1);
    expect(r.conditions.some((c) => c.includes("tối thiểu"))).toBe(true);
    expect(r.conditions.some((c) => c.toLowerCase().includes("cap"))).toBe(true);
  });

  it("flags points/miles estimation", () => {
    const r = effectiveRate(card("tcb-spark"), "du-lich", { spendTier: "m10_30" });
    expect(r.conditions.some((c) => c.toLowerCase().includes("ước tính"))).toBe(true);
  });
});

describe("rankCards", () => {
  it("ranks MB JCB Ultimate #1 for insurance (10%)", () => {
    const ranked = rankCards("bao-hiem", cards, { spendTier: "m10_30" });
    expect(ranked[0].card.id).toBe("mb-jcb-ultimate");
    expect(ranked[0].rate).toBe(0.1);
  });

  it("sorts by rate descending", () => {
    const ranked = rankCards("an-uong", cards, { spendTier: "m10_30" });
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].rate).toBeGreaterThanOrEqual(ranked[i].rate);
  });
});
