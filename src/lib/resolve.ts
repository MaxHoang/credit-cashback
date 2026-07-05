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

  const exactCategory = categories.find((c) =>
    c.label.split("/").some((part) => norm(part) === q)
  );
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
