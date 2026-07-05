import type { Confidence } from "../lib/types";

const MAP: Record<Confidence, { label: string; cls: string; dot: string }> = {
  high: { label: "Độ tin cậy cao", cls: "conf-high", dot: "🟢" },
  medium: { label: "Cần xác nhận", cls: "conf-medium", dot: "🟡" },
  low: { label: "Chưa chắc chắn", cls: "conf-low", dot: "🔴" },
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const m = MAP[level];
  return <span className={`badge ${m.cls}`}>{m.dot} {m.label}</span>;
}
