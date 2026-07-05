import type { Card, Confidence, RankedCard, Rate, SpendTierId } from "./types";
import { formatVnd } from "./format";

interface Opts { spendTier: SpendTierId; merchant?: string; }
interface EffResult {
  rate: number; eligible: boolean; capMonthly: number | null; minSpend: number;
  confidence: Confidence; note?: string; conditions: string[];
}

const CONF_ORDER: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

// Philosophy (A) — best-achievable rate: fixed/flex/mam1/mam2 đều là "chọn N trong M"
// pick group, đều hiện rate tốt nhất có thể đạt, kèm điều kiện rõ ràng để không đánh lừa
// người dùng (trừ "fixed" — luôn bật, không có điều kiện chọn).
const PICK_CONDITION: Record<string, string> = {
  flex: "Chỉ đạt nếu bạn chọn nhóm này (nhóm linh hoạt — Cake chọn 2/5 nhóm)",
  mam1: "Chỉ đạt nếu bạn chọn nhóm này (Mâm 1 — chỉ chọn 1 nhóm/tháng)",
  mam2: "Chỉ đạt nếu bạn chọn nhóm này (Mâm 2 — chọn 2 nhóm/tháng)",
};

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
  if (chosen?.group && PICK_CONDITION[chosen.group]) conditions.push(PICK_CONDITION[chosen.group]);
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
