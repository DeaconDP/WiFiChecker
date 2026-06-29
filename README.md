# WiFiChecker / Spectra

This repository contains two related network tools:

| App | What it does | Run from |
|-----|--------------|----------|
| **WiFiChecker** | Browser PWA for connectivity, link info, and latency tests | repo root |
| **Spectra** | Full-stack Wi-Fi traffic analyzer — greedy devices, processes, anomalies | `backend/` + `frontend/` |

---

## WiFiChecker (PWA)

Cross-platform **Progressive Web App** for network health checks — connectivity status, browser-reported connection info, and latency/reachability tests. Installable on phone, tablet, and desktop.

### Features (v0.1)

- Online/offline status with live updates
- Connection type and Network Information API metrics (where the browser exposes them)
- Latency suite against Google, Cloudflare, and the app origin
- Installable PWA shell (manifest + service worker)
- Mobile-first responsive UI

### Browser limits

Web apps cannot access Wi‑Fi SSID, signal strength, or scan nearby networks. WiFiChecker focuses on what browsers *can* measure: connectivity, estimated link quality, and round-trip latency.

### Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. For phone testing, deploy to Vercel/Netlify or tunnel the dev server (e.g. Cloudflare Tunnel, ngrok) and open the public URL on your device. Use **Add to Home Screen** / **Install app** to install the PWA.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run preview:pages` | Build and preview with the GitHub Pages base path (`/WiFiChecker/`) |

### Deploy (GitHub Pages)

This repo includes a [GitHub Actions workflow](.github/workflows/deploy.yml) that builds and publishes the **WiFiChecker PWA** to Pages on every push to `main`.

1. In the repo on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Merge to `main` (or run the workflow manually from the **Actions** tab).

The app will be available at **https://deacondp.github.io/WiFiChecker/**.

Local production preview with the same base path as GitHub Pages:

```bash
npm run preview:pages
```

Then open **http://localhost:4173/WiFiChecker/** (paths match the live site).

**First-time setup:** If deploy fails with *"Ensure GitHub Pages has been enabled"*, open [Settings → Pages](https://github.com/DeaconDP/WiFiChecker/settings/pages), set **Source** to **GitHub Actions**, then re-run the [Deploy workflow](https://github.com/DeaconDP/WiFiChecker/actions/workflows/deploy.yml) from the Actions tab.

---

## Spectra (Traffic Analyzer)

**Network Traffic Intelligence** — identify greedy devices, greedy processes, unusual traffic, and threat signals on your Wi-Fi network.

```
   ◈ SPECTRA ◈
  ◎ ▣ △ ◉ ◇
```

### What it does

| Symbol | Feature | Status |
|--------|---------|--------|
| ◈ | **Greedy device detection** — which devices hog bandwidth | Active |
| ▣ | **Greedy process detection** — which apps on this machine are active | Active |
| △ | **Anomaly alerts** — traffic spikes, new destinations, upload patterns | Active |
| ◉ | **Threat signals** — exfiltration heuristics, suspicious uploads | Partial |
| ◎ | **Device inventory** — live LAN device registry | Active |
| ▤ | **DNS logging** — domain-level visibility | Planned |
| ▲ | **Rogue AP detection** — evil twin / deauth | Planned |

Every feature is explained in the app under **◇ Features**, with limitations stated plainly.

### Quick start

**Prerequisites:** Python 3.11+, Node.js 18+

```bash
# Install Spectra dependencies
npm run spectra:install

# Terminal 1 — backend API (port 8000)
npm run spectra:backend

# Terminal 2 — cyberpunk dashboard (port 5173)
npm run spectra:frontend
```

Open **http://localhost:5173** (proxies API requests to the backend).

### Configuration

Environment variables (prefix `SPECTRA_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECTRA_POLL_INTERVAL_SECONDS` | `2.0` | Monitoring poll interval |
| `SPECTRA_ANOMALY_SIGMA_THRESHOLD` | `2.5` | Standard deviations for alerts |
| `SPECTRA_BASELINE_DAYS` | `7` | Baseline learning window |
| `SPECTRA_DATABASE_PATH` | `data/spectra.db` | SQLite database path |

### Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐
│  React UI   │◄──────────────────►│  FastAPI     │
│  (cyberpunk)│     REST API       │  Backend     │
└─────────────┘                    └──────┬───────┘
                                          │
                              ┌───────────┼───────────┐
                              ▼           ▼           ▼
                        DeviceMonitor ProcessMonitor AnomalyDetector
                        (ARP scan)    (psutil)       (z-score)
```

### Roadmap

See [docs/TODO.md](docs/TODO.md) for epics, suggestions, and the living product backlog. The roadmap is also rendered in-app under **▤ Roadmap**.

### Limitations (honest)

- Per-device bandwidth on consumer setups is **approximate** without a dedicated gateway
- **HTTPS content is not decrypted** — analysis uses metadata only
- Per-app visibility on phones requires platform-specific agents (planned)
- Not a replacement for antivirus — behavioral anomaly detection, not signature scanning

---

## License

MIT
