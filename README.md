# Spectra

**Network Traffic Intelligence** — identify greedy devices, greedy processes, unusual traffic, and threat signals on your Wi-Fi network.

```
   ◈ SPECTRA ◈
  ◎ ▣ △ ◉ ◇
```

## What it does

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

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
python3 run.py
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173` (proxies API requests to backend).

### Configuration

Environment variables (prefix `SPECTRA_`):

| Variable | Default | Description |
|----------|---------|-------------|
| `SPECTRA_POLL_INTERVAL_SECONDS` | `2.0` | Monitoring poll interval |
| `SPECTRA_ANOMALY_SIGMA_THRESHOLD` | `2.5` | Standard deviations for alerts |
| `SPECTRA_BASELINE_DAYS` | `7` | Baseline learning window |
| `SPECTRA_DATABASE_PATH` | `data/spectra.db` | SQLite database path |

## Architecture

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

## Roadmap

See [docs/TODO.md](docs/TODO.md) for epics, suggestions, and the living product backlog. The roadmap is also rendered in-app under **▤ Roadmap**.

## Limitations (honest)

- Per-device bandwidth on consumer setups is **approximate** without a dedicated gateway
- **HTTPS content is not decrypted** — analysis uses metadata only
- Per-app visibility on phones requires platform-specific agents (planned)
- Not a replacement for antivirus — behavioral anomaly detection, not signature scanning

## License

MIT
