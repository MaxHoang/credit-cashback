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

  // "flex" pick-n groups are an open pool (e.g. chọn 2 trong 5) — không thể giả định
  // danh mục đang tra cứu nằm trong nhóm đã thực sự chọn, nên không cộng dồn rate.
  // "fixed"/"mam*" là toàn bộ cơ chế thưởng của thẻ nên vẫn giả định đã chọn.
  if (chosen && card.scheme === "pick-n" && chosen.group === "flex") {
    conditions.push(`Cần chọn nhóm linh hoạt này để nhận ${chosen.rate * 100}% (mặc định về mức cơ bản)`);
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
