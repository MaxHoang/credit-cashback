import type { Card, Profile } from "../lib/types";
import cardsData from "../data/cards.json";
import { SPEND_TIERS } from "../data/spendTiers";
import { CATEGORIES } from "../data/categories";

const cards = cardsData as Card[];
// pick-groups per card that the user must choose (group -> how many)
const PICK_GROUPS: Record<string, { group: string; label: string; count: number }[]> = {
  "cake-freedom": [{ group: "flex", label: "Nhóm linh hoạt (chọn 2)", count: 2 }],
  "mb-priority-visa-signature": [
    { group: "mam1", label: "Mâm 1 (chọn 1)", count: 1 },
    { group: "mam2", label: "Mâm 2 (chọn 2)", count: 2 },
  ],
};
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function MyCards({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const owned = new Set(profile.owned_cards);

  function toggleOwned(id: string) {
    const next = new Set(owned);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ ...profile, owned_cards: [...next] });
  }
  function togglePick(cardId: string, group: string, catId: string, count: number) {
    const cur = profile.picks[cardId]?.[group];
    const arr = Array.isArray(cur) ? [...cur] : cur ? [cur] : [];
    const i = arr.indexOf(catId);
    if (i >= 0) arr.splice(i, 1);
    else { arr.push(catId); while (arr.length > count) arr.shift(); }
    const value = count === 1 ? (arr[0] ?? "") : arr;
    onChange({ ...profile, picks: { ...profile.picks, [cardId]: { ...profile.picks[cardId], [group]: value } } });
  }

  return (
    <section className="my-cards">
      <button className="back" onClick={() => onChange(profile)}>← Xong</button>
      <h2>Thẻ của tôi</h2>
      <label className="tier-select">
        <span>Mức chi tiêu/tháng của tôi</span>
        <select value={profile.default_spend_tier} onChange={(e) => onChange({ ...profile, default_spend_tier: e.target.value as Profile["default_spend_tier"] })}>
          {SPEND_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </label>
      <ul className="own-list">
        {cards.map((c) => {
          const isOwned = owned.has(c.id);
          const groups = PICK_GROUPS[c.id] ?? [];
          const groupCats = (g: string) => c.rates.filter((r) => r.group === g).map((r) => r.category);
          const isPicked = (g: string, cat: string) => {
            const v = profile.picks[c.id]?.[g];
            return Array.isArray(v) ? v.includes(cat) : v === cat;
          };
          return (
            <li key={c.id} className="own-row">
              <label><input type="checkbox" checked={isOwned} onChange={() => toggleOwned(c.id)} /> {c.name}</label>
              {isOwned && groups.map((g) => (
                <div key={g.group} className="pick-group">
                  <p className="muted">{g.label}:</p>
                  <div className="pick-chips">
                    {groupCats(g.group).map((cat) => (
                      <button key={cat} type="button" className={`chip ${isPicked(g.group, cat) ? "on" : ""}`}
                        onClick={() => togglePick(c.id, g.group, cat, g.count)}>{catLabel(cat)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
