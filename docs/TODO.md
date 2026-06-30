# Spectra — Product Roadmap & Epics

> Living backlog for network health and Wi-Fi traffic analysis: client probes, greedy devices, greedy processes, anomaly detection, and threat signals.

---

## Epic 0: Unified App ◈

**Goal:** One simple app for maximum insight — client health + LAN intelligence.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Merge WiFiChecker into Spectra UI | ▲ Health page — connectivity + latency |
| ✅ Done | Unified dashboard | Client + LAN status on one screen |
| ✅ Done | Single Docker Compose launch | `docker compose up` |
| ✅ Done | PWA install for health checks | Works on GitHub Pages without backend |
| ✅ Done | Consolidated repo structure | One frontend, one backend, root orchestrator |
| 🔲 Todo | URL routing (deep links) | `/health`, `/devices`, etc. |
| 🔲 Todo | Mobile bottom nav | Swipeable cards on small screens |

---

## Epic 1: Core Monitoring ◈

**Goal:** Reliable real-time visibility into network devices and local process traffic.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | ARP-based device discovery | `/proc/net/arp` + `ip neigh` fallback |
| ✅ Done | Per-device bandwidth estimation | Rate tracking with greed score |
| ✅ Done | Per-process socket attribution | psutil `net_connections` + IO counters |
| ✅ Done | WebSocket live dashboard | 2s poll interval, push updates |
| ✅ Done | SQLite traffic history | Samples per device/process |
| ✅ Done | 24h traffic sparklines | Per-device from `traffic_samples` |
| ✅ Done | New device joined alerts | Unknown MAC detection |
| 🔲 Todo | Accurate per-device metering via gateway | Conntrack per-IP when gateway; local host otherwise |
| 🔲 Todo | IPv6 device discovery | `ip -6 neigh` integration |
| 🔲 Todo | Device naming persistence | Remember user-assigned labels |

### Suggestions
- Add **device grouping** (Kids, IoT, Work) for aggregate greed scores
- **Export CSV** of traffic history for offline analysis

---

## Epic 2: Anomaly Detection △

**Goal:** Learn normal behavior, alert on meaningful deviations with clear explanations.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Rolling baseline (z-score) | 2.5σ threshold, 500-sample cap |
| ✅ Done | Greedy device alerts | Volume spike above baseline |
| ✅ Done | Greedy process alerts | Per-PID rate anomaly |
| ✅ Done | Upload-heavy pattern detection | Asymmetric upload/download ratio |
| ✅ Done | New destination alerts | First-seen remote hosts per process |
| ✅ Done | Configurable sensitivity slider | Settings page — σ threshold |
| 🔲 Todo | Time-of-day baselines | Different thresholds for 3am vs 3pm |
| 🔲 Todo | Beaconing detection | Fixed-interval connection regularity |
| 🔲 Todo | Alert suppression rules | "Ignore Windows Update" patterns |

### Suggestions
- **Isolation Forest** ML model once enough samples exist
- **Alert correlation**: group related alerts into incidents
- **Snooze** button (1h / 24h / until restart)

---

## Epic 3: Threat & Privacy Signals ◉

**Goal:** Surface metadata patterns associated with malware, exfiltration, and reconnaissance.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Upload exfiltration heuristic | High upload + low download |
| ✅ Done | New remote host tracking | Per-process first-seen |
| 🔲 Todo | Threat intel feed integration | abuse.ch, OTX, Spamhaus |
| 🔲 Todo | DNS query logging | Requires gateway or Pi-hole hook |
| 🔲 Todo | DGA domain detection | Entropy + length heuristics |
| 🔲 Todo | JA3/JA4 TLS fingerprinting | Requires handshake capture |
| 🔲 Todo | Port scan detection | Many short connections to sequential ports |
| 🔲 Todo | C2 beaconing interval analysis | FFT on connection timestamps |

### Suggestions
- Integrate **VirusTotal API** for on-click domain/IP lookup
- **MITRE ATT&CK** technique tagging on alerts
- **Privacy score** per device: how many unique trackers contacted

---

## Epic 4: Gateway Deployment ▤

**Goal:** Run Spectra as a network gateway for whole-LAN visibility without per-device agents.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Docker Compose full stack | Backend + frontend containers |
| 🔲 Todo | Docker Compose gateway mode | Bridge + dnsmasq + Spectra |
| 🔲 Todo | OpenWrt package | opkg install spectra |
| 🔲 Todo | Raspberry Pi image | Flash-and-go appliance |
| 🔲 Todo | DNS sinkhole integration | Pi-hole / AdGuard Home API |
| 🔲 Todo | Per-device iptables counters | Accurate bytes per MAC/IP |
| 🔲 Todo | DHCP lease correlation | Device identity across IP changes |

### Suggestions
- **One-line installer**: `curl -sSL spectra.dev/install | bash`
- **Tailscale subnet router** mode for remote home network monitoring
- **Multi-WAN** support for failover link monitoring

---

## Epic 5: Endpoint Agents ▣

**Goal:** Deep per-app visibility on every device type.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Linux desktop agent | psutil-based, runs with backend |
| 🔲 Todo | Windows agent | ETW + GetExtendedTcpTable |
| 🔲 Todo | macOS agent | Network Extension framework |
| 🔲 Todo | Android agent | VPNService API for per-UID stats |
| 🔲 Todo | iOS companion | Device list + alerts only (API limits) |
| 🔲 Todo | Headless agent daemon | systemd service, no UI required |

### Suggestions
- **Browser extension** for per-tab bandwidth (Chrome/Firefox)
- **Container-aware** attribution (Docker/k8s pod labels)
- Agent **auto-update** channel with signature verification

---

## Epic 6: UI & Experience ◇

**Goal:** Cyberpunk aesthetic with zero learning curve — every feature self-explains.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | Dark mode cyberpunk theme | Orbitron + Share Tech Mono |
| ✅ Done | Unicode monochromatic iconography | ◈ ◎ ▣ △ ◉ ◇ ▤ ▲ |
| ✅ Done | Feature guide page | How it works + limitations per feature |
| ✅ Done | Alert explanations | "Why this matters" on every alert |
| ✅ Done | Roadmap page | This file, rendered in-app |
| ✅ Done | Client health page | Connectivity + latency probes (PWA) |
| ✅ Done | Unified dashboard | Client + LAN insight on one screen |
| 🔲 Todo | Traffic flow visualization | D3 chord diagram device ↔ destination |
| 🔲 Todo | Sound alerts for critical | Optional retro synth beep |
| 🔲 Todo | CRT shader toggle | Optional post-processing effect |
| 🔲 Todo | Mobile-responsive dashboard | Bottom nav, swipeable cards |

### Suggestions
- **Onboarding wizard**: 3-step setup (gateway vs desktop, permissions, baseline period)
- **Keyboard shortcuts**: `g d` → devices, `g a` → alerts
- **Themes**: swap neon-cyan/magenta for amber/green "matrix" variant

---

## Epic 7: Platform & Ops ⚙

**Goal:** Production-ready deployment, configuration, and data management.

| Status | Item | Notes |
|--------|------|-------|
| ✅ Done | FastAPI backend | REST + WebSocket |
| ✅ Done | React + Vite frontend | Proxy to backend in dev |
| ✅ Done | SQLite persistence | Traffic samples, alerts, devices |
| ✅ Done | Environment-based config | `.env` + `.env.example` |
| ✅ Done | Docker Compose (full stack) | `docker compose up` |
| ✅ Done | Settings API + UI | PATCH `/api/settings` |
| 🔲 Todo | Authentication | Basic auth or OAuth for remote access |
| 🔲 Todo | Data retention policy | Auto-prune samples older than N days |
| 🔲 Todo | Health check + metrics | Prometheus `/metrics` endpoint |

### Suggestions
- **Webhook notifications**: Slack, Discord, ntfy.sh on critical alerts
- **Backup/restore** SQLite to S3 or local file
- **Multi-tenant** mode for monitoring several sites

---

## Completed Quick Wins

1. ~~Docker Compose for one-command launch~~ ✅
2. ~~24h traffic sparklines on device cards~~ ✅
3. ~~Configurable alert threshold via UI~~ ✅
4. ~~"New device joined" alert when unknown MAC appears~~ ✅
5. ~~Process executable path column with copy button~~ ✅
6. ~~Unified app (WiFiChecker + Spectra)~~ ✅

---

## Long-Term Vision

Spectra becomes the **consumer-friendly layer** on top of proven network analysis tools (Zeek, Suricata, ntopng) — surfacing greedy devices, suspicious patterns, and privacy risks in plain language with a cyberpunk edge, while the heavy lifting stays in metadata analysis and behavioral baselines rather than impossible promises about decrypting HTTPS.
