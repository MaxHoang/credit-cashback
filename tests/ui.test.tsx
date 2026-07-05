import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Disclaimer } from "../src/components/Disclaimer";
import { ConfidenceBadge } from "../src/components/ConfidenceBadge";
import { CardList } from "../src/components/CardList";
import { CardDetail } from "../src/components/CardDetail";
import cardsData from "../src/data/cards.json";
import { rankCards } from "../src/lib/ranking";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("UI components", () => {
  it("Disclaimer shows the financial disclaimer text", () => {
    render(<Disclaimer />);
    expect(screen.getByText(/không phải lời khuyên tài chính/i)).toBeInTheDocument();
  });

  it("ConfidenceBadge renders the level label", () => {
    render(<ConfidenceBadge level="high" />);
    expect(screen.getByText(/cao/i)).toBeInTheDocument();
  });

  it("CardList shows the top card name + percent for insurance", () => {
    const ranked = rankCards("bao-hiem", cards, {});
    render(<CardList items={ranked} onSelect={() => {}} />);
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
    expect(screen.getAllByText(/10%/).length).toBeGreaterThan(0);
  });

  it("CardDetail shows a rate range for a spend-tier category (VPBank mua-sam-online)", () => {
    render(<CardDetail card={card("vpbank-stepup")} onBack={() => {}} />);
    expect(screen.getByText(/6% – 15%/)).toBeInTheDocument();
  });
});
