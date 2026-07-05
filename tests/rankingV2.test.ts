import { describe, it, expect } from "vitest";
import { effectiveRate, rankCards } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card, UserPicks } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("amount-aware ranking", () => {
  it("estimatedCashback = min(amount*rate, cap)", () => {
    const mb = effectiveRate(card("mb-jcb-ultimate"), "bao-hiem", { amount: 10_000_000 });
    expect(mb.estimatedCashback).toBe(400000); // 10M*0.1=1M capped at 400k
    const cake = effectiveRate(card("cake-freedom"), "bao-hiem", { amount: 10_000_000 });
    expect(cake.estimatedCashback).toBe(200000); // 10M*0.2=2M capped at 200k
  });

  it("ranks by estimated cashback (not rate) when amount given — MB JCB beats Cake for big insurance", () => {
    const ranked = rankCards("bao-hiem", cards, { amount: 10_000_000 });
    expect(ranked[0].card.id).toBe("mb-jcb-ultimate");
  });

  it("without amount, ranks by rate (Cake 20% #1 for insurance)", () => {
    const ranked = rankCards("bao-hiem", cards, {});
    expect(ranked[0].card.id).toBe("cake-freedom");
  });
});

describe("personalized (userPicks) ranking", () => {
  const picks: UserPicks = { "mb-priority-visa-signature": { mam1: "bao-hiem", mam2: ["sieu-thi", "thoi-trang"] } };

  it("applies mam1 rate only to the selected category", () => {
    const sel = effectiveRate(card("mb-priority-visa-signature"), "bao-hiem", { userPicks: picks });
    expect(sel.rate).toBe(0.1);
    expect(sel.conditions.some((c) => c.includes("đã chọn"))).toBe(true);
    const notSel = effectiveRate(card("mb-priority-visa-signature"), "an-uong", { userPicks: picks });
    expect(notSel.rate).toBe(0.001); // an-uong not picked -> default
  });

  it("onlyOwned filters to the user's cards", () => {
    const ranked = rankCards("an-uong", cards, { onlyOwned: true, ownedCards: ["tcb-spark"] });
    expect(ranked.every((r) => r.card.id === "tcb-spark")).toBe(true);
  });
});
