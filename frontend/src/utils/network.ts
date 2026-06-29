export type ConnectionType = "wifi" | "cellular" | "ethernet" | "unknown";

export interface ConnectivitySnapshot {
  online: boolean;
  connectionType: ConnectionType;
  effectiveType?: string;
  downlinkMbps?: number;
  rttMs?: number;
  saveData?: boolean;
}

interface NetworkInformationLike {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function getNetworkInformation(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

export function mapConnectionType(raw?: string): ConnectionType {
  switch (raw) {
    case "wifi":
      return "wifi";
    case "cellular":
      return "cellular";
    case "ethernet":
      return "ethernet";
    default:
      return "unknown";
  }
}

export function readConnectivity(): ConnectivitySnapshot {
  const connection = getNetworkInformation();

  return {
    online: navigator.onLine,
    connectionType: mapConnectionType(connection?.type),
    effectiveType: connection?.effectiveType,
    downlinkMbps: connection?.downlink,
    rttMs: connection?.rtt,
    saveData: connection?.saveData,
  };
}

export function subscribeConnectivity(onChange: () => void): () => void {
  const connection = getNetworkInformation();

  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  connection?.addEventListener?.("change", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
    connection?.removeEventListener?.("change", onChange);
  };
}

export interface LatencyProbe {
  id: string;
  label: string;
  url: string;
}

const originProbeUrl = `${import.meta.env.BASE_URL}favicon.svg`;

export const LATENCY_PROBES: LatencyProbe[] = [
  {
    id: "google",
    label: "Google",
    url: "https://www.google.com/generate_204",
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    url: "https://cloudflare.com/cdn-cgi/trace",
  },
  {
    id: "origin",
    label: "This app",
    url: originProbeUrl,
  },
];

export interface LatencyResult {
  probeId: string;
  label: string;
  latencyMs: number | null;
  reachable: boolean;
  error?: string;
}

export async function measureLatency(probe: LatencyProbe): Promise<LatencyResult> {
  const start = performance.now();

  try {
    const response = await fetch(probe.url, {
      method: "GET",
      cache: "no-store",
      mode: probe.url.startsWith("http") ? "cors" : "same-origin",
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      probeId: probe.id,
      label: probe.label,
      latencyMs: Math.round(performance.now() - start),
      reachable: true,
    };
  } catch (error) {
    return {
      probeId: probe.id,
      label: probe.label,
      latencyMs: null,
      reachable: false,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function runLatencySuite(): Promise<LatencyResult[]> {
  return Promise.all(LATENCY_PROBES.map((probe) => measureLatency(probe)));
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function latencyQuality(ms: number | null): "good" | "fair" | "poor" | "unknown" {
  if (ms == null) return "unknown";
  if (ms < 80) return "good";
  if (ms < 200) return "fair";
  return "poor";
}

export function connectionLabel(type: ConnectionType): string {
  switch (type) {
    case "wifi":
      return "Wi‑Fi";
    case "cellular":
      return "Cellular";
    case "ethernet":
      return "Ethernet";
    default:
      return "Unknown";
  }
}
