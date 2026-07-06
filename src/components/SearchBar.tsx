import { useState, useEffect } from "react";
import type { Merchant, ResolveResult, Suggestion } from "../lib/types";
import { resolveQuery } from "../lib/resolve";
import merchantsData from "../data/merchants.json";
import { CATEGORIES } from "../data/categories";
import { searchMerchants, merchantsToSuggestions } from "../lib/pb";

const merchants = merchantsData as Merchant[];

export function SearchBar({ onResolve }: { onResolve: (r: ResolveResult) => void }) {
  const [text, setText] = useState("");
  const [backend, setBackend] = useState<Merchant[]>([]);

  const local = text ? resolveQuery(text, merchants, CATEGORIES) : null;
  const noLocalMatch = !local || local.kind === "none";

  // Long-tail fallback: only query the 53k backend when the curated data has no
  // exact merchant/category match. Debounced; stale responses are discarded.
  useEffect(() => {
    if (!text || !noLocalMatch) { setBackend([]); return; }
    let alive = true;
    const term = text;
    const t = setTimeout(() => {
      searchMerchants(term).then((found) => { if (alive) setBackend(found); });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [text, noLocalMatch]);

  const localSug: Suggestion[] = local && local.kind === "none" ? local.suggestions : [];
  const seen = new Set(localSug.map((s) => s.label.toLowerCase()));
  const merged: Suggestion[] = [
    ...localSug,
    ...merchantsToSuggestions(backend).filter((s) => !seen.has(s.label.toLowerCase())),
  ].slice(0, 8);

  function resolveMerchant(m: Merchant) {
    setText(m.name);
    onResolve({ kind: "merchant", merchant: m, mcc: m.mcc, categoryId: m.category, suggestions: [] });
  }

  function pickSuggestion(s: Suggestion) {
    const bm = backend.find((m) => m.name === s.label);
    if (bm) { resolveMerchant(bm); return; }
    setText(s.label);
    onResolve({ kind: "category", categoryId: s.categoryId, suggestions: [] });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = resolveQuery(text, merchants, CATEGORIES);
    if (r.kind !== "none") { onResolve(r); return; }
    if (backend.length) { resolveMerchant(backend[0]); return; }
    onResolve(r);
  }

  return (
    <form className="search" onSubmit={submit}>
      <input placeholder="Tìm danh mục hoặc cửa hàng (vd: Shopee)" value={text} onChange={(e) => setText(e.target.value)} />
      {text && noLocalMatch && merged.length > 0 && (
        <ul className="suggestions">
          {merged.map((s, i) => (
            <li key={i} onClick={() => pickSuggestion(s)}>
              {s.kind === "merchant" ? "🏬" : "📂"} {s.label}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
