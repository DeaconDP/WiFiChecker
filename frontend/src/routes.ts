export type Page =
  | "dashboard"
  | "health"
  | "devices"
  | "processes"
  | "alerts"
  | "features"
  | "roadmap"
  | "settings";

export const NAV: { id: Page; path: string; symbol: string; label: string }[] = [
  { id: "dashboard", path: "/", symbol: "◈", label: "Dashboard" },
  { id: "health", path: "/health", symbol: "▲", label: "Health" },
  { id: "devices", path: "/devices", symbol: "◎", label: "Devices" },
  { id: "processes", path: "/processes", symbol: "▣", label: "Processes" },
  { id: "alerts", path: "/alerts", symbol: "△", label: "Alerts" },
  { id: "settings", path: "/settings", symbol: "⚙", label: "Settings" },
  { id: "features", path: "/features", symbol: "◇", label: "Features" },
  { id: "roadmap", path: "/roadmap", symbol: "▤", label: "Roadmap" },
];

export const PAGE_INFO: Record<Page, { title: string; subtitle: string }> = {
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

const PATH_TO_PAGE = new Map(NAV.map((item) => [item.path, item.id]));

export function pageFromPath(pathname: string): Page {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return PATH_TO_PAGE.get(normalized) ?? "dashboard";
}
