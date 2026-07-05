# credit-cashback v2 (Accounts + Personalization) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Google-SSO accounts (PocketBase/SQLite) storing owned-cards + pick-group selections + spend tier → exact personalized ranking; plus amount-aware ranking (rank by estimated cashback). Backend deploy-ready for `card.lagomlab.tech` (deployed later by the lagomlab Claude).

**Architecture:** Existing static React app (GitHub Pages) + PocketBase JS SDK. Ranking logic stays pure/testable, extended with `userPicks` + `amount`. PocketBase (single Go binary + SQLite) runs locally for dev/test; prod on lagomlab behind Cloudflare.

**Tech Stack:** React+Vite+TS+Vitest (existing); `pocketbase` JS SDK; PocketBase server (SQLite); docker-compose for deploy.

## Global Constraints

- **Anonymous parity:** logged-out behavior = v1 (best-achievable + conditions). Personalization only when `userPicks` present. Never break v1.
- **Amount-aware (v2 core):** when `amount` given, `estimatedCashback = capMonthly!=null ? min(amount*rate, capMonthly) : amount*rate`; `rankCards` sorts by `estimatedCashback` desc when `amount` present, else by rate. (Fixes: insurance 10M → MB JCB 400k > Cake 200k.)
- **Auth:** Google OAuth ONLY (prod). Data on `users` record: `owned_cards` (json string[]), `picks` (json), `default_spend_tier` (text). Access rule: owner-only.
- **No secrets committed:** Google client id/secret, PocketBase admin → env / setup steps in runbook only. `pb_data/` gitignored.
- **Domain prod:** `card.lagomlab.tech`; `VITE_PB_URL` dev `http://localhost:8090`, prod `https://card.lagomlab.tech`.
- **Deploy is out of scope here** (lagomlab Claude does it); this plan builds + tests on the dev VPS. Conventional Commits + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure
```
src/lib/types.ts          (+ UserPicks, Profile, estimatedCashback on RankedCard)
src/lib/ranking.ts        (+ userPicks + amount)
src/lib/pb.ts             (PocketBase client + auth/profile helpers)   NEW
src/components/{AccountBar,MyCards,AmountInput}.tsx                    NEW
src/App.tsx               (login, personalization toggle, amount)
backend/docker-compose.yml, backend/pb_migrations/*.js, backend/run-dev.sh   NEW
docs/RUNBOOK-deploy-lagomlab.md   NEW
tests/{rankingV2.test.ts, pb.test.ts, accountUi.test.tsx}
.env.example
```

---

## Task 1: Amount-aware + personalized ranking (pure logic)

**Files:** Modify `src/lib/types.ts`, `src/lib/ranking.ts`; Create `tests/rankingV2.test.ts`

**Interfaces:**
- Add to types: `UserPicks = { [cardId: string]: { [group: string]: string | string[] } }`; `Profile = { owned_cards: string[]; picks: UserPicks; default_spend_tier: SpendTierId }`; add `estimatedCashback?: number | null` to `RankedCard`.
- `effectiveRate(card, categoryId, { spendTier, merchant?, userPicks?, amount? })` → adds `estimatedCashback`.
- `rankCards(categoryId, cards, { spendTier, merchant?, userPicks?, amount?, onlyOwned?, ownedCards? })`.

- [ ] **Step 1: Add types** — append to `src/lib/types.ts`:
```ts
export interface UserPicks { [cardId: string]: { [group: string]: string | string[] }; }
export interface Profile { owned_cards: string[]; picks: UserPicks; default_spend_tier: SpendTierId; }
```
And add `estimatedCashback?: number | null;` to the `RankedCard` interface.

- [ ] **Step 2: Write failing tests** `tests/rankingV2.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { effectiveRate, rankCards } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card, UserPicks } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("amount-aware ranking", () => {
  it("estimatedCashback = min(amount*rate, cap)", () => {
    const mb = effectiveRate(card("mb-jcb-ultimate"), "bao-hiem", { spendTier: "m10_30", amount: 10_000_000 });
    expect(mb.estimatedCashback).toBe(400000); // 10M*0.1=1M capped at 400k
    const cake = effectiveRate(card("cake-freedom"), "bao-hiem", { spendTier: "m10_30", amount: 10_000_000 });
    expect(cake.estimatedCashback).toBe(200000); // 10M*0.2=2M capped at 200k
  });

  it("ranks by estimated cashback (not rate) when amount given — MB JCB beats Cake for big insurance", () => {
    const ranked = rankCards("bao-hiem", cards, { spendTier: "m10_30", amount: 10_000_000 });
    expect(ranked[0].card.id).toBe("mb-jcb-ultimate");
  });

  it("without amount, ranks by rate (Cake 20% #1 for insurance)", () => {
    const ranked = rankCards("bao-hiem", cards, { spendTier: "m10_30" });
    expect(ranked[0].card.id).toBe("cake-freedom");
  });
});

describe("personalized (userPicks) ranking", () => {
  const picks: UserPicks = { "mb-priority-visa-signature": { mam1: "bao-hiem", mam2: ["sieu-thi", "thoi-trang"] } };

  it("applies mam1 rate only to the selected category", () => {
    const sel = effectiveRate(card("mb-priority-visa-signature"), "bao-hiem", { spendTier: "m10_30", userPicks: picks });
    expect(sel.rate).toBe(0.1);
    expect(sel.conditions.some((c) => c.includes("đã chọn"))).toBe(true);
    const notSel = effectiveRate(card("mb-priority-visa-signature"), "an-uong", { spendTier: "m10_30", userPicks: picks });
    expect(notSel.rate).toBe(0.001); // an-uong not picked -> default
  });

  it("onlyOwned filters to the user's cards", () => {
    const ranked = rankCards("an-uong", cards, { spendTier: "m10_30", onlyOwned: true, ownedCards: ["tcb-spark"] });
    expect(ranked.every((r) => r.card.id === "tcb-spark")).toBe(true);
  });
});
```

- [ ] **Step 3: Run → FAIL.** `npx vitest run tests/rankingV2.test.ts` (effectiveRate lacks new opts).

- [ ] **Step 4: Update `src/lib/ranking.ts`** — replace the `Opts`/`EffResult` interfaces + `effectiveRate` + `rankCards` with:
```ts
import type { Card, Confidence, RankedCard, Rate, SpendTierId, UserPicks } from "./types";
import { formatVnd } from "./format";

interface Opts {
  spendTier: SpendTierId; merchant?: string; userPicks?: UserPicks; amount?: number;
  onlyOwned?: boolean; ownedCards?: string[];
}
interface EffResult {
  rate: number; eligible: boolean; capMonthly: number | null; minSpend: number;
  confidence: Confidence; note?: string; conditions: string[]; estimatedCashback: number | null;
}
const CONF_ORDER: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };
const PICK_CONDITION: Record<string, string> = {
  flex: "Chỉ đạt nếu bạn chọn nhóm này (nhóm linh hoạt — Cake chọn 2/5 nhóm)",
  mam1: "Chỉ đạt nếu bạn chọn nhóm này (Mâm 1 — chỉ chọn 1 nhóm/tháng)",
  mam2: "Chỉ đạt nếu bạn chọn nhóm này (Mâm 2 — chọn 2 nhóm/tháng)",
};

function estimate(amount: number | undefined, rate: number, cap: number | null): number | null {
  if (amount == null) return null;
  const raw = amount * rate;
  return cap != null ? Math.min(raw, cap) : raw;
}

export function effectiveRate(card: Card, categoryId: string, opts: Opts): EffResult {
  const conditions: string[] = [];
  if (card.excluded_categories.includes(categoryId)) {
    return { rate: 0, eligible: false, capMonthly: null, minSpend: card.min_monthly_spend, confidence: card.confidence, note: "Không áp dụng nhóm này", conditions: ["Không áp dụng nhóm này"], estimatedCashback: estimate(opts.amount, 0, null) };
  }
  let candidates: Rate[] = card.rates.filter((r) => r.category === categoryId);
  if (card.scheme === "spend-tier") {
    const tiered = candidates.filter((r) => r.tier === opts.spendTier);
    candidates = tiered.length ? tiered : candidates.filter((r) => !r.tier);
  }
  let chosen: Rate | undefined = candidates[0];

  const merch = opts.merchant?.toLowerCase();
  if (chosen && merch && chosen.excluded_merchants?.some((m) => m.toLowerCase() === merch)) {
    conditions.push(`${opts.merchant} không áp dụng ưu đãi nhóm này (về mức cơ bản)`);
    chosen = undefined;
  }

  // Personalization: if the user declared their picks, a pickable group applies only to the selected category.
  if (chosen && chosen.group && chosen.group !== "fixed" && opts.userPicks) {
    const sel = opts.userPicks[card.id]?.[chosen.group];
    const selected = Array.isArray(sel) ? sel.includes(categoryId) : sel === categoryId;
    if (selected) conditions.push("Bạn đã chọn nhóm này ✓");
    else { conditions.push("Bạn chưa chọn nhóm này (về mức cơ bản)"); chosen = undefined; }
  }

  const rate = chosen ? chosen.rate : card.default_rate;
  const capMonthly = (chosen?.cap_monthly ?? card.monthly_cap_total) ?? null;

  if (card.min_monthly_spend > 0) conditions.push(`Cần chi tối thiểu ${formatVnd(card.min_monthly_spend)}/tháng`);
  if (capMonthly) conditions.push(`Cap ${formatVnd(capMonthly)}/tháng`);
  if (chosen?.group && !opts.userPicks && PICK_CONDITION[chosen.group]) conditions.push(PICK_CONDITION[chosen.group]);
  if (card.reward_type === "points") conditions.push("Ước tính từ điểm thưởng (1 điểm = 1 VND)");
  if (card.reward_type === "miles") conditions.push("Ước tính từ dặm thưởng");
  if (chosen?.note) conditions.push(chosen.note);

  return {
    rate, eligible: rate > 0, capMonthly, minSpend: card.min_monthly_spend,
    confidence: chosen?.confidence ?? card.confidence, note: chosen?.note, conditions,
    estimatedCashback: estimate(opts.amount, rate, capMonthly),
  };
}

export function rankCards(categoryId: string, cards: Card[], opts: Opts): RankedCard[] {
  const pool = opts.onlyOwned && opts.ownedCards ? cards.filter((c) => opts.ownedCards!.includes(c.id)) : cards;
  const byAmount = opts.amount != null;
  return pool
    .map((card): RankedCard => {
      const e = effectiveRate(card, categoryId, opts);
      return { card, rate: e.rate, eligible: e.eligible, capMonthly: e.capMonthly, minSpend: e.minSpend, confidence: e.confidence, conditions: e.conditions, note: e.note, estimatedCashback: e.estimatedCashback };
    })
    .sort((a, b) => {
      if (byAmount) {
        const ea = a.estimatedCashback ?? -1, eb = b.estimatedCashback ?? -1;
        if (eb !== ea) return eb - ea;
      }
      if (b.rate !== a.rate) return b.rate - a.rate;
      const ca = a.capMonthly ?? Infinity, cb = b.capMonthly ?? Infinity;
      if (cb !== ca) return cb - ca;
      return CONF_ORDER[b.confidence] - CONF_ORDER[a.confidence];
    });
}
```

- [ ] **Step 5: Run → PASS.** `npx vitest run tests/rankingV2.test.ts` then `npm test` (all green, incl existing ranking tests — the `!opts.userPicks` guard keeps v1 anonymous behavior intact). `npx tsc -b --noEmit` clean.

- [ ] **Step 6: Commit** `git add src/lib/types.ts src/lib/ranking.ts tests/rankingV2.test.ts && git commit -m "feat(ranking): amount-aware + personalized (userPicks) ranking"`

---

## Task 2: PocketBase backend (schema migration + compose + dev run)

**Files:** Create `backend/pb_migrations/1720200000_init_profile.js`, `backend/docker-compose.yml`, `backend/run-dev.sh`, `.env.example`; Modify `.gitignore`

- [ ] **Step 1: Add gitignore** — append to `.gitignore`:
```
# PocketBase runtime
backend/pb_data/
backend/pocketbase
```

- [ ] **Step 2: Create migration** `backend/pb_migrations/1720200000_init_profile.js` (PocketBase JS migration — adds fields to the built-in `users` auth collection + owner-only rules):
```js
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new Field({ name: "owned_cards", type: "json", maxSize: 20000 }));
  users.fields.add(new Field({ name: "picks", type: "json", maxSize: 50000 }));
  users.fields.add(new Field({ name: "default_spend_tier", type: "text", max: 16 }));
  // owner-only access
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id";
  users.listRule = null;   // no listing others
  users.createRule = "";   // allow OAuth-created signups
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  ["owned_cards", "picks", "default_spend_tier"].forEach((n) => {
    const f = users.fields.getByName(n); if (f) users.fields.remove(f);
  });
  app.save(users);
});
```
(If the installed PocketBase version's migration API differs, the implementer adapts to that version's `Field`/`Collection` API — the intent is: add the 3 fields + owner-only view/update rules. Verify against the running instance.)

- [ ] **Step 3: Create `backend/docker-compose.yml`**:
```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: credit-cashback-pb
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_migrations:/pb_migrations
    command:
      - --dir=/pb_data
      - --migrationsDir=/pb_migrations
      - --http=0.0.0.0:8090
```

- [ ] **Step 4: Create `backend/run-dev.sh`** (download binary if missing, run locally — for dev without Docker):
```bash
#!/usr/bin/env bash
# Dev-only PocketBase runner. Downloads the binary on first run.
set -euo pipefail
cd "$(dirname "$0")"
VER="0.28.4"
if [ ! -x ./pocketbase ]; then
  echo "downloading pocketbase v$VER…"
  curl -sSLo pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${VER}/pocketbase_${VER}_linux_amd64.zip"
  python3 -m zipfile -e pb.zip . && chmod +x pocketbase && rm -f pb.zip
fi
exec ./pocketbase serve --http=0.0.0.0:8090 --dir=./pb_data --migrationsDir=./pb_migrations
```
`chmod +x backend/run-dev.sh`.

- [ ] **Step 5: Create `.env.example`** (documents required config; never commit real values):
```
# Frontend build-time
VITE_PB_URL=http://localhost:8090
# (prod) VITE_PB_URL=https://card.lagomlab.tech

# PocketBase Google OAuth (set in PB Admin UI or via env at deploy — NOT committed)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

- [ ] **Step 6: Smoke-verify** — start PocketBase locally and confirm the migration applied:
```bash
cd backend && ./run-dev.sh &   # or: docker compose up -d
sleep 6
curl -sf http://localhost:8090/api/health | grep -q '"code":200' && echo "PB healthy"
# confirm users collection has the new fields (needs an admin token; if not set up, at least health passes)
```
Expected: `PB healthy`. Stop it after (`kill %1` or `docker compose down`). If the download/run is blocked in this environment, document that and rely on the migration file being correct (it will apply on the lagomlab deploy); do NOT fake a pass.

- [ ] **Step 7: Commit** `git add backend/ .env.example .gitignore && git commit -m "feat(backend): PocketBase schema migration + compose + dev runner"`

---

## Task 3: PocketBase client + auth/profile helpers

**Files:** Create `src/lib/pb.ts`, `tests/pb.test.ts`; add `pocketbase` dep

- [ ] **Step 1: Add dep** — `npm install pocketbase@^0.26.2` (or latest 0.x). Commit lockfile with this task.

- [ ] **Step 2: Write failing test** `tests/pb.test.ts` (tests the pure mapping helpers, not the network):
```ts
import { describe, it, expect } from "vitest";
import { profileFromRecord, DEFAULT_PROFILE } from "../src/lib/pb";

describe("profile mapping", () => {
  it("maps a PocketBase record to a Profile with defaults", () => {
    const p = profileFromRecord({ owned_cards: ["tcb-spark"], picks: { "cake-freedom": { flex: ["an-uong"] } }, default_spend_tier: "m30_100" });
    expect(p.owned_cards).toEqual(["tcb-spark"]);
    expect(p.picks["cake-freedom"].flex).toEqual(["an-uong"]);
    expect(p.default_spend_tier).toBe("m30_100");
  });
  it("falls back to defaults for missing/empty fields", () => {
    const p = profileFromRecord({});
    expect(p).toEqual(DEFAULT_PROFILE);
  });
});
```

- [ ] **Step 3: Run → FAIL.**

- [ ] **Step 4: Create `src/lib/pb.ts`**:
```ts
import PocketBase from "pocketbase";
import type { Profile } from "./types";

export const PB_URL = import.meta.env.VITE_PB_URL ?? "http://localhost:8090";
export const pb = new PocketBase(PB_URL);

export const DEFAULT_PROFILE: Profile = { owned_cards: [], picks: {}, default_spend_tier: "m10_30" };

export function profileFromRecord(rec: Record<string, unknown>): Profile {
  return {
    owned_cards: Array.isArray(rec.owned_cards) ? (rec.owned_cards as string[]) : [],
    picks: (rec.picks && typeof rec.picks === "object" ? rec.picks : {}) as Profile["picks"],
    default_spend_tier: (typeof rec.default_spend_tier === "string" && rec.default_spend_tier ? rec.default_spend_tier : "m10_30") as Profile["default_spend_tier"],
  };
}

export async function loginWithGoogle(): Promise<Profile> {
  const auth = await pb.collection("users").authWithOAuth2({ provider: "google" });
  return profileFromRecord(auth.record as unknown as Record<string, unknown>);
}

export function logout(): void { pb.authStore.clear(); }
export function isLoggedIn(): boolean { return pb.authStore.isValid; }
export function currentUser() { return pb.authStore.record; }

export async function saveProfile(p: Profile): Promise<void> {
  const id = pb.authStore.record?.id;
  if (!id) throw new Error("not logged in");
  await pb.collection("users").update(id, p);
}

export function loadProfile(): Profile {
  return pb.authStore.record ? profileFromRecord(pb.authStore.record as unknown as Record<string, unknown>) : DEFAULT_PROFILE;
}
```

- [ ] **Step 5: Run → PASS.** `npx vitest run tests/pb.test.ts` then `npm test`. `npx tsc -b --noEmit` clean. (If `import.meta.env` typing complains, add `/// <reference types="vite/client" />` at the top of pb.ts.)

- [ ] **Step 6: Commit** `git add src/lib/pb.ts tests/pb.test.ts package.json package-lock.json && git commit -m "feat(pb): PocketBase client + auth/profile helpers"`

---

## Task 4: "Thẻ của tôi" settings screen

**Files:** Create `src/components/MyCards.tsx`; Modify `src/styles.css`; Create `tests/accountUi.test.tsx`

**Interfaces:** `<MyCards profile={Profile} onChange={(p:Profile)=>void} />` — edits owned cards + pick-group selections (constrained counts) + default spend tier. Pure (parent persists via saveProfile).

- [ ] **Step 1: Write failing render test** `tests/accountUi.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MyCards } from "../src/components/MyCards";
import { DEFAULT_PROFILE } from "../src/lib/pb";

describe("MyCards", () => {
  it("lists all 7 cards as ownership toggles", () => {
    render(<MyCards profile={DEFAULT_PROFILE} onChange={() => {}} />);
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
    expect(screen.getByText("Cake Freedom")).toBeInTheDocument();
  });
  it("toggling a card ownership calls onChange with the card added", () => {
    const onChange = vi.fn();
    render(<MyCards profile={DEFAULT_PROFILE} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Cake Freedom/i));
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls.at(-1)![0];
    expect(arg.owned_cards).toContain("cake-freedom");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Create `src/components/MyCards.tsx`**:
```tsx
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
```

- [ ] **Step 4: Append styles** to `src/styles.css`:
```css
.own-list { list-style:none; padding:0; } .own-row { padding:10px 0; border-bottom:1px solid #23272f; }
.pick-group { margin:6px 0 0 22px; } .pick-chips { display:flex; flex-wrap:wrap; gap:6px; }
.chip { padding:4px 10px; border-radius:999px; border:1px solid #2a2f3a; background:var(--card); color:var(--fg); font-size:12px; }
.chip.on { border-color:var(--accent); color:var(--accent); }
```

- [ ] **Step 5: Run → PASS.** `npx vitest run tests/accountUi.test.tsx` then `npm test`.

- [ ] **Step 6: Commit** `git add src/components/MyCards.tsx src/styles.css tests/accountUi.test.tsx && git commit -m "feat(ui): MyCards settings (owned cards + pick groups + spend tier)"`

---

## Task 5: App integration — login, personalization, amount input

**Files:** Create `src/components/AccountBar.tsx`, `src/components/AmountInput.tsx`; Modify `src/App.tsx`, `src/styles.css`; Create/append `tests/appV2.test.tsx`

- [ ] **Step 1: Write failing test** `tests/appV2.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";

describe("App v2", () => {
  it("shows a Google login control when logged out", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Đăng nhập với Google/i })).toBeInTheDocument();
  });
  it("amount input re-ranks a category by estimated cashback", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Bảo hiểm"));
    const amt = screen.getByPlaceholderText(/số tiền/i);
    fireEvent.change(amt, { target: { value: "10000000" } });
    // MB JCB Ultimate should now be first (400k > Cake 200k) — assert it renders before Cake
    const names = screen.getAllByText(/MB JCB Ultimate|Cake Freedom/).map((n) => n.textContent);
    expect(names.indexOf("MB JCB Ultimate")).toBeLessThan(names.indexOf("Cake Freedom"));
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Create `src/components/AmountInput.tsx`**:
```tsx
export function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="amount-input">
      <span>Số tiền giao dịch (tuỳ chọn) — để so sánh chính xác theo cap</span>
      <input inputMode="numeric" placeholder="vd: 10000000 (số tiền)" value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} />
    </label>
  );
}
```

- [ ] **Step 4: Create `src/components/AccountBar.tsx`**:
```tsx
import { useState } from "react";
import { isLoggedIn, loginWithGoogle, logout, currentUser } from "../lib/pb";

export function AccountBar({ onAuthChange, onOpenSettings }: { onAuthChange: () => void; onOpenSettings: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const user = currentUser();
  if (isLoggedIn() && user) {
    return (
      <div className="account-bar">
        <span>👤 {(user as { email?: string }).email ?? "Tài khoản"}</span>
        <button onClick={onOpenSettings}>Thẻ của tôi</button>
        <button onClick={() => { logout(); onAuthChange(); }}>Đăng xuất</button>
      </div>
    );
  }
  return (
    <div className="account-bar">
      <button disabled={busy} onClick={async () => {
        setBusy(true); setErr("");
        try { await loginWithGoogle(); onAuthChange(); }
        catch (e) { setErr("Đăng nhập thất bại (backend chưa sẵn sàng?)"); }
        finally { setBusy(false); }
      }}>Đăng nhập với Google</button>
      {err && <span className="muted">{err}</span>}
    </div>
  );
}
```

- [ ] **Step 5: Wire into `src/App.tsx`** — add near the top of the component: auth/profile/amount state, and pass `userPicks`/`amount`/`onlyOwned` into `rankCards`. Concretely:
  - `import { AccountBar } from "./components/AccountBar"; import { AmountInput } from "./components/AmountInput"; import { MyCards } from "./components/MyCards"; import { isLoggedIn, loadProfile, saveProfile } from "./lib/pb"; import type { Profile } from "./lib/types";`
  - Add state: `const [profile, setProfile] = useState<Profile>(loadProfile()); const [authTick, setAuthTick] = useState(0); const [amount, setAmount] = useState(""); const [onlyOwned, setOnlyOwned] = useState(false); const [showSettings, setShowSettings] = useState(false);`
  - Render `<AccountBar onAuthChange={() => { setProfile(loadProfile()); setAuthTick(t=>t+1); }} onOpenSettings={() => setShowSettings(true)} />` under the header. Reference `authTick` in a comment to avoid unused-var (or use it as a `key` on a wrapper).
  - When `showSettings`: render `<MyCards profile={profile} onChange={(p) => { setProfile(p); if (isLoggedIn()) saveProfile(p).catch(()=>{}); setShowSettings(false); }} />` and return early.
  - In the `category` view: render `<AmountInput value={amount} onChange={setAmount} />`; if logged in, a checkbox "Chỉ thẻ của tôi" bound to `onlyOwned`.
  - Change the `rankCards` call to: `rankCards(view.categoryId, cards, { spendTier: tier, merchant: view.merchant, userPicks: isLoggedIn() ? profile.picks : undefined, amount: amount ? Number(amount) : undefined, onlyOwned, ownedCards: profile.owned_cards })`.
  - Use `profile.default_spend_tier` to initialize `tier` when a profile loads (optional; keep DEFAULT_TIER if simpler).
  Keep all v1 behavior for logged-out users (userPicks undefined → best-achievable).

- [ ] **Step 6: Append styles** to `src/styles.css`:
```css
.account-bar { display:flex; gap:8px; align-items:center; font-size:13px; margin:8px 0; flex-wrap:wrap; }
.account-bar button { background:var(--card); border:1px solid #2a2f3a; color:var(--fg); border-radius:8px; padding:6px 10px; }
.amount-input { display:flex; flex-direction:column; gap:4px; font-size:13px; color:var(--muted); margin:10px 0; }
.amount-input input { padding:10px; border-radius:8px; background:var(--card); color:var(--fg); border:1px solid #2a2f3a; font-size:15px; }
```

- [ ] **Step 7: Run → PASS.** `npx vitest run tests/appV2.test.tsx` then `npm test` (ALL green — logged-out tests still pass; the login button uses pb but the OAuth call only fires on click). `npm run build`. `npx tsc -b --noEmit` clean.
  - Note: tests run without a backend; `isLoggedIn()` is false in jsdom (empty authStore) → app shows login + anonymous ranking. That's the tested path.

- [ ] **Step 8: Commit** `git add src/components/AccountBar.tsx src/components/AmountInput.tsx src/App.tsx src/styles.css tests/appV2.test.tsx && git commit -m "feat(ui): login, personalization toggle, amount input wired into ranking"`

---

## Task 6: Deploy runbook + access-rule note + env

**Files:** Create `docs/RUNBOOK-deploy-lagomlab.md`; Modify `CLAUDE.md`

- [ ] **Step 1: Create `docs/RUNBOOK-deploy-lagomlab.md`** (for the lagomlab Claude — deploy PocketBase to card.lagomlab.tech):
```markdown
# Runbook — Deploy credit-cashback v2 backend on lagomlab.tech

Backend = PocketBase (single binary + SQLite). Domain: **card.lagomlab.tech** (Cloudflare).

## 1. Run PocketBase
- `cd backend && docker compose up -d` (or run the binary with `--migrationsDir=./pb_migrations`).
- Migrations in `backend/pb_migrations/` auto-apply on start (adds users.owned_cards/picks/default_spend_tier + owner-only rules).
- Data persists in `backend/pb_data/` — **back up this dir** (cp/tar) for backup; single SQLite file tree.

## 2. Cloudflare + TLS
- Point `card.lagomlab.tech` → the PocketBase port (8090) via the existing Cloudflare tunnel (add an ingress hostname → http://localhost:8090). PocketBase serves the API + admin at that host.

## 3. First-run admin + Google OAuth (secrets — NOT in git)
- Open `https://card.lagomlab.tech/_/` → create the superuser admin (store creds in the secret manager).
- Admin → Settings → Auth providers → enable **Google ONLY** (disable others). Paste Google **Client ID + Secret**.
- In Google Cloud console, the OAuth client's Authorized redirect URI must include:
  `https://card.lagomlab.tech/api/oauth2-redirect`
  (and `http://localhost:8090/api/oauth2-redirect` for dev).
- Users collection: confirm password auth disabled (OAuth-only) for production.

## 4. Frontend
- The GitHub Pages frontend must be built with `VITE_PB_URL=https://card.lagomlab.tech`.
  Update the Pages build (repo secret/variable `VITE_PB_URL`) or the workflow env, then re-deploy.
- CORS: PocketBase allows the Pages origin by default via its API; if blocked, add the Pages origin.

## 5. Verify
- `curl -sf https://card.lagomlab.tech/api/health` → 200.
- Log in with Google from the app → set "Thẻ của tôi" → confirm ranking personalizes; confirm a second account cannot read the first's record (owner-only rule).
```

- [ ] **Step 2: Update project `CLAUDE.md`** — append under Status:
```markdown
## v2 (accounts + amount-aware) — built on dev, awaiting lagomlab deploy
- Backend: PocketBase (`backend/`, SQLite). Frontend integrates via `src/lib/pb.ts` (`VITE_PB_URL`).
- Personalized + amount-aware ranking live in `src/lib/ranking.ts`. Logged-out = v1 behavior.
- Deploy to `card.lagomlab.tech`: see `docs/RUNBOOK-deploy-lagomlab.md` (lagomlab Claude, after Quân approves dev test).
- Needs: Google OAuth client (redirect `https://card.lagomlab.tech/api/oauth2-redirect`), `VITE_PB_URL` prod env.
```

- [ ] **Step 3: Full suite + build** — `npm test` (all green), `npm run build`. Commit + push:
```bash
git add docs/RUNBOOK-deploy-lagomlab.md CLAUDE.md
git commit -m "docs: v2 deploy runbook for card.lagomlab.tech + status"
git push origin <branch>
```

---

## Self-Review (plan author)

**Spec coverage:** §3 data model→T2 migration; §4 ranking (userPicks+amount)→T1; §5 frontend (login/settings/ranking/amount)→T3,T4,T5; §6 build-test-handoff→T2 smoke + T6 runbook; §7 external prep→T6 runbook; §9 amount-in-core→T1. All covered.

**Placeholder scan:** No TBD; complete code/commands each step. `git push origin <branch>` substituted by controller. Backend smoke honestly allows "document if download blocked" rather than faking.

**Type consistency:** `UserPicks`/`Profile`/`estimatedCashback` defined T1, consumed by pb.ts (T3), MyCards (T4), App (T5). `effectiveRate`/`rankCards` opts (`userPicks, amount, onlyOwned, ownedCards`) consistent T1↔T5. `profileFromRecord`/`saveProfile`/`loadProfile`/`loginWithGoogle` signatures consistent T3↔T4↔T5. PICK_GROUPS group ids (flex/mam1/mam2) match cards.json rate.group values.
```
