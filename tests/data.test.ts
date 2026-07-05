import { describe, it, expect } from "vitest";
import cardsData from "../src/data/cards.json";
import { CATEGORY_IDS, CATEGORIES } from "../src/data/categories";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const IDS = ["cake-freedom","vpbank-stepup","tcb-spark","tcb-everyday","mb-jcb-ultimate","mb-priority-visa-signature","vib-travel-elite"];

describe("cards.json integrity", () => {
  it("has the 7 expected cards", () => {
    expect(cards.map((c) => c.id).sort()).toEqual([...IDS].sort());
  });

  it("every card has required fields + valid confidence", () => {
    for (const c of cards) {
      expect(typeof c.name).toBe("string");
      expect(["cashback","points","miles"]).toContain(c.reward_type);
      expect(["flat","pick-n","spend-tier"]).toContain(c.scheme);
      expect(["high","medium","low"]).toContain(c.confidence);
      expect(Array.isArray(c.sources)).toBe(true);
      expect(c.default_rate).toBeGreaterThanOrEqual(0);
      expect(c.default_rate).toBeLessThanOrEqual(1);
    }
  });

  it("every rate.category, excluded_categories are valid category ids", () => {
    for (const c of cards) {
      for (const id of c.excluded_categories) expect(CATEGORY_IDS.has(id)).toBe(true);
      for (const r of c.rates) {
        expect(CATEGORY_IDS.has(r.category)).toBe(true);
        expect(r.rate).toBeGreaterThanOrEqual(0);
        expect(r.rate).toBeLessThanOrEqual(1);
      }
    }
  });

  it("mb-jcb-ultimate rewards insurance at 10%", () => {
    const mb = cards.find((c) => c.id === "mb-jcb-ultimate")!;
    const ins = mb.rates.find((r) => r.category === "bao-hiem")!;
    expect(ins.rate).toBe(0.1);
  });

  it("has at least one rate per non-default category across all cards (sanity)", () => {
    expect(CATEGORIES.length).toBe(13);
  });
});
