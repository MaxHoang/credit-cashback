import { useState } from "react";
import type { Card, Profile, ResolveResult, SpendTierId } from "./lib/types";
import cardsData from "./data/cards.json";
import { CATEGORIES, DEFAULT_TIER } from "./data/categories";
import { rankCards } from "./lib/ranking";
import { SearchBar } from "./components/SearchBar";
import { CategoryGrid } from "./components/CategoryGrid";
import { SpendTierSelect } from "./components/SpendTierSelect";
import { CardList } from "./components/CardList";
import { CardDetail } from "./components/CardDetail";
import { Disclaimer } from "./components/Disclaimer";
import { AccountBar } from "./components/AccountBar";
import { AmountInput } from "./components/AmountInput";
import { MyCards } from "./components/MyCards";
import { isLoggedIn, loadProfile, saveProfile } from "./lib/pb";

const cards = cardsData as Card[];

type View =
  | { name: "home" }
  | { name: "category"; categoryId: string; merchant?: string; mcc?: string }
  | { name: "card"; card: Card }
  | { name: "all" };

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });
  const [tier, setTier] = useState<SpendTierId>(DEFAULT_TIER);
  const [profile, setProfile] = useState<Profile>(loadProfile());
  const [authTick, setAuthTick] = useState(0);
  const [amount, setAmount] = useState("");
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  function onResolve(r: ResolveResult) {
    if (r.kind === "merchant") setView({ name: "category", categoryId: r.categoryId!, merchant: r.merchant!.name, mcc: r.mcc });
    else if (r.kind === "category") setView({ name: "category", categoryId: r.categoryId! });
  }

  if (showSettings) {
    return (
      <main key={authTick}>
        <MyCards profile={profile} onChange={(p) => {
          setProfile(p);
          if (isLoggedIn()) saveProfile(p).catch(() => {});
          setShowSettings(false);
        }} />
      </main>
    );
  }

  return (
    <main key={authTick}>
      <header className="top"><h1 onClick={() => setView({ name: "home" })}>💳 Hoàn tiền thẻ VN</h1></header>
      <AccountBar
        onAuthChange={() => { setProfile(loadProfile()); setAuthTick((t) => t + 1); }}
        onOpenSettings={() => setShowSettings(true)}
      />
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
        const loggedIn = isLoggedIn();
        const ranked = rankCards(view.categoryId, cards, {
          spendTier: tier,
          merchant: view.merchant,
          userPicks: loggedIn ? profile.picks : undefined,
          amount: amount ? Number(amount) : undefined,
          onlyOwned,
          ownedCards: profile.owned_cards,
        });
        return (
          <>
            <button className="back" onClick={() => setView({ name: "home" })}>← Trang chủ</button>
            {view.merchant && <p className="muted">{view.merchant} → MCC {view.mcc}</p>}
            <h2>{cat.icon} {cat.label}</h2>
            <SpendTierSelect value={tier} onChange={setTier} />
            <AmountInput value={amount} onChange={setAmount} />
            {loggedIn && (
              <label className="only-owned">
                <input type="checkbox" checked={onlyOwned} onChange={(e) => setOnlyOwned(e.target.checked)} />
                Chỉ thẻ của tôi
              </label>
            )}
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
