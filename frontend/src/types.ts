export interface Device {
  id: string;
  mac: string;
  ip: string;
  hostname: string;
  vendor: string;
  bytes_sent: number;
  bytes_recv: number;
  rate_sent: number;
  rate_recv: number;
  connection_count: number;
  is_local_agent: boolean;
  last_seen: string;
  greed_score: number;
  metering_source: "conntrack" | "local_agent" | "unmetered";
}

export interface ProcessTraffic {
  pid: number;
  name: string;
  exe: string | null;
  bytes_sent: number;
  bytes_recv: number;
  rate_sent: number;
  rate_recv: number;
  connection_count: number;
  remote_hosts: string[];
  greed_score: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  message: string;
  explanation: string;
  device_id: string | null;
  process_name: string | null;
  created_at: string;
  acknowledged: boolean;
}

export interface NetworkSummary {
  total_devices: number;
  active_devices: number;
  total_rate_sent: number;
  total_rate_recv: number;
  alert_count: number;
  critical_alert_count: number;
  monitoring_since: string | null;
}

export interface FeatureInfo {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  how_it_works: string;
  limitations: string;
  status: "active" | "partial" | "planned";
}

export interface LivePayload {
  devices: Device[];
  processes: ProcessTraffic[];
  alerts: Alert[];
  summary: NetworkSummary;
}
