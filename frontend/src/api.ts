import type { FeatureInfo, LivePayload } from "./types";

const API = "/api";

export interface AppSettings {
  poll_interval_seconds: number;
  anomaly_sigma_threshold: number;
  baseline_days: number;
  database_path: string;
}

export async function fetchFeatures(): Promise<FeatureInfo[]> {
  const res = await fetch(`${API}/features`);
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API}/settings`);
  return res.json();
}

export async function updateSettings(
  updates: Partial<Pick<AppSettings, "anomaly_sigma_threshold">>
): Promise<AppSettings> {
  const res = await fetch(`${API}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.json();
}

export async function fetchDeviceSparklines(
  hours = 24
): Promise<Record<string, number[]>> {
  const res = await fetch(`${API}/devices/sparklines?hours=${hours}`);
  return res.json();
}

export async function fetchRoadmap(): Promise<string> {
  const res = await fetch(`${API}/roadmap`);
  const data = await res.json();
  return data.content;
}

export async function acknowledgeAlert(id: string): Promise<void> {
  await fetch(`${API}/alerts/${id}/acknowledge`, { method: "POST" });
}

export function connectWebSocket(
  onData: (data: LivePayload) => void,
  onStatus: (connected: boolean) => void
): () => void {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const ws = new WebSocket(`${protocol}//${host}${API}/ws`);

  ws.onopen = () => onStatus(true);
  ws.onclose = () => onStatus(false);
  ws.onerror = () => onStatus(false);
  ws.onmessage = (event) => {
    try {
      onData(JSON.parse(event.data));
    } catch {
      /* ignore malformed frames */
    }
  };

  return () => ws.close();
}

export function formatRate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} MB/s`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}
