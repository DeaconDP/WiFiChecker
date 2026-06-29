import { useEffect, useState } from "react";
import { HealthSummary, LatencyCard, StatusCard } from "../components/HealthCards";
import { useConnectivity } from "../hooks/useConnectivity";
import { useLatencyTest } from "../hooks/useLatencyTest";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  backendLive: boolean;
}

export default function HealthPage({ backendLive }: Props) {
  const connectivity = useConnectivity();
  const latency = useLatencyTest();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <>
      <HealthSummary connectivity={connectivity} backendLive={backendLive} />

      {installEvent && !installDismissed && (
        <div className="install-banner">
          <div>
            <strong>Install Spectra</strong>
            <p>Add to your home screen for quick network health checks — works offline.</p>
          </div>
          <div className="install-actions">
            <button className="btn-primary" onClick={handleInstall}>
              Install
            </button>
            <button className="btn-ghost" onClick={() => setInstallDismissed(true)}>
              Not now
            </button>
          </div>
        </div>
      )}

      <StatusCard connectivity={connectivity} />
      <LatencyCard
        running={latency.running}
        results={latency.results}
        lastRunAt={latency.lastRunAt}
        onRun={latency.runTest}
      />

      {!backendLive && (
        <div className="panel insight-panel">
          <div className="panel-header">
            <span className="panel-title">◈ FULL LAN ANALYSIS</span>
          </div>
          <div className="panel-body">
            <p className="insight-text">
              Client health checks run entirely in your browser. For greedy device detection,
              process monitoring, and anomaly alerts, start the Spectra backend:
            </p>
            <pre className="insight-code">docker compose up</pre>
            <p className="insight-text">
              Or run <code>npm run dev</code> from the repo root for local development.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
