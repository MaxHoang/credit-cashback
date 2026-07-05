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
