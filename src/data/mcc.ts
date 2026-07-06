import type { CategoryId } from "../lib/types";

// Canonical MCC → app-category map, grounded in ISO 18245 / Visa-Mastercard MCC
// definitions + verified VN bank T&C MCC lists. First-principles: card cashback is
// applied by the merchant's REAL registered MCC, not by a name guess.
//
// Only UNAMBIGUOUS MCCs are listed. Ambiguous ones (e.g. 5411 which is used by both
// supermarkets and convenience stores in VN, 5499, 5399, 5311) are intentionally
// omitted → mccToCategory returns null and the hand-curated / backend category wins,
// so this map corrects clear errors without regressing nuanced curation.
const MCC_CATEGORY: Record<string, CategoryId> = {};
const put = (cat: CategoryId, ...mccs: string[]) => mccs.forEach((m) => (MCC_CATEGORY[m] = cat));

// Transport / ride-hailing / travel — Grab, Be, Gojek, Uber = 4121
put("du-lich",
  "4011", "4111", "4112", "4121", "4131", "4411", "4457", "4468",
  "4511", "4582", "4722", "4784", "7011", "7012", "7032", "7033",
  "7512", "7513", "7519");

// Physical entertainment — cinema, arcades, attractions
put("giai-tri",
  "7829", "7832", "7841", "7911", "7922", "7929",
  "7932", "7933", "7941", "7991", "7992", "7993", "7994", "7996",
  "7997", "7998", "7999");

// Digital services / goods / streaming — Netflix 4899, Spotify/YouTube 5815, App
// Store & Google Play 5818, apps 5817. Kept as their own category because these
// MCCs usually fall OUTSIDE cards' e-commerce promo lists (banks pay by MCC).
put("dich-vu-so",
  "4816", "4899", "5734", "5735", "5815", "5816", "5817", "5818");

// Online marketplaces / direct marketing (e-commerce)
put("mua-sam-online",
  "5262", "5964", "5965", "5966", "5967", "5968", "5969");

// Stored-value / prepaid load → eWallet. NOTE: 8999 (professional services) is a
// generic catch-all used by Momo/ZaloPay in VN but also by thousands of unrelated
// merchants, so it is intentionally NOT auto-mapped — Momo/ZaloPay are handled by
// curated entries. Only the specific stored-value code is mapped here.
put("vi-dien-tu", "6540");

// Supermarket (grocery) vs convenience — MCC 5411 is grocery, 5499 misc/convenience
put("sieu-thi", "5411", "5412", "5422");
put("tien-loi", "5499");

// Dining
put("an-uong", "5811", "5812", "5813", "5814");

// Fuel
put("xang-dau", "5541", "5542", "5983");

// Fashion / apparel
put("thoi-trang",
  "5137", "5139", "5611", "5621", "5631", "5641", "5651", "5655",
  "5661", "5691", "5697", "5698", "5699", "5948");

// Health & education
put("suc-khoe-giao-duc",
  "4119", "5047", "5122", "5912", "5975", "5976",
  "8011", "8021", "8031", "8041", "8042", "8043", "8044", "8049",
  "8050", "8062", "8071", "8082", "8099",
  "7295", "8211", "8220", "8241", "8244", "8249", "8299", "8351");

// Insurance
put("bao-hiem", "5960", "6300");

export function mccToCategory(mcc: string | number | null | undefined): CategoryId | null {
  if (mcc == null) return null;
  const key = String(mcc).trim();
  return MCC_CATEGORY[key] ?? null;
}
