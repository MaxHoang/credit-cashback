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
