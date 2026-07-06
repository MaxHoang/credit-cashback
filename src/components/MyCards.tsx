import type { Card, Profile, Rate } from "../lib/types";
import cardsData from "../data/cards.json";
import { CATEGORIES } from "../data/categories";

const cards = cardsData as Card[];

// MB Priority style: within a named super-group (Mâm 1 / Mâm 2), pick N categories.
const CATEGORY_PICKS: Record<string, { group: string; label: string; count: number }[]> = {
  "mb-priority-visa-signature": [
    { group: "mam1", label: "Mâm 1 (chọn 1)", count: 1 },
    { group: "mam2", label: "Mâm 2 (chọn 2)", count: 2 },
  ],
};

// Cake style: 3 fixed groups (always on) + choose N of the remaining named groups.
// The user's choice is a list of *group keys* stored under `select`.
const OPTION_PICKS: Record<string, { count: number; storeKey: string }> = {
  "cake-freedom": { count: 2, storeKey: "select" },
};

const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
const stripPrefix = (s: string) => s.replace(/^Cố định:\s*/i, "");

export function MyCards({ profile, onChange, onDone }: { profile: Profile; onChange: (p: Profile) => void; onDone: () => void }) {
  const owned = new Set(profile.owned_cards);

  function toggleOwned(id: string) {
    const next = new Set(owned);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ ...profile, owned_cards: [...next] });
  }

  // MB Priority: pick categories within a group.
  function toggleCategoryPick(cardId: string, group: string, catId: string, count: number) {
    const cur = profile.picks[cardId]?.[group];
    const arr = Array.isArray(cur) ? [...cur] : cur ? [cur] : [];
    const i = arr.indexOf(catId);
    if (i >= 0) arr.splice(i, 1);
    else { arr.push(catId); while (arr.length > count) arr.shift(); }
    const value = count === 1 ? (arr[0] ?? "") : arr;
    onChange({ ...profile, picks: { ...profile.picks, [cardId]: { ...profile.picks[cardId], [group]: value } } });
  }

  // Cake: pick group keys (choose N of the selectable groups).
  function toggleOptionPick(cardId: string, groupKey: string, count: number, storeKey: string) {
    const cur = profile.picks[cardId]?.[storeKey];
    const arr = Array.isArray(cur) ? [...cur] : cur ? [cur] : [];
    const i = arr.indexOf(groupKey);
    if (i >= 0) arr.splice(i, 1);
    else { arr.push(groupKey); while (arr.length > count) arr.shift(); }
    onChange({ ...profile, picks: { ...profile.picks, [cardId]: { ...profile.picks[cardId], [storeKey]: arr } } });
  }

  function renderCategoryPicks(c: Card) {
    const groups = CATEGORY_PICKS[c.id] ?? [];
    const isPicked = (g: string, cat: string) => {
      const v = profile.picks[c.id]?.[g];
      return Array.isArray(v) ? v.includes(cat) : v === cat;
    };
    return groups.map((g) => (
      <div key={g.group} className="pick-group">
        <p className="muted">{g.label}:</p>
        <div className="pick-chips">
          {c.rates.filter((r) => r.group === g.group).map((r) => (
            <button key={r.category} type="button" className={`chip ${isPicked(g.group, r.category) ? "on" : ""}`}
              onClick={() => toggleCategoryPick(c.id, g.group, r.category, g.count)}>{catLabel(r.category)}</button>
          ))}
        </div>
      </div>
    ));
  }

  function renderOptionPicks(c: Card) {
    const cfg = OPTION_PICKS[c.id];
    if (!cfg) return null;
    const fixed = c.rates.filter((r) => r.group === "fixed");
    const options = c.rates.filter((r) => r.group && r.group !== "fixed");
    const sel: string[] = (() => {
      const v = profile.picks[c.id]?.[cfg.storeKey];
      return Array.isArray(v) ? v : v ? [v] : [];
    })();
    return (
      <>
        <div className="pick-group">
          <p className="muted">Nhóm cố định (tự động 20%):</p>
          <div className="pick-chips">
            {fixed.map((r: Rate, i) => <span key={i} className="chip fixed">{stripPrefix(r.note ?? catLabel(r.category))}</span>)}
          </div>
        </div>
        <div className="pick-group">
          <p className="muted">Nhóm linh hoạt — Chọn {cfg.count}/{options.length}:</p>
          <div className="pick-chips">
            {options.map((r: Rate) => (
              <button key={r.group} type="button" className={`chip ${sel.includes(r.group!) ? "on" : ""}`}
                onClick={() => toggleOptionPick(c.id, r.group!, cfg.count, cfg.storeKey)}>{r.note ?? catLabel(r.category)}</button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <section className="my-cards">
      <button className="back" onClick={onDone}>← Xong</button>
      <h2>Thẻ của tôi</h2>
      <ul className="own-list">
        {cards.map((c) => {
          const isOwned = owned.has(c.id);
          return (
            <li key={c.id} className="own-row">
              <label><input type="checkbox" checked={isOwned} onChange={() => toggleOwned(c.id)} /> {c.name}</label>
              {isOwned && (OPTION_PICKS[c.id] ? renderOptionPicks(c) : renderCategoryPicks(c))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
