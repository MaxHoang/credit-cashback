import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Disclaimer } from "../src/components/Disclaimer";
import { ConfidenceBadge } from "../src/components/ConfidenceBadge";
import { CardList } from "../src/components/CardList";
import cardsData from "../src/data/cards.json";
import { rankCards } from "../src/lib/ranking";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];

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
    const ranked = rankCards("bao-hiem", cards, { spendTier: "m10_30" });
    render(<CardList items={ranked} onSelect={() => {}} />);
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
    expect(screen.getAllByText(/10%/).length).toBeGreaterThan(0);
  });
});
