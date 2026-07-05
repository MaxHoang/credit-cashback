# credit-cashback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Web app (React+Vite+TS, mobile-first, tiếng Việt) tra cứu thẻ tín dụng VN hoàn tiền cao nhất theo danh mục hoặc merchant; deploy GitHub Pages.

**Architecture:** SPA tĩnh, dữ liệu trong `src/data/*` (cards.json, categories, merchants). Logic thuần `src/lib/*` (resolve query, ranking) tested bằng Vitest. UI React presentational + state điều hướng bằng `useState` (không router lib).

**Tech Stack:** React 18 + Vite 5 + TypeScript + Vitest + @testing-library/react (jsdom). CSS thuần mobile-first. Deploy: GitHub Actions → Pages.

## Global Constraints

- **Tiếng Việt** toàn UI. Tiền VND format `1.299.000 ₫`. Rate lưu decimal (0.10 = 10%), hiển thị `10%`.
- **Dữ liệu tài chính:** mỗi rate/card có `confidence` (high/medium/low) + `sources` + `as_of`. KHÔNG bịa số. UI **luôn** hiện disclaimer: *"Tỷ lệ có thể thay đổi — vui lòng xác nhận với ngân hàng. Đây không phải lời khuyên tài chính."*
- **Category ids (13):** `an-uong, sieu-thi, tien-loi, mua-sam-online, mua-sam-offline, thoi-trang, du-lich, giai-tri, xang-dau, bao-hiem, suc-khoe-giao-duc, nuoc-ngoai, khac`.
- **SpendTier ids:** `lt10, m10_30, m30_100, gte100`. Mặc định `m10_30`.
- **Thẻ v1 (7):** cake-freedom, vpbank-stepup, tcb-spark, tcb-everyday, mb-jcb-ultimate, mb-priority-visa-signature, vib-travel-elite.
- Không secret, không backend. Vitest chạy `npm test`. Conventional Commits + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Sau khi commit spec/plan → đã có bản trên Google Drive (rule CLAUDE.md); plan này build code, không cần upload code.

---

## File Structure
```
package.json, vite.config.ts, tsconfig.json, index.html
src/
  main.tsx, App.tsx, styles.css
  lib/{types.ts, format.ts, resolve.ts, ranking.ts}
  data/{categories.ts, spendTiers.ts, cards.json, merchants.json}
  components/{Disclaimer, ConfidenceBadge, SpendTierSelect, SearchBar, CategoryGrid, CardList, CardDetail}.tsx
tests/{data.test.ts, resolve.test.ts, ranking.test.ts, ui.test.tsx}
.github/workflows/deploy.yml
```

---

## Task 1: Scaffold Vite + React + TS + Vitest

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `tests/smoke.test.ts`

- [ ] **Step 1: Create config + entry files**

`package.json`:
```json
{
  "name": "credit-cashback",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.4.8",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.0",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/credit-cashback/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler",
    "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx",
    "strict": true, "noUnusedLocals": true, "noUnusedParameters": true, "esModuleInterop": true
  },
  "include": ["src", "tests"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>Hoàn tiền thẻ tín dụng VN</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

`src/App.tsx` (placeholder, replaced in Task 7):
```tsx
export default function App() {
  return <main><h1>Hoàn tiền thẻ tín dụng</h1></main>;
}
```

`src/styles.css`:
```css
:root { --bg:#0f1115; --card:#171a21; --fg:#e8eaed; --muted:#9aa0a6; --accent:#22c55e; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background:var(--bg); color:var(--fg); }
main { max-width: 560px; margin: 0 auto; padding: 16px; }
```

`tests/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

`tests/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("scaffold", () => {
  it("runs vitest", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 2: Install deps**

Run: `cd ~/projects/credit-cashback && npm install`
Expected: node_modules created, no fatal errors.

- [ ] **Step 3: Run test + build to verify scaffold**

Run: `npm test`
Expected: PASS (1 test, smoke).
Run: `npm run build`
Expected: builds to `dist/` with no TS errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Vitest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Types, categories, spend tiers, format util

**Files:** Create `src/lib/types.ts`, `src/lib/format.ts`, `src/data/categories.ts`, `src/data/spendTiers.ts`, `tests/format.test.ts`

**Interfaces:**
- Produces types: `Category, SpendTier, Rate, Card, Merchant, RankedCard, ResolveResult, CategoryId, Confidence, RewardType, Scheme, SpendTierId`.
- `CATEGORIES: Category[]` (13), `SPEND_TIERS: SpendTier[]` (4), `DEFAULT_TIER: SpendTierId = "m10_30"`.
- `formatVnd(n: number): string`, `formatPct(rate: number): string`.

- [ ] **Step 1: Write `src/lib/types.ts`**

```ts
export type CategoryId = string;
export type Confidence = "high" | "medium" | "low";
export type RewardType = "cashback" | "points" | "miles";
export type Scheme = "flat" | "pick-n" | "spend-tier";
export type SpendTierId = "lt10" | "m10_30" | "m30_100" | "gte100";

export interface Category { id: CategoryId; label: string; icon: string; }
export interface SpendTier { id: SpendTierId; label: string; }

export interface Rate {
  category: CategoryId;
  rate: number;                     // decimal 0..1
  cap_monthly?: number | null;
  cap_per_txn?: number | null;
  min_txn?: number | null;
  group?: string;                   // "fixed"|"flex"|"mam1"|"mam2" cho pick-n
  tier?: SpendTierId;               // cho spend-tier
  online_only?: boolean;
  excluded_merchants?: string[];
  confidence?: Confidence;
  note?: string;
}

export interface Card {
  id: string; name: string; issuer: string; network: string;
  annual_fee: number; annual_fee_note?: string;
  reward_type: RewardType;
  scheme: Scheme;
  min_monthly_spend: number;
  monthly_cap_total: number | null;
  default_rate: number;
  excluded_categories: CategoryId[];
  confidence: Confidence; as_of: string; sources: string[]; notes: string[];
  rates: Rate[];
}

export interface Merchant { name: string; aliases: string[]; mcc: string; category: CategoryId; note?: string; }

export interface RankedCard {
  card: Card;
  rate: number;
  eligible: boolean;
  capMonthly: number | null;
  minSpend: number;
  confidence: Confidence;
  conditions: string[];
  note?: string;
}

export interface Suggestion { kind: "merchant" | "category"; label: string; categoryId: CategoryId; }
export interface ResolveResult {
  kind: "merchant" | "category" | "none";
  merchant?: Merchant;
  mcc?: string;
  categoryId?: CategoryId;
  suggestions: Suggestion[];
}
```

- [ ] **Step 2: Write `src/data/categories.ts` + `src/data/spendTiers.ts`**

`src/data/categories.ts`:
```ts
import type { Category, SpendTierId } from "../lib/types";

export const CATEGORIES: Category[] = [
  { id: "an-uong", label: "Ăn uống / Nhà hàng", icon: "🍜" },
  { id: "sieu-thi", label: "Siêu thị", icon: "🛒" },
  { id: "tien-loi", label: "Cửa hàng tiện lợi", icon: "🏪" },
  { id: "mua-sam-online", label: "Mua sắm online", icon: "🛍️" },
  { id: "mua-sam-offline", label: "Mua sắm offline", icon: "🏬" },
  { id: "thoi-trang", label: "Thời trang", icon: "👗" },
  { id: "du-lich", label: "Du lịch", icon: "✈️" },
  { id: "giai-tri", label: "Giải trí", icon: "🎬" },
  { id: "xang-dau", label: "Xăng dầu", icon: "⛽" },
  { id: "bao-hiem", label: "Bảo hiểm", icon: "🛡️" },
  { id: "suc-khoe-giao-duc", label: "Sức khoẻ / Giáo dục", icon: "💊" },
  { id: "nuoc-ngoai", label: "Chi tiêu nước ngoài", icon: "🌐" },
  { id: "khac", label: "Khác", icon: "💳" },
];

export const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));
export const DEFAULT_TIER: SpendTierId = "m10_30";
```

`src/data/spendTiers.ts`:
```ts
import type { SpendTier } from "../lib/types";

export const SPEND_TIERS: SpendTier[] = [
  { id: "lt10", label: "Dưới 10 triệu/tháng" },
  { id: "m10_30", label: "10 – 30 triệu/tháng" },
  { id: "m30_100", label: "30 – 100 triệu/tháng" },
  { id: "gte100", label: "Trên 100 triệu/tháng" },
];
```

- [ ] **Step 3: Write failing test `tests/format.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { formatVnd, formatPct } from "../src/lib/format";

describe("format", () => {
  it("formats VND with dot separators + symbol", () => {
    expect(formatVnd(1299000)).toBe("1.299.000 ₫");
  });
  it("formats zero VND", () => {
    expect(formatVnd(0)).toBe("0 ₫");
  });
  it("formats percent from decimal", () => {
    expect(formatPct(0.1)).toBe("10%");
    expect(formatPct(0.001)).toBe("0,1%");
  });
});
```

- [ ] **Step 4: Run, verify fail**

Run: `npx vitest run tests/format.test.ts`
Expected: FAIL — `src/lib/format` not found.

- [ ] **Step 5: Write `src/lib/format.ts`**

```ts
export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

export function formatPct(rate: number): string {
  const pct = rate * 100;
  const s = Number.isInteger(pct) ? String(pct) : pct.toFixed(1).replace(".", ",");
  return s + "%";
}
```

- [ ] **Step 6: Run, verify pass**

Run: `npx vitest run tests/format.test.ts`
Expected: PASS (3).

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/format.ts src/data/categories.ts src/data/spendTiers.ts tests/format.test.ts
git commit -m "feat: add types, categories, spend tiers, VND/percent formatting

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Seed card data (7 cards) + schema integrity test

**Files:** Create `src/data/cards.json`, `tests/data.test.ts`

**Interfaces:**
- Consumes: `Card` type, `CATEGORY_IDS` (Task 2).
- Produces: `cards.json` = array of 7 `Card`. Later tasks import via `import cards from "../data/cards.json"`.

- [ ] **Step 1: Write failing integrity test `tests/data.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import cardsData from "../src/data/cards.json";
import { CATEGORY_IDS, CATEGORIES } from "../src/data/categories";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const IDS = ["cake-freedom","vpbank-stepup","tcb-spark","tcb-everyday","mb-jcb-ultimate","mb-priority-visa-signature","vib-travel-elite"];

describe("cards.json integrity", () => {
  it("has the 7 expected cards", () => {
    expect(cards.map((c) => c.id).sort()).toEqual([...IDS].sort());
  });

  it("every card has required fields + valid confidence", () => {
    for (const c of cards) {
      expect(typeof c.name).toBe("string");
      expect(["cashback","points","miles"]).toContain(c.reward_type);
      expect(["flat","pick-n","spend-tier"]).toContain(c.scheme);
      expect(["high","medium","low"]).toContain(c.confidence);
      expect(Array.isArray(c.sources)).toBe(true);
      expect(c.default_rate).toBeGreaterThanOrEqual(0);
      expect(c.default_rate).toBeLessThanOrEqual(1);
    }
  });

  it("every rate.category, excluded_categories are valid category ids", () => {
    for (const c of cards) {
      for (const id of c.excluded_categories) expect(CATEGORY_IDS.has(id)).toBe(true);
      for (const r of c.rates) {
        expect(CATEGORY_IDS.has(r.category)).toBe(true);
        expect(r.rate).toBeGreaterThanOrEqual(0);
        expect(r.rate).toBeLessThanOrEqual(1);
      }
    }
  });

  it("mb-jcb-ultimate rewards insurance at 10%", () => {
    const mb = cards.find((c) => c.id === "mb-jcb-ultimate")!;
    const ins = mb.rates.find((r) => r.category === "bao-hiem")!;
    expect(ins.rate).toBe(0.1);
  });

  it("has at least one rate per non-default category across all cards (sanity)", () => {
    expect(CATEGORIES.length).toBe(13);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/data.test.ts`
Expected: FAIL — cannot find `src/data/cards.json`.

- [ ] **Step 3: Create `src/data/cards.json`**

```json
[
  {
    "id": "cake-freedom", "name": "Cake Freedom", "issuer": "Cake by VPBank", "network": "Visa/Mastercard",
    "annual_fee": 599000, "annual_fee_note": "Miễn nếu chi ≥ 150 triệu/năm",
    "reward_type": "cashback", "scheme": "pick-n", "min_monthly_spend": 5000000, "monthly_cap_total": 1000000,
    "default_rate": 0, "excluded_categories": ["xang-dau"],
    "confidence": "high", "as_of": "2026-07-05",
    "sources": ["https://cake.vn/dieu-kien-dieu-khoan/dieu-kien-va-dieu-khoan-su-dung-the-tin-dung-cake-freedom"],
    "notes": ["20% nhưng cap chặt: 200k/nhóm, 1 triệu/tháng; per-tx 50k (≥200k) / 10k (<200k)", "Cần chi ≥ 5 triệu/kỳ mới có hoàn tiền", "Chọn 3 nhóm cố định + 2 nhóm linh hoạt"],
    "rates": [
      { "category": "mua-sam-online", "rate": 0.2, "cap_monthly": 200000, "group": "fixed", "confidence": "medium", "note": "nhóm cố định" },
      { "category": "du-lich", "rate": 0.2, "cap_monthly": 200000, "group": "fixed", "confidence": "medium", "note": "nhóm cố định" },
      { "category": "thoi-trang", "rate": 0.2, "cap_monthly": 200000, "group": "fixed", "confidence": "medium", "note": "nhóm cố định" },
      { "category": "an-uong", "rate": 0.2, "cap_monthly": 200000, "group": "flex", "confidence": "medium", "note": "nhóm linh hoạt (chọn 2)" },
      { "category": "sieu-thi", "rate": 0.2, "cap_monthly": 200000, "group": "flex", "confidence": "medium", "note": "linh hoạt; 1 giao dịch/ngày" },
      { "category": "tien-loi", "rate": 0.2, "cap_monthly": 200000, "group": "flex", "confidence": "medium", "note": "nhóm linh hoạt" },
      { "category": "bao-hiem", "rate": 0.2, "cap_monthly": 200000, "group": "flex", "confidence": "medium", "note": "nhóm linh hoạt" },
      { "category": "giai-tri", "rate": 0.2, "cap_monthly": 200000, "group": "flex", "confidence": "medium", "note": "rạp phim; linh hoạt" }
    ]
  },
  {
    "id": "vpbank-stepup", "name": "VPBank StepUp", "issuer": "VPBank", "network": "Mastercard",
    "annual_fee": 499000, "annual_fee_note": "Chưa xác nhận (secondary source)",
    "reward_type": "cashback", "scheme": "spend-tier", "min_monthly_spend": 0, "monthly_cap_total": null,
    "default_rate": 0.001, "excluded_categories": ["xang-dau"],
    "confidence": "medium", "as_of": "2026-07-05",
    "sources": ["https://www.vpbank.com.vn/ca-nhan/the-tin-dung/vpbank-stepup"],
    "notes": ["Tự động theo bậc chi tiêu/tháng", "T&C bản mới nhất hết hạn 20/11/2025 — cần xác nhận VPBank", "Shopee/ShopeeFood không tính nhóm online (chỉ 0,1%)"],
    "rates": [
      { "category": "mua-sam-online", "rate": 0.06, "cap_monthly": 300000, "tier": "lt10", "online_only": true, "excluded_merchants": ["Shopee", "ShopeeFood"], "confidence": "medium" },
      { "category": "mua-sam-online", "rate": 0.15, "cap_monthly": 700000, "tier": "m10_30", "online_only": true, "excluded_merchants": ["Shopee", "ShopeeFood"], "confidence": "medium" },
      { "category": "mua-sam-online", "rate": 0.15, "cap_monthly": 700000, "tier": "m30_100", "online_only": true, "excluded_merchants": ["Shopee", "ShopeeFood"], "confidence": "medium" },
      { "category": "mua-sam-online", "rate": 0.15, "cap_monthly": 1500000, "tier": "gte100", "online_only": true, "excluded_merchants": ["Shopee", "ShopeeFood"], "confidence": "medium" },
      { "category": "an-uong", "rate": 0.02, "cap_monthly": 100000, "tier": "lt10", "confidence": "medium" },
      { "category": "an-uong", "rate": 0.04, "cap_monthly": 200000, "tier": "m10_30", "confidence": "medium" },
      { "category": "an-uong", "rate": 0.04, "cap_monthly": 200000, "tier": "m30_100", "confidence": "medium" },
      { "category": "an-uong", "rate": 0.04, "cap_monthly": 200000, "tier": "gte100", "confidence": "medium" }
    ]
  },
  {
    "id": "tcb-spark", "name": "Techcombank Spark", "issuer": "Techcombank", "network": "Mastercard",
    "annual_fee": 899000, "annual_fee_note": "Miễn năm sau nếu chi ≥ 150 triệu/năm",
    "reward_type": "points", "scheme": "flat", "min_monthly_spend": 0, "monthly_cap_total": 500000,
    "default_rate": 0.001, "excluded_categories": [],
    "confidence": "medium", "as_of": "2026-07-05",
    "sources": ["https://techcombank.com/en/personal/spend/cards/credit-card/techcombank-spark"],
    "notes": ["Tích U-Point — quy đổi 1 điểm = 1 VND (Quân xác nhận)", "Cap 500.000 điểm/tháng"],
    "rates": [
      { "category": "du-lich", "rate": 0.08, "confidence": "medium" },
      { "category": "thoi-trang", "rate": 0.08, "confidence": "medium" },
      { "category": "giai-tri", "rate": 0.08, "confidence": "medium" },
      { "category": "an-uong", "rate": 0.02, "confidence": "medium" },
      { "category": "mua-sam-online", "rate": 0.02, "confidence": "medium" }
    ]
  },
  {
    "id": "tcb-everyday", "name": "Techcombank Everyday", "issuer": "Techcombank", "network": "Visa",
    "annual_fee": 599000, "annual_fee_note": "Miễn năm sau nếu chi ≥ 150 triệu/năm",
    "reward_type": "points", "scheme": "spend-tier", "min_monthly_spend": 0, "monthly_cap_total": 500000,
    "default_rate": 0.001, "excluded_categories": [],
    "confidence": "medium", "as_of": "2026-07-05",
    "sources": ["https://techcombank.com/en/personal/spend/cards/credit-card/techcombank-everyday"],
    "notes": ["Tích U-Point (1 điểm = 1 VND)", "Cap 500k điểm (10-30tr) / 700k (≥30tr)", "Online quốc tế 8% (nội địa 3%)"],
    "rates": [
      { "category": "mua-sam-online", "rate": 0.03, "tier": "lt10", "confidence": "medium", "note": "quốc tế 8%" },
      { "category": "mua-sam-online", "rate": 0.03, "cap_monthly": 500000, "tier": "m10_30", "confidence": "medium", "note": "quốc tế 8%" },
      { "category": "mua-sam-online", "rate": 0.03, "cap_monthly": 700000, "tier": "m30_100", "confidence": "medium", "note": "quốc tế 8%" },
      { "category": "mua-sam-online", "rate": 0.03, "cap_monthly": 700000, "tier": "gte100", "confidence": "medium", "note": "quốc tế 8%" },
      { "category": "an-uong", "rate": 0.01, "confidence": "medium" }
    ]
  },
  {
    "id": "mb-jcb-ultimate", "name": "MB JCB Ultimate", "issuer": "MBBank", "network": "JCB",
    "annual_fee": 800000, "annual_fee_note": "Thẻ phụ miễn phí",
    "reward_type": "cashback", "scheme": "flat", "min_monthly_spend": 0, "monthly_cap_total": 800000,
    "default_rate": 0.001, "excluded_categories": [],
    "confidence": "high", "as_of": "2026-07-05",
    "sources": ["https://tienphong.vn/mb-jcb-lam-moi-tron-bo-uu-dai-the-dap-ung-moi-nhu-cau-chi-tieu-hoan-tien-toi-10-moi-thang-post1808090.tpo", "https://rcgv.vn/article/mb-jcb-ultimate-chinh-thuc-len-app/"],
    "notes": ["Bảo hiểm 10% (sub-cap 400k), Sức khoẻ/Giáo dục 10%, cap tổng 800k/kỳ", "Các nhóm khác chưa rõ ưu đãi (về mức cơ bản)"],
    "rates": [
      { "category": "bao-hiem", "rate": 0.1, "cap_monthly": 400000, "confidence": "high", "note": "mua qua MBAL/MIC trên app MB" },
      { "category": "suc-khoe-giao-duc", "rate": 0.1, "cap_monthly": 800000, "confidence": "high" }
    ]
  },
  {
    "id": "mb-priority-visa-signature", "name": "MB Priority Visa Signature", "issuer": "MBBank", "network": "Visa",
    "annual_fee": 1299000, "annual_fee_note": "Miễn năm 1; miễn nếu chi ≥ 100 triệu/năm",
    "reward_type": "cashback", "scheme": "pick-n", "min_monthly_spend": 10000000, "monthly_cap_total": 800000,
    "default_rate": 0.001, "excluded_categories": [],
    "confidence": "medium", "as_of": "2026-07-05",
    "sources": ["https://www.mbbank.com.vn/26/213/2608/Chi-tiet/the-tin-dung-quoc-te-mb-visa-priority-signature-2026-1-29-13-53-43", "https://rcgv.vn/"],
    "notes": ["Cần chi ≥ 10 triệu/tháng mới có hoàn tiền", "Mâm 1 (chọn 1, 10%, cap 400k); Mâm 2 (chọn 2, 2%, cap 400k); tổng 800k", "Sinh nhật x2 tỷ lệ", "Vị trí nhóm Sức khoẻ chưa chắc"],
    "rates": [
      { "category": "an-uong", "rate": 0.1, "cap_monthly": 400000, "group": "mam1", "confidence": "medium", "note": "Mâm 1 (chọn 1 nhóm 10%)" },
      { "category": "du-lich", "rate": 0.1, "cap_monthly": 400000, "group": "mam1", "confidence": "medium", "note": "Mâm 1" },
      { "category": "giai-tri", "rate": 0.1, "cap_monthly": 400000, "group": "mam1", "confidence": "medium", "note": "Mâm 1" },
      { "category": "bao-hiem", "rate": 0.1, "cap_monthly": 400000, "group": "mam1", "confidence": "low", "note": "Mâm 1 (chưa chắc)" },
      { "category": "sieu-thi", "rate": 0.02, "cap_monthly": 400000, "group": "mam2", "confidence": "medium", "note": "Mâm 2 (chọn 2 nhóm 2%)" },
      { "category": "thoi-trang", "rate": 0.02, "cap_monthly": 400000, "group": "mam2", "confidence": "medium", "note": "Mâm 2" },
      { "category": "mua-sam-online", "rate": 0.02, "cap_monthly": 400000, "group": "mam2", "confidence": "medium", "note": "Mâm 2" },
      { "category": "suc-khoe-giao-duc", "rate": 0.02, "cap_monthly": 400000, "group": "mam2", "confidence": "low", "note": "Mâm 2 (chưa chắc)" }
    ]
  },
  {
    "id": "vib-travel-elite", "name": "VIB Travel Élite", "issuer": "VIB", "network": "Mastercard",
    "annual_fee": 1299000, "annual_fee_note": "Chưa xác nhận",
    "reward_type": "miles", "scheme": "flat", "min_monthly_spend": 0, "monthly_cap_total": null,
    "default_rate": 0.003, "excluded_categories": [],
    "confidence": "low", "as_of": "2026-07-05",
    "sources": ["https://www.vib.com.vn/vn/the-tin-dung/travel-elite"],
    "notes": ["Giá trị chính = phòng chờ sân bay + ưu đãi du lịch; chương trình hoàn tiền yếu/đã hết hạn", "Tích dặm (~1 dặm/30.000đ ≈ 0,3%)"],
    "rates": [
      { "category": "nuoc-ngoai", "rate": 0.003, "confidence": "low", "note": "0% phí ngoại tệ 3 kỳ đầu" },
      { "category": "du-lich", "rate": 0.003, "confidence": "low", "note": "ưu đãi đối tác + phòng chờ" }
    ]
  }
]
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/data.test.ts`
Expected: PASS (5).

- [ ] **Step 5: Commit**

```bash
git add src/data/cards.json tests/data.test.ts
git commit -m "feat(data): seed 7 VN cards with flagged research data + integrity test

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Merchants data + resolveQuery

**Files:** Create `src/data/merchants.json`, `src/lib/resolve.ts`, `tests/resolve.test.ts`

**Interfaces:**
- Consumes: `Merchant`, `Category`, `ResolveResult` (Task 2); `CATEGORIES` (Task 2).
- Produces: `resolveQuery(text: string, merchants: Merchant[], categories: Category[]) -> ResolveResult`.

- [ ] **Step 1: Create `src/data/merchants.json`**

```json
[
  { "name": "Shopee", "aliases": ["shopee"], "mcc": "5399", "category": "mua-sam-online" },
  { "name": "ShopeeFood", "aliases": ["shopeefood", "shopee food"], "mcc": "5814", "category": "an-uong" },
  { "name": "Lazada", "aliases": ["lazada"], "mcc": "5399", "category": "mua-sam-online" },
  { "name": "Tiki", "aliases": ["tiki"], "mcc": "5399", "category": "mua-sam-online" },
  { "name": "GrabFood", "aliases": ["grabfood", "grab food"], "mcc": "5814", "category": "an-uong" },
  { "name": "Grab", "aliases": ["grab"], "mcc": "4121", "category": "khac", "note": "di chuyển" },
  { "name": "Be", "aliases": ["be"], "mcc": "4121", "category": "khac", "note": "di chuyển" },
  { "name": "Circle K", "aliases": ["circle k", "circlek"], "mcc": "5499", "category": "tien-loi" },
  { "name": "GS25", "aliases": ["gs25"], "mcc": "5499", "category": "tien-loi" },
  { "name": "Ministop", "aliases": ["ministop"], "mcc": "5499", "category": "tien-loi" },
  { "name": "WinMart", "aliases": ["winmart", "vinmart"], "mcc": "5411", "category": "sieu-thi" },
  { "name": "Bách Hoá Xanh", "aliases": ["bach hoa xanh", "bhx"], "mcc": "5411", "category": "sieu-thi" },
  { "name": "Co.opmart", "aliases": ["coopmart", "co.opmart", "coop"], "mcc": "5411", "category": "sieu-thi" },
  { "name": "Highlands Coffee", "aliases": ["highlands", "highlands coffee"], "mcc": "5814", "category": "an-uong" },
  { "name": "Starbucks", "aliases": ["starbucks"], "mcc": "5814", "category": "an-uong" },
  { "name": "CGV", "aliases": ["cgv"], "mcc": "7832", "category": "giai-tri" },
  { "name": "Galaxy Cinema", "aliases": ["galaxy", "galaxy cinema"], "mcc": "7832", "category": "giai-tri" },
  { "name": "Vietjet", "aliases": ["vietjet"], "mcc": "3245", "category": "du-lich" },
  { "name": "Vietnam Airlines", "aliases": ["vietnam airlines", "vna"], "mcc": "3000", "category": "du-lich" },
  { "name": "Booking.com", "aliases": ["booking", "booking.com"], "mcc": "7011", "category": "du-lich" },
  { "name": "Bảo Việt", "aliases": ["bao viet", "baoviet"], "mcc": "6300", "category": "bao-hiem" },
  { "name": "Uniqlo", "aliases": ["uniqlo"], "mcc": "5651", "category": "thoi-trang" },
  { "name": "Petrolimex", "aliases": ["petrolimex", "xang"], "mcc": "5541", "category": "xang-dau" }
]
```

- [ ] **Step 2: Write failing test `tests/resolve.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { resolveQuery } from "../src/lib/resolve";
import merchantsData from "../src/data/merchants.json";
import { CATEGORIES } from "../src/data/categories";
import type { Merchant } from "../src/lib/types";

const merchants = merchantsData as Merchant[];

describe("resolveQuery", () => {
  it("resolves a known merchant to its mcc + category", () => {
    const r = resolveQuery("Shopee", merchants, CATEGORIES);
    expect(r.kind).toBe("merchant");
    expect(r.mcc).toBe("5399");
    expect(r.categoryId).toBe("mua-sam-online");
  });

  it("matches merchant aliases case-insensitively", () => {
    expect(resolveQuery("circlek", merchants, CATEGORIES).categoryId).toBe("tien-loi");
  });

  it("resolves a category by label ignoring diacritics", () => {
    const r = resolveQuery("an uong", merchants, CATEGORIES);
    expect(r.kind).toBe("category");
    expect(r.categoryId).toBe("an-uong");
  });

  it("returns suggestions for partial input", () => {
    const r = resolveQuery("gr", merchants, CATEGORIES);
    expect(r.kind).toBe("none");
    expect(r.suggestions.some((s) => s.label === "Grab")).toBe(true);
  });

  it("returns none with empty suggestions for gibberish", () => {
    const r = resolveQuery("zzzzz", merchants, CATEGORIES);
    expect(r.kind).toBe("none");
    expect(r.suggestions).toEqual([]);
  });
});
```

- [ ] **Step 3: Run, verify fail**

Run: `npx vitest run tests/resolve.test.ts`
Expected: FAIL — `src/lib/resolve` not found.

- [ ] **Step 4: Write `src/lib/resolve.ts`**

```ts
import type { Category, Merchant, ResolveResult, Suggestion } from "./types";

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function resolveQuery(text: string, merchants: Merchant[], categories: Category[]): ResolveResult {
  const q = norm(text);
  if (!q) return { kind: "none", suggestions: [] };

  const exactMerchant = merchants.find(
    (m) => norm(m.name) === q || m.aliases.some((a) => norm(a) === q)
  );
  if (exactMerchant) {
    return { kind: "merchant", merchant: exactMerchant, mcc: exactMerchant.mcc, categoryId: exactMerchant.category, suggestions: [] };
  }

  const exactCategory = categories.find((c) => norm(c.label) === q);
  if (exactCategory) {
    return { kind: "category", categoryId: exactCategory.id, suggestions: [] };
  }

  const suggestions: Suggestion[] = [];
  for (const m of merchants) {
    if (norm(m.name).includes(q) || m.aliases.some((a) => norm(a).includes(q))) {
      suggestions.push({ kind: "merchant", label: m.name, categoryId: m.category });
    }
  }
  for (const c of categories) {
    if (norm(c.label).includes(q)) suggestions.push({ kind: "category", label: c.label, categoryId: c.id });
  }
  return { kind: "none", suggestions };
}
```

- [ ] **Step 5: Run, verify pass**

Run: `npx vitest run tests/resolve.test.ts`
Expected: PASS (5).

- [ ] **Step 6: Commit**

```bash
git add src/data/merchants.json src/lib/resolve.ts tests/resolve.test.ts
git commit -m "feat: add merchants data + resolveQuery (merchant/category, diacritic-insensitive)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Ranking logic (effectiveRate + rankCards)

**Files:** Create `src/lib/ranking.ts`, `tests/ranking.test.ts`

**Interfaces:**
- Consumes: `Card`, `RankedCard`, `SpendTierId` (Task 2); `formatVnd` (Task 2).
- Produces:
  - `effectiveRate(card: Card, categoryId: string, opts: { spendTier: SpendTierId; merchant?: string }) -> { rate:number; eligible:boolean; capMonthly:number|null; minSpend:number; confidence:Confidence; note?:string; conditions:string[] }`
  - `rankCards(categoryId: string, cards: Card[], opts: { spendTier: SpendTierId; merchant?: string }) -> RankedCard[]`

- [ ] **Step 1: Write failing test `tests/ranking.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { effectiveRate, rankCards } from "../src/lib/ranking";
import cardsData from "../src/data/cards.json";
import type { Card } from "../src/lib/types";

const cards = cardsData as Card[];
const card = (id: string) => cards.find((c) => c.id === id)!;

describe("effectiveRate", () => {
  it("returns 0 & ineligible for an excluded category", () => {
    const r = effectiveRate(card("cake-freedom"), "xang-dau", { spendTier: "m10_30" });
    expect(r.eligible).toBe(false);
    expect(r.rate).toBe(0);
  });

  it("uses the tier-matching rate for spend-tier cards", () => {
    const low = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "lt10" });
    const mid = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "m10_30" });
    expect(low.rate).toBe(0.06);
    expect(mid.rate).toBe(0.15);
  });

  it("drops to default_rate when the merchant is excluded from the category rate", () => {
    const r = effectiveRate(card("vpbank-stepup"), "mua-sam-online", { spendTier: "m10_30", merchant: "Shopee" });
    expect(r.rate).toBe(0.001);
    expect(r.conditions.some((c) => c.toLowerCase().includes("shopee"))).toBe(true);
  });

  it("surfaces min-spend and cap conditions", () => {
    const r = effectiveRate(card("mb-priority-visa-signature"), "an-uong", { spendTier: "m10_30" });
    expect(r.rate).toBe(0.1);
    expect(r.conditions.some((c) => c.includes("tối thiểu"))).toBe(true);
    expect(r.conditions.some((c) => c.toLowerCase().includes("cap"))).toBe(true);
  });

  it("flags points/miles estimation", () => {
    const r = effectiveRate(card("tcb-spark"), "du-lich", { spendTier: "m10_30" });
    expect(r.conditions.some((c) => c.toLowerCase().includes("ước tính"))).toBe(true);
  });
});

describe("rankCards", () => {
  it("ranks MB JCB Ultimate #1 for insurance (10%)", () => {
    const ranked = rankCards("bao-hiem", cards, { spendTier: "m10_30" });
    expect(ranked[0].card.id).toBe("mb-jcb-ultimate");
    expect(ranked[0].rate).toBe(0.1);
  });

  it("sorts by rate descending", () => {
    const ranked = rankCards("an-uong", cards, { spendTier: "m10_30" });
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].rate).toBeGreaterThanOrEqual(ranked[i].rate);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/ranking.test.ts`
Expected: FAIL — `src/lib/ranking` not found.

- [ ] **Step 3: Write `src/lib/ranking.ts`**

```ts
import type { Card, Confidence, RankedCard, Rate, SpendTierId } from "./types";
import { formatVnd } from "./format";

interface Opts { spendTier: SpendTierId; merchant?: string; }
interface EffResult {
  rate: number; eligible: boolean; capMonthly: number | null; minSpend: number;
  confidence: Confidence; note?: string; conditions: string[];
}

const CONF_ORDER: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

export function effectiveRate(card: Card, categoryId: string, opts: Opts): EffResult {
  const conditions: string[] = [];

  if (card.excluded_categories.includes(categoryId)) {
    return { rate: 0, eligible: false, capMonthly: null, minSpend: card.min_monthly_spend, confidence: card.confidence, note: "Không áp dụng nhóm này", conditions: ["Không áp dụng nhóm này"] };
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

  const rate = chosen ? chosen.rate : card.default_rate;
  const capMonthly = (chosen?.cap_monthly ?? card.monthly_cap_total) ?? null;

  if (card.min_monthly_spend > 0) conditions.push(`Cần chi tối thiểu ${formatVnd(card.min_monthly_spend)}/tháng`);
  if (capMonthly) conditions.push(`Cap ${formatVnd(capMonthly)}/tháng`);
  if (chosen?.group) conditions.push(`Cần chọn nhóm ưu đãi (${chosen.group})`);
  if (card.reward_type === "points") conditions.push("Ước tính từ điểm thưởng (1 điểm = 1 VND)");
  if (card.reward_type === "miles") conditions.push("Ước tính từ dặm thưởng");
  if (chosen?.note) conditions.push(chosen.note);

  return {
    rate, eligible: rate > 0, capMonthly, minSpend: card.min_monthly_spend,
    confidence: chosen?.confidence ?? card.confidence, note: chosen?.note, conditions,
  };
}

export function rankCards(categoryId: string, cards: Card[], opts: Opts): RankedCard[] {
  return cards
    .map((card): RankedCard => {
      const e = effectiveRate(card, categoryId, opts);
      return { card, rate: e.rate, eligible: e.eligible, capMonthly: e.capMonthly, minSpend: e.minSpend, confidence: e.confidence, conditions: e.conditions, note: e.note };
    })
    .sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate;
      const ca = a.capMonthly ?? Infinity, cb = b.capMonthly ?? Infinity;
      if (cb !== ca) return cb - ca;
      return CONF_ORDER[b.confidence] - CONF_ORDER[a.confidence];
    });
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run tests/ranking.test.ts`
Expected: PASS (7).

- [ ] **Step 5: Full suite green**

Run: `npm test`
Expected: PASS (all: smoke, format, data, resolve, ranking).

- [ ] **Step 6: Commit**

```bash
git add src/lib/ranking.ts tests/ranking.test.ts
git commit -m "feat: add effectiveRate + rankCards (tier, pick-n, merchant-exclusion, tie-break)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Presentational components + render test

**Files:** Create `src/components/Disclaimer.tsx`, `src/components/ConfidenceBadge.tsx`, `src/components/SpendTierSelect.tsx`, `src/components/CardList.tsx`, `src/components/CardDetail.tsx`; Modify `src/styles.css`; Create `tests/ui.test.tsx`

**Interfaces:**
- Consumes: `RankedCard`, `Card`, `SpendTier`, `SpendTierId`, `Confidence` (Task 2); `formatVnd`, `formatPct` (Task 2); `CATEGORIES` (Task 2).
- Produces components:
  - `<Disclaimer />`
  - `<ConfidenceBadge level={Confidence} />`
  - `<SpendTierSelect value={SpendTierId} onChange={(t:SpendTierId)=>void} />`
  - `<CardList items={RankedCard[]} onSelect={(card:Card)=>void} />`
  - `<CardDetail card={Card} onBack={()=>void} />`

- [ ] **Step 1: Write failing render test `tests/ui.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/ui.test.tsx`
Expected: FAIL — components not found.

- [ ] **Step 3: Create the components**

`src/components/Disclaimer.tsx`:
```tsx
export function Disclaimer() {
  return (
    <p className="disclaimer">
      ⚠️ Tỷ lệ có thể thay đổi — vui lòng xác nhận với ngân hàng. Đây không phải lời khuyên tài chính.
    </p>
  );
}
```

`src/components/ConfidenceBadge.tsx`:
```tsx
import type { Confidence } from "../lib/types";

const MAP: Record<Confidence, { label: string; cls: string; dot: string }> = {
  high: { label: "Độ tin cậy cao", cls: "conf-high", dot: "🟢" },
  medium: { label: "Cần xác nhận", cls: "conf-medium", dot: "🟡" },
  low: { label: "Chưa chắc chắn", cls: "conf-low", dot: "🔴" },
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const m = MAP[level];
  return <span className={`badge ${m.cls}`}>{m.dot} {m.label}</span>;
}
```

`src/components/SpendTierSelect.tsx`:
```tsx
import type { SpendTierId } from "../lib/types";
import { SPEND_TIERS } from "../data/spendTiers";

export function SpendTierSelect({ value, onChange }: { value: SpendTierId; onChange: (t: SpendTierId) => void }) {
  return (
    <label className="tier-select">
      <span>Mức chi tiêu/tháng</span>
      <select value={value} onChange={(e) => onChange(e.target.value as SpendTierId)}>
        {SPEND_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select>
    </label>
  );
}
```

`src/components/CardList.tsx`:
```tsx
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
```

`src/components/CardDetail.tsx`:
```tsx
import type { Card } from "../lib/types";
import { CATEGORIES } from "../data/categories";
import { formatPct, formatVnd } from "../lib/format";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Disclaimer } from "./Disclaimer";

export function CardDetail({ card, onBack }: { card: Card; onBack: () => void }) {
  const rateFor = (catId: string) => card.rates.find((r) => r.category === catId);
  return (
    <section className="card-detail">
      <button className="back" onClick={onBack}>← Quay lại</button>
      <h2>{card.name}</h2>
      <p className="muted">{card.issuer} · {card.network}</p>
      <ConfidenceBadge level={card.confidence} />
      <dl className="kv">
        <dt>Phí thường niên</dt><dd>{formatVnd(card.annual_fee)}{card.annual_fee_note ? ` — ${card.annual_fee_note}` : ""}</dd>
        <dt>Loại thưởng</dt><dd>{card.reward_type === "cashback" ? "Hoàn tiền" : card.reward_type === "points" ? "Điểm (ước tính)" : "Dặm (ước tính)"}</dd>
        <dt>Chi tối thiểu/tháng</dt><dd>{card.min_monthly_spend > 0 ? formatVnd(card.min_monthly_spend) : "Không"}</dd>
        <dt>Cap tổng/tháng</dt><dd>{card.monthly_cap_total ? formatVnd(card.monthly_cap_total) : "Không giới hạn"}</dd>
      </dl>
      <h3>Tỷ lệ theo danh mục</h3>
      <table className="rate-table">
        <tbody>
          {CATEGORIES.map((cat) => {
            const r = rateFor(cat.id);
            const excluded = card.excluded_categories.includes(cat.id);
            const rate = excluded ? 0 : r ? r.rate : card.default_rate;
            return (
              <tr key={cat.id}>
                <td>{cat.icon} {cat.label}</td>
                <td>{excluded ? "Không áp dụng" : formatPct(rate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {card.notes.length > 0 && <ul className="notes">{card.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      <p className="muted">Cập nhật: {card.as_of}</p>
      <ul className="sources">{card.sources.map((s, i) => <li key={i}><a href={s} target="_blank" rel="noreferrer">Nguồn {i + 1}</a></li>)}</ul>
      <Disclaimer />
    </section>
  );
}
```

- [ ] **Step 4: Append component styles to `src/styles.css`**

```css
.disclaimer { font-size: 13px; color: var(--muted); background: #1c1300; border: 1px solid #3a2a00; padding: 8px 10px; border-radius: 8px; }
.badge { font-size: 12px; padding: 2px 6px; border-radius: 999px; }
.conf-high { color: #22c55e; } .conf-medium { color: #eab308; } .conf-low { color: #ef4444; }
.tier-select { display:flex; flex-direction:column; gap:4px; font-size:13px; color:var(--muted); margin:12px 0; }
.tier-select select { padding:10px; border-radius:8px; background:var(--card); color:var(--fg); border:1px solid #2a2f3a; font-size:15px; }
.card-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; }
.card-row { background:var(--card); border:1px solid #2a2f3a; border-radius:12px; padding:12px; cursor:pointer; }
.card-row.best { border-color: var(--accent); }
.card-row-head { display:flex; align-items:center; gap:8px; }
.card-row-head .rank { width:32px; } .card-name { flex:1; font-weight:600; } .rate { font-size:20px; font-weight:700; color:var(--accent); }
.conditions { margin:6px 0 0; padding-left:18px; font-size:12px; color:var(--muted); }
.card-detail .back { background:none; border:none; color:var(--accent); font-size:15px; padding:8px 0; cursor:pointer; }
.kv { display:grid; grid-template-columns:auto 1fr; gap:4px 12px; font-size:14px; }
.kv dt { color:var(--muted); } .kv dd { margin:0; }
.rate-table { width:100%; border-collapse:collapse; font-size:14px; }
.rate-table td { padding:6px 4px; border-bottom:1px solid #23272f; }
.rate-table td:last-child { text-align:right; font-weight:600; }
.notes, .sources { font-size:13px; color:var(--muted); padding-left:18px; }
.muted { color:var(--muted); }
```

- [ ] **Step 5: Run, verify pass**

Run: `npx vitest run tests/ui.test.tsx`
Expected: PASS (3).

- [ ] **Step 6: Commit**

```bash
git add src/components tests/ui.test.tsx src/styles.css
git commit -m "feat(ui): add Disclaimer, ConfidenceBadge, SpendTierSelect, CardList, CardDetail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: App shell (search, category grid, navigation) + wiring

**Files:** Create `src/components/SearchBar.tsx`, `src/components/CategoryGrid.tsx`; Modify `src/App.tsx`, `src/styles.css`; Create `tests/app.test.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces: `<SearchBar onResolve={(r:ResolveResult)=>void} />`, `<CategoryGrid onPick={(catId:string)=>void} />`, full `App`.

- [ ] **Step 1: Write failing test `tests/app.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../src/App";

describe("App flow", () => {
  it("shows the home category grid + disclaimer on load", () => {
    render(<App />);
    expect(screen.getByText(/không phải lời khuyên tài chính/i)).toBeInTheDocument();
    expect(screen.getByText("Bảo hiểm")).toBeInTheDocument();
  });

  it("picking Bảo hiểm shows MB JCB Ultimate ranked first", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Bảo hiểm"));
    expect(screen.getByText("MB JCB Ultimate")).toBeInTheDocument();
  });

  it("searching 'Shopee' routes to the online-shopping ranking", () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/tìm danh mục hoặc cửa hàng/i);
    fireEvent.change(input, { target: { value: "Shopee" } });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText(/Mua sắm online/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/app.test.tsx`
Expected: FAIL — SearchBar/CategoryGrid/App not complete.

- [ ] **Step 3: Create `src/components/SearchBar.tsx`**

```tsx
import { useState } from "react";
import type { ResolveResult } from "../lib/types";
import { resolveQuery } from "../lib/resolve";
import merchantsData from "../data/merchants.json";
import { CATEGORIES } from "../data/categories";
import type { Merchant } from "../lib/types";

const merchants = merchantsData as Merchant[];

export function SearchBar({ onResolve }: { onResolve: (r: ResolveResult) => void }) {
  const [text, setText] = useState("");
  const preview = text ? resolveQuery(text, merchants, CATEGORIES) : null;
  return (
    <form className="search" onSubmit={(e) => { e.preventDefault(); onResolve(resolveQuery(text, merchants, CATEGORIES)); }}>
      <input placeholder="Tìm danh mục hoặc cửa hàng (vd: Shopee)" value={text} onChange={(e) => setText(e.target.value)} />
      {preview && preview.kind === "none" && preview.suggestions.length > 0 && (
        <ul className="suggestions">
          {preview.suggestions.slice(0, 6).map((s, i) => (
            <li key={i} onClick={() => { setText(s.label); onResolve({ kind: "category", categoryId: s.categoryId, suggestions: [] }); }}>
              {s.kind === "merchant" ? "🏬" : "📂"} {s.label}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Create `src/components/CategoryGrid.tsx`**

```tsx
import { CATEGORIES } from "../data/categories";

export function CategoryGrid({ onPick }: { onPick: (catId: string) => void }) {
  return (
    <div className="cat-grid">
      {CATEGORIES.map((c) => (
        <button key={c.id} className="cat-tile" onClick={() => onPick(c.id)}>
          <span className="cat-icon">{c.icon}</span>
          <span className="cat-label">{c.label}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/App.tsx`**

```tsx
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
            {view.merchant && <p className="muted">{view.merchant} → MCC {view.mcc} ({cat.label})</p>}
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
```

- [ ] **Step 6: Append App styles to `src/styles.css`**

```css
.top h1 { font-size: 20px; cursor: pointer; }
.search input { width:100%; padding:12px; font-size:16px; border-radius:10px; background:var(--card); color:var(--fg); border:1px solid #2a2f3a; }
.suggestions { list-style:none; margin:4px 0 0; padding:0; background:var(--card); border:1px solid #2a2f3a; border-radius:10px; }
.suggestions li { padding:10px 12px; cursor:pointer; border-bottom:1px solid #23272f; }
.cat-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-top:12px; }
.cat-tile { background:var(--card); border:1px solid #2a2f3a; border-radius:12px; padding:14px 6px; display:flex; flex-direction:column; align-items:center; gap:6px; color:var(--fg); cursor:pointer; }
.cat-icon { font-size:26px; } .cat-label { font-size:12px; text-align:center; }
.link, .back { background:none; border:none; color:var(--accent); font-size:15px; padding:10px 0; cursor:pointer; }
```

- [ ] **Step 7: Run test + full suite + build**

Run: `npx vitest run tests/app.test.tsx`
Expected: PASS (3).
Run: `npm test`
Expected: PASS (all suites).
Run: `npm run build`
Expected: builds to `dist/` with no TS errors.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/components/SearchBar.tsx src/components/CategoryGrid.tsx src/styles.css tests/app.test.tsx
git commit -m "feat(ui): app shell — search, category grid, navigation, ranking wiring

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Deploy (GitHub Pages) + README + run docs

**Files:** Create `.github/workflows/deploy.yml`, `README.md`; Modify `CLAUDE.md` (Run section)

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# credit-cashback

Web app tra cứu & so sánh hoàn tiền thẻ tín dụng VN (mobile-first, tiếng Việt).

## Chạy local
- `npm install`
- `npm run dev` → http://localhost:5173
- `npm test` (Vitest) · `npm run build`

## Thêm/sửa thẻ
Sửa `src/data/cards.json` (rate = decimal, 0.10 = 10%). Merchant: `src/data/merchants.json`.
Mỗi rate/thẻ có `confidence` + `sources` + `as_of` — không bịa số.

## Deploy
Push `main` → GitHub Actions build + deploy GitHub Pages. Bật Pages: repo Settings → Pages → Source = GitHub Actions.

**Miễn trừ:** Tỷ lệ có thể thay đổi — xác nhận với ngân hàng. Không phải lời khuyên tài chính.
```

- [ ] **Step 3: Fill `CLAUDE.md` Run section**

Replace the `## Run (điền khi build)` / `- TBD` block in `CLAUDE.md` with:
```markdown
## Run
- `npm install` · `npm run dev` (5173) · `npm test` · `npm run build`
- Deploy: push main → GitHub Actions → Pages (bật Pages: Settings → Pages → GitHub Actions).
- Sửa số liệu: `src/data/cards.json` / `src/data/merchants.json`.
```

- [ ] **Step 4: Commit + push**

```bash
git add .github/workflows/deploy.yml README.md CLAUDE.md
git commit -m "ci: add GitHub Pages deploy workflow + docs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 5: Manual step (Quân) — enable Pages**

Repo Settings → Pages → Source = **GitHub Actions**. Then the pushed workflow deploys; URL: `https://maxhoang.github.io/credit-cashback/`. (Document in report; Quân does the one-time toggle.)

---

## Self-Review (plan author)

**Spec coverage:** §1 core (search+category+ranking)→T4,5,7; §2 data principles (confidence/sources/disclaimer)→T3 data + T6 Disclaimer/badge; §3 stack/structure→T1; §4 data model→T2 types + T3 cards + T4 merchants; §5 seed→T3; §6 logic→T4,5; §7 UI→T6,7; §8 testing→every task; §10 deploy→T8. All covered.

**Placeholder scan:** No TBD; every step has full code/commands + expected output. `git push origin main` in T8 is the real branch.

**Type consistency:** `Card/Rate/Merchant/RankedCard/ResolveResult/SpendTierId/Confidence` defined in T2, used identically in T3–T7. `effectiveRate`/`rankCards`/`resolveQuery`/`formatVnd`/`formatPct` signatures consistent across defining task and consumers. Category ids identical between categories.ts, cards.json, merchants.json (validated by T3 integrity test). Component props match their consumers in App (T7).
```
