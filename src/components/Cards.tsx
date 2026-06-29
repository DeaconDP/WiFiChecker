import type { ConnectivitySnapshot } from '../utils/network'
import { formatLatency, latencyQuality } from '../utils/network'

interface StatusCardProps {
  connectivity: ConnectivitySnapshot
}

function connectionLabel(type: ConnectivitySnapshot['connectionType']): string {
  switch (type) {
    case 'wifi':
      return 'Wi‑Fi'
    case 'cellular':
      return 'Cellular'
    case 'ethernet':
      return 'Ethernet'
    default:
      return 'Unknown'
  }
}

export function StatusCard({ connectivity }: StatusCardProps) {
  const { online, connectionType, effectiveType, downlinkMbps, rttMs, saveData } = connectivity

  return (
    <section className="card status-card" aria-live="polite">
      <div className="card-header">
        <h2>Connection</h2>
        <span className={`pill ${online ? 'pill-good' : 'pill-bad'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="status-grid">
        <div className="metric">
          <span className="metric-label">Type</span>
          <strong>{connectionLabel(connectionType)}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Effective</span>
          <strong>{effectiveType ?? '—'}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Downlink</span>
          <strong>{downlinkMbps != null ? `${downlinkMbps} Mbps` : '—'}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Est. RTT</span>
          <strong>{formatLatency(rttMs)}</strong>
        </div>
        <div className="metric">
          <span className="metric-label">Data saver</span>
          <strong>{saveData == null ? '—' : saveData ? 'On' : 'Off'}</strong>
        </div>
      </div>

      <p className="hint">
        Browser APIs cannot read Wi‑Fi SSID or signal strength. This card shows what the device exposes to web apps.
      </p>
    </section>
  )
}

interface LatencyCardProps {
  running: boolean
  results: ReturnType<typeof import('../hooks/useLatencyTest').useLatencyTest>['results']
  lastRunAt: Date | null
  onRun: () => void
}

export function LatencyCard({ running, results, lastRunAt, onRun }: LatencyCardProps) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Latency</h2>
        <button className="button" onClick={onRun} disabled={running}>
          {running ? 'Testing…' : 'Run test'}
        </button>
      </div>

      {results.length === 0 ? (
        <p className="empty-state">Tap run to measure round-trip time to common endpoints.</p>
      ) : (
        <ul className="latency-list">
          {results.map((result) => {
            const quality = latencyQuality(result.latencyMs)
            return (
              <li key={result.probeId} className="latency-item">
                <div>
                  <strong>{result.label}</strong>
                  {!result.reachable && <span className="error-text">{result.error}</span>}
                </div>
                <span className={`pill pill-${quality}`}>
                  {result.reachable ? formatLatency(result.latencyMs) : 'Unreachable'}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {lastRunAt && (
        <p className="hint">Last run {lastRunAt.toLocaleTimeString()}</p>
      )}
    </section>
  )
}

interface InstallPromptProps {
  visible: boolean
  onInstall: () => void
  onDismiss: () => void
}

export function InstallPrompt({ visible, onInstall, onDismiss }: InstallPromptProps) {
  if (!visible) return null

  return (
    <section className="install-banner" role="region" aria-label="Install app">
      <div>
        <strong>Install WiFiChecker</strong>
        <p>Add to your home screen for quick access like a native app.</p>
      </div>
      <div className="install-actions">
        <button className="button button-primary" onClick={onInstall}>
          Install
        </button>
        <button className="button button-ghost" onClick={onDismiss}>
          Not now
        </button>
      </div>
    </section>
  )
}
