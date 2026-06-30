# Spectra

**Network Traffic Intelligence** — one app for client health checks and full LAN analysis.

```
   ◈ SPECTRA ◈
  ▲ ◎ ▣ △ ◉
```

| Mode | What it does | Requires backend |
|------|--------------|------------------|
| **▲ Health** | Connectivity, link quality, latency probes, PWA install | No |
| **◈ Dashboard** | Greedy devices, process monitoring, anomaly alerts | Yes |

---

## Quick start

**Double-click to run (no terminal, no Docker):**

| Platform | What to open |
|----------|--------------|
| **Windows** | `Spectra.vbs` (silent) or `Spectra.bat` |
| **macOS** | `Spectra.command` |
| **Linux** | `Spectra` or `launch.py` |

On first launch, Spectra installs Python packages and builds the UI automatically. Your browser opens to **http://127.0.0.1:8000** with the full dashboard.

**Requirements (one-time):** [Python 3.11+](https://python.org) and [Node.js](https://nodejs.org) (Node is only needed for the first-run UI build).

---

## Development

For local development with hot reload:

```bash
npm run install:all
npm run dev:full
```

Open **http://localhost:5173** — the Vite dev server proxies API calls to the backend on port 8000.

Or run the production-style launcher:

```bash
npm start
```

---

## Features

| Symbol | Feature | Status |
|--------|---------|--------|
| ▲ | **Client health** — connectivity, latency, PWA install | Active |
| ◈ | **Greedy device detection** — which devices hog bandwidth | Active |
| ▣ | **Greedy process detection** — which apps on this machine are active | Active |
| △ | **Anomaly alerts** — traffic spikes, new destinations, upload patterns | Active |
| ◉ | **Threat signals** — exfiltration heuristics, suspicious uploads | Partial |
| ◎ | **Device inventory** — live LAN device registry with 24h sparklines | Active |
| ⚙ | **Settings** — configurable alert sensitivity (σ threshold) | Active |
| ▤ | **DNS logging** — domain-level visibility | Planned |

Every feature is explained in-app under **◇ Features**, with limitations stated plainly.

---

## Configuration

Copy `.env.example` to `.env` or set environment variables (prefix `SPECTRA_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECTRA_POLL_INTERVAL_SECONDS` | `2.0` | Monitoring poll interval |
| `SPECTRA_ANOMALY_SIGMA_THRESHOLD` | `2.5` | Standard deviations for alerts |
| `SPECTRA_BASELINE_DAYS` | `7` | Baseline learning window |
| `SPECTRA_DATABASE_PATH` | `data/spectra.db` | SQLite database path |
| `SPECTRA_HOST` | `127.0.0.1` | Server bind address |
| `SPECTRA_PORT` | `8000` | Server port |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           Unified React UI              │
│  ▲ Health (browser-only, PWA)           │
│  ◈ Dashboard / Devices / Alerts (LAN)   │
└──────────────┬──────────────────────────┘
               │ REST + WebSocket
        ┌──────▼───────┐
        │   FastAPI    │
        │   Backend    │
        └──────┬───────┘
               │
   ┌───────────┼───────────┐
   ▼           ▼           ▼
DeviceMonitor ProcessMonitor AnomalyDetector
(ARP scan)    (psutil)       (z-score)
```

When launched via `launch.py`, the backend serves the built UI on a single port — no separate frontend server required.

---

## Deploy (GitHub Pages)

The unified app builds to a static PWA. The **▲ Health** page works fully offline; LAN features need a local Spectra instance (double-click `Spectra` / `launch.py`).

**One-time setup:**

1. Open [Settings → Pages](https://github.com/DeaconDP/WiFiChecker/settings/pages).
2. Set **Source** to **Deploy from a branch** → **`gh-pages`** → **`/ (root)`**.

Live at **https://deacondp.github.io/WiFiChecker/** after the next push to `main`.

---

## Roadmap

See [docs/TODO.md](docs/TODO.md) for epics, suggestions, and the living product backlog. Also rendered in-app under **▤ Roadmap**.

---

## Limitations (honest)

- Per-device bandwidth on consumer setups is **approximate** without a dedicated gateway
- **HTTPS content is not decrypted** — analysis uses metadata only
- Browser health checks cannot read Wi‑Fi SSID or signal strength
- Per-app visibility on phones requires platform-specific agents (planned)
- Not a replacement for antivirus — behavioral anomaly detection, not signature scanning

---

## License

MIT
