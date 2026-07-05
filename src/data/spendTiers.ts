import type { SpendTier } from "../lib/types";

export const SPEND_TIERS: SpendTier[] = [
  { id: "lt10", label: "Dưới 10 triệu/tháng" },
  { id: "m10_30", label: "10 – 30 triệu/tháng" },
  { id: "m30_100", label: "30 – 100 triệu/tháng" },
  { id: "gte100", label: "Trên 100 triệu/tháng" },
];
