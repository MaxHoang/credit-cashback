import type { Card, RankedCard } from "../lib/types";
import { formatPct } from "../lib/format";
import { ConfidenceBadge } from "./ConfidenceBadge";

export function CardList({ items, onSelect }: { items: RankedCard[]; onSelect: (c: Card) => void }) {
  return (
    <ul className="card-list">
      {items.map((it, i) => (
        <li key={it.card.id} className={`card-row ${i === 0 && it.eligible ? "best" : ""}`} onClick={() => onSelect(it.card)}>
          <div className="card-row-head">
            <span className="rank">{i === 0 && it.eligible ? "👑" : `#${i + 1}`}</span>
            <span className="card-name">{it.card.name}</span>
            <span className="rate">{it.eligible ? formatPct(it.rate) : "—"}</span>
          </div>
          <ConfidenceBadge level={it.confidence} />
          {it.conditions.length > 0 && (
            <ul className="conditions">{it.conditions.map((c, j) => <li key={j}>{c}</li>)}</ul>
          )}
        </li>
      ))}
    </ul>
  );
}
