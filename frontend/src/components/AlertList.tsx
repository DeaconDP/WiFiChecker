import type { Alert } from "../types";
import { acknowledgeAlert } from "../api";

interface Props {
  alerts: Alert[];
  onAcknowledge?: () => void;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AlertList({ alerts, onAcknowledge }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-symbol">◇</div>
        <p>No alerts yet. Spectra is learning your network baseline.</p>
        <p style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Alerts appear after ~20 seconds of monitoring once baselines form.
        </p>
      </div>
    );
  }

  const handleAck = async (id: string) => {
    await acknowledgeAlert(id);
    onAcknowledge?.();
  };

  return (
    <div className="alert-list">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`alert-card ${a.severity} ${a.acknowledged ? "acknowledged" : ""}`}
          style={a.acknowledged ? { opacity: 0.5 } : undefined}
        >
          <div className="alert-header">
            <span className="alert-title">{a.title}</span>
            <span className="alert-time">{formatTime(a.created_at)}</span>
          </div>
          <p className="alert-message">{a.message}</p>
          <div className="alert-explanation">{a.explanation}</div>
          {!a.acknowledged && (
            <div className="alert-actions">
              <button className="btn btn-ack" onClick={() => handleAck(a.id)}>
                ✓ Acknowledge
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
