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
