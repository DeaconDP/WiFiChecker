import type { ConnectivitySnapshot } from "../utils/network";
import {
  connectionLabel,
  formatLatency,
  latencyQuality,
  type LatencyResult,
} from "../utils/network";

interface StatusCardProps {
  connectivity: ConnectivitySnapshot;
}

export function StatusCard({ connectivity }: StatusCardProps) {
  const { online, connectionType, effectiveType, downlinkMbps, rttMs, saveData } = connectivity;

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">▲ CLIENT CONNECTION</span>
        <span className={`status-badge ${online ? "active" : "planned"}`}>
          {online ? "Online" : "Offline"}
        </span>
      </div>
      <div className="panel-body health-metrics">
        <div className="health-metric">
          <span className="health-metric-label">Type</span>
          <strong>{connectionLabel(connectionType)}</strong>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Effective</span>
          <strong>{effectiveType ?? "—"}</strong>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Downlink</span>
          <strong>{downlinkMbps != null ? `${downlinkMbps} Mbps` : "—"}</strong>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Est. RTT</span>
          <strong>{formatLatency(rttMs)}</strong>
        </div>
        <div className="health-metric">
          <span className="health-metric-label">Data saver</span>
          <strong>{saveData == null ? "—" : saveData ? "On" : "Off"}</strong>
        </div>
      </div>
      <p className="health-hint">
        Browser APIs cannot read Wi‑Fi SSID or signal strength. This shows what your device exposes to web apps.
      </p>
    </div>
  );
}

interface LatencyCardProps {
  running: boolean;
  results: LatencyResult[];
  lastRunAt: Date | null;
  onRun: () => void;
}

export function LatencyCard({ running, results, lastRunAt, onRun }: LatencyCardProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">▲ LATENCY PROBES</span>
        <button className="btn-primary" onClick={onRun} disabled={running}>
          {running ? "Testing…" : "Run test"}
        </button>
      </div>
      <div className="panel-body">
        {results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-symbol">▲</div>
            Run a latency suite against Google, Cloudflare, and this app.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Latency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const quality = latencyQuality(result.latencyMs);
                  return (
                    <tr key={result.probeId}>
                      <td>{result.label}</td>
                      <td className={`latency-${quality}`}>
                        {result.reachable ? formatLatency(result.latencyMs) : "—"}
                      </td>
                      <td>
                        {result.reachable ? (
                          <span className={`status-badge ${quality === "good" ? "active" : quality === "fair" ? "partial" : "planned"}`}>
                            {quality}
                          </span>
                        ) : (
                          <span className="status-badge planned" title={result.error}>
                            Unreachable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {lastRunAt && (
          <p className="health-hint">Last run {lastRunAt.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
}

interface HealthSummaryProps {
  connectivity: ConnectivitySnapshot;
  backendLive: boolean;
}

export function HealthSummary({ connectivity, backendLive }: HealthSummaryProps) {
  return (
    <div className="card-grid health-summary">
      <div className="stat-card">
        <div className="stat-symbol">▲</div>
        <div className="stat-label">Client</div>
        <div className={`stat-value ${connectivity.online ? "" : "critical"}`}>
          {connectivity.online ? "Online" : "Offline"}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">◈</div>
        <div className="stat-label">Backend</div>
        <div className={`stat-value ${backendLive ? "" : "critical"}`}>
          {backendLive ? "Live" : "Offline"}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">↓</div>
        <div className="stat-label">Link</div>
        <div className="stat-value">{connectionLabel(connectivity.connectionType)}</div>
      </div>
      <div className="stat-card">
        <div className="stat-symbol">◎</div>
        <div className="stat-label">Est. RTT</div>
        <div className="stat-value">{formatLatency(connectivity.rttMs)}</div>
      </div>
    </div>
  );
}
