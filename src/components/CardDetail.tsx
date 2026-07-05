import type { Card } from "../lib/types";
import { CATEGORIES } from "../data/categories";
import { formatPct, formatVnd } from "../lib/format";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { Disclaimer } from "./Disclaimer";

export function CardDetail({ card, onBack }: { card: Card; onBack: () => void }) {
  const rateCellFor = (catId: string, excluded: boolean, defaultRate: number) => {
    if (excluded) return "Không áp dụng";
    const rows = card.rates.filter((r) => r.category === catId);
    if (card.scheme === "spend-tier" && rows.length) {
      const rates = rows.map((r) => r.rate);
      const caps = rows.map((r) => r.cap_monthly).filter((c): c is number => c != null);
      const min = Math.min(...rates), max = Math.max(...rates);
      const rateText = min === max ? formatPct(min) : `${formatPct(min)} – ${formatPct(max)}`;
      if (!caps.length) return `${rateText} (theo mức chi tiêu/tháng)`;
      const capMin = Math.min(...caps), capMax = Math.max(...caps);
      const capText = capMin === capMax ? formatVnd(capMin) : `${formatVnd(capMin)}–${formatVnd(capMax)}`;
      return `${rateText} (cap ${capText}, theo chi tiêu/tháng)`;
    }
    const r = rows[0];
    return formatPct(r ? r.rate : defaultRate);
  };
  return (
    <section className="card-detail">
      <button className="back" onClick={onBack}>← Quay lại</button>
      <h2>{card.name}</h2>
      <p className="muted">{card.issuer} · {card.network}</p>
      <ConfidenceBadge level={card.confidence} />
      <dl className="kv">
        <dt>Phí thường niên</dt><dd>{formatVnd(card.annual_fee)}{card.annual_fee_note ? ` — ${card.annual_fee_note}` : ""}</dd>
        <dt>Loại thưởng</dt><dd>{card.reward_type === "cashback" ? "Hoàn tiền" : card.reward_type === "points" ? "Điểm (ước tính)" : "Dặm (ước tính)"}</dd>
        <dt>Chi tối thiểu/tháng</dt><dd>{card.min_monthly_spend > 0 ? formatVnd(card.min_monthly_spend) : "Không"}</dd>
        <dt>Cap tổng/tháng</dt><dd>{card.monthly_cap_total ? formatVnd(card.monthly_cap_total) : "Không giới hạn"}</dd>
      </dl>
      <h3>Tỷ lệ theo danh mục</h3>
      <table className="rate-table">
        <tbody>
          {CATEGORIES.map((cat) => {
            const excluded = card.excluded_categories.includes(cat.id);
            return (
              <tr key={cat.id}>
                <td>{cat.icon} {cat.label}</td>
                <td>{rateCellFor(cat.id, excluded, card.default_rate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {card.notes.length > 0 && <ul className="notes">{card.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      <p className="muted">Cập nhật: {card.as_of}</p>
      <ul className="sources">{card.sources.map((s, i) => <li key={i}><a href={s} target="_blank" rel="noreferrer">Nguồn {i + 1}</a></li>)}</ul>
      <Disclaimer />
    </section>
  );
}
