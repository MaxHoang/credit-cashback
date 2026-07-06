import { describe, it, expect } from "vitest";
import { effectiveRate } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card, UserPicks } from "../src/lib/types";

const cake = (cardsData as Card[]).find((c) => c.id === "cake-freedom")!;

describe("Cake new rule: 3 fixed + choose 2 of 9 (MCC-disambiguated)", () => {
  it("fixed group (Online ecommerce 5262) always pays 20% regardless of picks", () => {
    const e = effectiveRate(cake, "mua-sam-online", { mcc: "5262", userPicks: { "cake-freedom": {} } });
    expect(e.rate).toBe(0.2);
  });

  it("a selected flexible group pays 20% — Transport (4121) when chosen", () => {
    const picks: UserPicks = { "cake-freedom": { select: ["transport", "cinema"] } };
    const e = effectiveRate(cake, "du-lich", { mcc: "4121", userPicks: picks });
    expect(e.rate).toBe(0.2);
    expect(e.conditions.some((c) => c.includes("đã chọn"))).toBe(true);
  });

  it("MCC disambiguates same-category groups: Hotel (7011) in du-lich is base when only Transport is chosen", () => {
    const picks: UserPicks = { "cake-freedom": { select: ["transport", "cinema"] } };
    const hotel = effectiveRate(cake, "du-lich", { mcc: "7011", userPicks: picks });
    expect(hotel.rate).toBe(0); // hotel group not selected → default_rate
    // but the fixed Travel/Tour (4722) in the same category still pays 20%
    const tour = effectiveRate(cake, "du-lich", { mcc: "4722", userPicks: picks });
    expect(tour.rate).toBe(0.2);
  });

  it("eWallet group (8999, Momo/ZaloPay) pays 20% only when chosen", () => {
    const chosen = effectiveRate(cake, "vi-dien-tu", { mcc: "8999", userPicks: { "cake-freedom": { select: ["ewallet", "restaurant"] } } });
    expect(chosen.rate).toBe(0.2);
    const notChosen = effectiveRate(cake, "vi-dien-tu", { mcc: "8999", userPicks: { "cake-freedom": { select: ["cinema", "restaurant"] } } });
    expect(notChosen.rate).toBe(0);
  });

  it("with no picks declared, shows the best-achievable 20% + a 'choose' condition", () => {
    const e = effectiveRate(cake, "sieu-thi", { mcc: "5411" });
    expect(e.rate).toBe(0.2);
    expect(e.conditions.some((c) => c.toLowerCase().includes("linh hoạt") || c.includes("chọn"))).toBe(true);
  });
});
