import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { NAV, PAGE_INFO, pageFromPath } from "./routes";

function PageHeader() {
  const { pathname } = useLocation();
  const page = pageFromPath(pathname);
  const info = PAGE_INFO[page];

  return (
    <>
      <h1 className="page-title">{info.title}</h1>
      <p className="page-subtitle">{info.subtitle}</p>
    </>
  );
}

function DashboardPage({
  connected,
  connectivity,
  data,
  onRefresh,
}: {
  connected: boolean;
  connectivity: ReturnType<typeof useConnectivity>;
  data: LivePayload | null;
  onRefresh: () => void;
}) {
  return (
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
                onAcknowledge={onRefresh}
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
              Client health is active. Start the backend for greedy device detection,
              process monitoring, and anomaly alerts:
            </p>
            <pre className="insight-code">docker compose up</pre>
            <p className="insight-text">
              Or open the{" "}
              <NavLink className="link-btn" to="/health">
                ▲ Health
              </NavLink>{" "}
              page for full latency testing and PWA install.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
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

  const handleRefresh = () => setRefreshKey((k) => k + 1);

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
            <NavLink
              key={n.id}
              to={n.path}
              end={n.path === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-symbol">{n.symbol}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="main-content">
          <PageHeader />

          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  connected={connected}
                  connectivity={connectivity}
                  data={data}
                  onRefresh={handleRefresh}
                />
              }
            />
            <Route path="/health" element={<HealthPage backendLive={connected} />} />
            <Route
              path="/devices"
              element={
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
              }
            />
            <Route
              path="/processes"
              element={
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
              }
            />
            <Route
              path="/alerts"
              element={
                <AlertList
                  alerts={data?.alerts ?? []}
                  onAcknowledge={handleRefresh}
                />
              }
            />
            <Route path="/features" element={<FeatureGrid features={features} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
