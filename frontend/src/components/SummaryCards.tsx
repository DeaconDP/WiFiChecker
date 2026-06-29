import type { NetworkSummary } from "../types";
import { formatRate } from "../api";

interface Props {
  summary: NetworkSummary | null;
}

export default function SummaryCards({ summary }: Props) {
  const s = summary ?? {
    total_devices: 0,
    active_devices: 0,
    total_rate_sent: 0,
    total_rate_recv: 0,
    alert_count: 0,
    critical_alert_count: 0,
    monitoring_since: null,
  };

  return (
    <div className="card-grid">
      <div className="stat-card">
        <div className="stat-symbol">◎</div>
        <div className="stat-label">Devices</div>
        <div className="stat-value">{s.active_devices}</div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">↓</div>
        <div className="stat-label">Download</div>
        <div className="stat-value">{formatRate(s.total_rate_recv)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">↑</div>
        <div className="stat-label">Upload</div>
        <div className="stat-value">{formatRate(s.total_rate_sent)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">△</div>
        <div className="stat-label">Alerts</div>
        <div
          className={`stat-value ${s.critical_alert_count > 0 ? "critical" : ""}`}
        >
          {s.alert_count}
          {s.critical_alert_count > 0 && (
            <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem" }}>
              ({s.critical_alert_count} critical)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
