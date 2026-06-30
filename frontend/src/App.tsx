import { useEffect, useState } from "react";
import type { FeatureInfo, LivePayload } from "./types";
import { connectWebSocket, fetchFeatures } from "./api";
import { HealthSummary } from "./components/HealthCards";
import SummaryCards from "./components/SummaryCards";
import DeviceTable from "./components/DeviceTable";
import ProcessTable from "./components/ProcessTable";
import AlertList from "./components/AlertList";
import FeatureGrid from "./components/FeatureGrid";
import RoadmapPage from "./pages/RoadmapPage";
import SettingsPage from "./pages/SettingsPage";
import HealthPage from "./pages/HealthPage";
import { useConnectivity } from "./hooks/useConnectivity";

type Page =
  | "dashboard"
  | "health"
  | "devices"
  | "processes"
  | "alerts"
  | "features"
  | "roadmap"
  | "settings";

const NAV: { id: Page; symbol: string; label: string }[] = [
  { id: "dashboard", symbol: "◈", label: "Dashboard" },
  { id: "health", symbol: "▲", label: "Health" },
  { id: "devices", symbol: "◎", label: "Devices" },
  { id: "processes", symbol: "▣", label: "Processes" },
  { id: "alerts", symbol: "△", label: "Alerts" },
  { id: "settings", symbol: "⚙", label: "Settings" },
  { id: "features", symbol: "◇", label: "Features" },
  { id: "roadmap", symbol: "▤", label: "Roadmap" },
];

const PAGE_INFO: Record<Page, { title: string; subtitle: string }> = {
  dashboard: {
    title: "◈ NETWORK OVERVIEW",
    subtitle:
      "Unified snapshot — client connection health, LAN bandwidth, process activity, and active alerts.",
  },
  health: {
    title: "▲ CLIENT HEALTH",
    subtitle:
      "Connectivity, link quality, and latency probes. Works in the browser without a backend — installable as a PWA.",
  },
  devices: {
    title: "◎ DEVICE MONITOR",
    subtitle:
      "Every device on your network ranked by bandwidth consumption. High Greed Scores indicate bandwidth hogs.",
  },
  processes: {
    title: "▣ PROCESS MONITOR",
    subtitle:
      "Applications on this machine using network I/O. Executable paths are shown with a copy button. Requires local agent.",
  },
  alerts: {
    title: "△ ALERT FEED",
    subtitle:
      "Anomalies, greedy actors, and suspicious patterns. Each alert explains why it fired and what to check.",
  },
  features: {
    title: "◇ FEATURE GUIDE",
    subtitle:
      "What Spectra can do today, what's partial, and what's planned. No black boxes — every feature is explained.",
  },
  roadmap: {
    title: "▤ ROADMAP & EPICS",
    subtitle:
      "Development epics, suggestions, and planned capabilities. This file is the living product backlog.",
  },
  settings: {
    title: "⚙ SETTINGS",
    subtitle:
      "Tune alert sensitivity and view runtime configuration. Changes persist across restarts.",
  },
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<LivePayload | null>(null);
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const connectivity = useConnectivity();

  useEffect(() => {
    fetchFeatures().then(setFeatures).catch(() => {});
  }, []);

  useEffect(() => {
    const disconnect = connectWebSocket(
      (payload) => setData(payload),
      setConnected
    );
    return disconnect;
  }, [refreshKey]);

  const info = PAGE_INFO[page];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="app-logo">
            SPECTRA<span>.</span>
          </div>
          <div className="app-tagline">Network Traffic Intelligence</div>
        </div>
        <div className="header-status">
          <div className="status-pill">
            <span className={`status-dot ${connectivity.online ? "" : "offline"}`} />
            {connectivity.online ? "CLIENT" : "OFFLINE"}
          </div>
          <div className="status-pill">
            <span className={`status-dot ${connected ? "" : "offline"}`} />
            {connected ? "LAN LIVE" : "LAN OFF"}
          </div>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar" aria-label="Main navigation">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-symbol">{n.symbol}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <main className="main-content">
          <h1 className="page-title">{info.title}</h1>
          <p className="page-subtitle">{info.subtitle}</p>

          {page === "dashboard" && (
            <>
              <HealthSummary connectivity={connectivity} backendLive={connected} />
              {connected ? (
                <>
                  <SummaryCards summary={data?.summary ?? null} />
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">◎ TOP DEVICES BY GREED</span>
                    </div>
                    <div className="panel-body">
                      <DeviceTable devices={(data?.devices ?? []).slice(0, 5)} />
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header">
                      <span className="panel-title">△ RECENT ALERTS</span>
                    </div>
                    <div className="panel-body" style={{ padding: "1rem" }}>
                      <AlertList
                        alerts={(data?.alerts ?? []).slice(0, 3)}
                        onAcknowledge={() => setRefreshKey((k) => k + 1)}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="panel insight-panel">
                  <div className="panel-header">
                    <span className="panel-title">◈ START LAN MONITORING</span>
                  </div>
                  <div className="panel-body">
                    <p className="insight-text">
                      Client health is active. Double-click <strong>Spectra</strong> in the
                      project folder (or run <code>launch.py</code>) to start LAN monitoring
                      with greedy device detection, process monitoring, and anomaly alerts.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {page === "health" && <HealthPage backendLive={connected} />}

          {page === "devices" && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">
                  ◎ ALL DEVICES — {data?.devices.length ?? 0} FOUND
                </span>
              </div>
              <div className="panel-body">
                <DeviceTable devices={data?.devices ?? []} />
              </div>
            </div>
          )}

          {page === "processes" && (
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">
                  ▣ LOCAL PROCESSES — {data?.processes.length ?? 0} ACTIVE
                </span>
              </div>
              <div className="panel-body">
                <ProcessTable processes={data?.processes ?? []} />
              </div>
            </div>
          )}

          {page === "alerts" && (
            <AlertList
              alerts={data?.alerts ?? []}
              onAcknowledge={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {page === "features" && <FeatureGrid features={features} />}

          {page === "settings" && <SettingsPage />}

          {page === "roadmap" && <RoadmapPage />}
        </main>
      </div>
    </div>
  );
}
