export type CategoryId = string;
export type Confidence = "high" | "medium" | "low";
export type RewardType = "cashback" | "points" | "miles";
export type Scheme = "flat" | "pick-n" | "spend-tier";
export type SpendTierId = "lt10" | "m10_30" | "m30_100" | "gte100";

export interface Category { id: CategoryId; label: string; icon: string; }

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
  estimatedCashback?: number | null;
}

export interface UserPicks { [cardId: string]: { [group: string]: string | string[] }; }
export interface Profile { owned_cards: string[]; picks: UserPicks; }

export interface Suggestion { kind: "merchant" | "category"; label: string; categoryId: CategoryId; }
export interface ResolveResult {
  kind: "merchant" | "category" | "none";
  merchant?: Merchant;
  mcc?: string;
  categoryId?: CategoryId;
  suggestions: Suggestion[];
}
