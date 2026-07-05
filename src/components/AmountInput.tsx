export function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="amount-input">
      <span>Số tiền giao dịch (tuỳ chọn) — để so sánh chính xác theo cap</span>
      <input inputMode="numeric" placeholder="vd: 10000000 (số tiền)" value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} />
    </label>
  );
}
