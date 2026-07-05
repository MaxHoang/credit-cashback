import { useState } from "react";
import type { Card, ResolveResult, SpendTierId } from "./lib/types";
import cardsData from "./data/cards.json";
import { CATEGORIES, DEFAULT_TIER } from "./data/categories";
import { rankCards } from "./lib/ranking";
import { SearchBar } from "./components/SearchBar";
import { CategoryGrid } from "./components/CategoryGrid";
import { SpendTierSelect } from "./components/SpendTierSelect";
import { CardList } from "./components/CardList";
import { CardDetail } from "./components/CardDetail";
import { Disclaimer } from "./components/Disclaimer";

const cards = cardsData as Card[];

type View =
  | { name: "home" }
  | { name: "category"; categoryId: string; merchant?: string; mcc?: string }
  | { name: "card"; card: Card }
  | { name: "all" };

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [tier, setTier] = useState<SpendTierId>(DEFAULT_TIER);

  function onResolve(r: ResolveResult) {
    if (r.kind === "merchant") setView({ name: "category", categoryId: r.categoryId!, merchant: r.merchant!.name, mcc: r.mcc });
    else if (r.kind === "category") setView({ name: "category", categoryId: r.categoryId! });
  }

  return (
    <main>
      <header className="top"><h1 onClick={() => setView({ name: "home" })}>💳 Hoàn tiền thẻ VN</h1></header>
      <Disclaimer />

      {view.name === "home" && (
        <>
          <SearchBar onResolve={onResolve} />
          <SpendTierSelect value={tier} onChange={setTier} />
          <CategoryGrid onPick={(categoryId) => setView({ name: "category", categoryId })} />
          <button className="link" onClick={() => setView({ name: "all" })}>Xem tất cả thẻ →</button>
        </>
      )}

      {view.name === "category" && (() => {
        const cat = CATEGORIES.find((c) => c.id === view.categoryId)!;
        const ranked = rankCards(view.categoryId, cards, { spendTier: tier, merchant: view.merchant });
        return (
          <>
            <button className="back" onClick={() => setView({ name: "home" })}>← Trang chủ</button>
            {view.merchant && <p className="muted">{view.merchant} → MCC {view.mcc}</p>}
            <h2>{cat.icon} {cat.label}</h2>
            <SpendTierSelect value={tier} onChange={setTier} />
            <CardList items={ranked} onSelect={(card) => setView({ name: "card", card })} />
          </>
        );
      })()}

      {view.name === "card" && <CardDetail card={view.card} onBack={() => setView({ name: "home" })} />}

      {view.name === "all" && (
        <>
          <button className="back" onClick={() => setView({ name: "home" })}>← Trang chủ</button>
          <h2>Tất cả thẻ</h2>
          <ul className="card-list">
            {cards.map((c) => <li key={c.id} className="card-row" onClick={() => setView({ name: "card", card: c })}><span className="card-name">{c.name}</span></li>)}
          </ul>
        </>
      )}
    </main>
  );
}
