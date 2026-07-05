export function formatVnd(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

export function formatPct(rate: number): string {
  const pct = rate * 100;
  const s = Number.isInteger(pct) ? String(pct) : pct.toFixed(1).replace(".", ",");
  return s + "%";
}
