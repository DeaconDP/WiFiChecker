import { useEffect, useState } from "react";
import type { FeatureInfo, LivePayload } from "./types";
import { connectWebSocket, fetchFeatures } from "./api";
import SummaryCards from "./components/SummaryCards";
import DeviceTable from "./components/DeviceTable";
import ProcessTable from "./components/ProcessTable";
import AlertList from "./components/AlertList";
import FeatureGrid from "./components/FeatureGrid";
import RoadmapPage from "./pages/RoadmapPage";

type Page = "dashboard" | "devices" | "processes" | "alerts" | "features" | "roadmap";

const NAV: { id: Page; symbol: string; label: string }[] = [
  { id: "dashboard", symbol: "◈", label: "Dashboard" },
  { id: "devices", symbol: "◎", label: "Devices" },
  { id: "processes", symbol: "▣", label: "Processes" },
  { id: "alerts", symbol: "△", label: "Alerts" },
  { id: "features", symbol: "◇", label: "Features" },
  { id: "roadmap", symbol: "▤", label: "Roadmap" },
];

const PAGE_INFO: Record<Page, { title: string; subtitle: string }> = {
  dashboard: {
    title: "◈ NETWORK OVERVIEW",
    subtitle:
      "Live snapshot of your LAN — device bandwidth, process activity, and active alerts.",
  },
  devices: {
    title: "◎ DEVICE MONITOR",
    subtitle:
      "Every device on your network ranked by bandwidth consumption. High Greed Scores indicate bandwidth hogs.",
  },
  processes: {
    title: "▣ PROCESS MONITOR",
    subtitle:
      "Applications on this machine using network I/O. Hover for executable path. Requires local agent.",
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
};

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<LivePayload | null>(null);
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

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
        <div className="status-pill">
          <span className={`status-dot ${connected ? "" : "offline"}`} />
          {connected ? "LIVE" : "RECONNECTING"}
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar">
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
          )}

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

          {page === "roadmap" && <RoadmapPage />}
        </main>
      </div>
    </div>
  );
}
