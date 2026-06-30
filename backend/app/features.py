"""User-facing feature explanations."""

FEATURES = [
    {
        "id": "client_health",
        "symbol": "▲",
        "title": "Client Health Checks",
        "summary": "Connectivity, link quality, and latency probes — works in any browser without a backend.",
        "how_it_works": (
            "Uses the Network Information API and navigator.onLine for live connection status. "
            "Latency probes measure round-trip time to Google, Cloudflare, and the app origin. "
            "Installable as a PWA for quick health checks on phone, tablet, or desktop."
        ),
        "limitations": (
            "Cannot read Wi-Fi SSID, signal strength, or scan nearby networks — browser sandbox limits. "
            "Latency probes depend on third-party endpoints being reachable."
        ),
        "status": "active",
    },
    {
        "id": "greedy_devices",
        "symbol": "◈",
        "title": "Greedy Device Detection",
        "summary": "Identifies which devices on your network consume the most bandwidth.",
        "how_it_works": (
            "Spectra scans your LAN via the ARP/neighbor table to discover devices, "
            "then attributes traffic using real data sources: Linux conntrack on "
            "gateways (per-IP NAT counters) or local interface stats for this host. "
            "Each metered device gets a Greed Score — its share of measured traffic. "
            "When usage spikes above its rolling baseline (2.5σ), an alert fires."
        ),
        "limitations": (
            "Other LAN devices are listed but unmetered unless Spectra runs on a "
            "gateway with conntrack visibility. Devices behind VPNs or using DoH "
            "hide destinations. Mobile and IoT per-app visibility requires an "
            "agent on each device."
        ),
        "status": "active",
    },
    {
        "id": "greedy_processes",
        "symbol": "▣",
        "title": "Greedy Process Detection",
        "summary": "Shows which applications on this machine are using the most network I/O.",
        "how_it_works": (
            "The local agent maps open sockets to process IDs using OS APIs (psutil). "
            "Each process is ranked by combined upload/download rate and assigned a "
            "Greed Score relative to other processes. Unfamiliar processes with high "
            "scores are flagged for review."
        ),
        "limitations": (
            "Requires running Spectra on the machine being monitored. Some system "
            "processes need elevated permissions. Container traffic may appear under "
            "the container runtime, not the app inside."
        ),
        "status": "active",
    },
    {
        "id": "anomaly_detection",
        "symbol": "△",
        "title": "Unusual Traffic Detection",
        "summary": "Learns normal patterns and alerts when behavior deviates.",
        "how_it_works": (
            "Spectra builds a rolling baseline of traffic rates per device and process. "
            "Statistical deviation (z-score) triggers alerts. Additional heuristics "
            "detect upload-heavy asymmetric patterns and first-time destinations."
        ),
        "limitations": (
            "Baselines need ~10+ samples before alerts activate. Software updates, "
            "CDN changes, and new apps cause false positives. Tune sensitivity under "
            "⚙ Settings (1–5σ threshold)."
        ),
        "status": "active",
    },
    {
        "id": "threat_signals",
        "symbol": "◉",
        "title": "Threat & Privacy Signals",
        "summary": "Flags patterns associated with exfiltration, beaconing, and reconnaissance.",
        "how_it_works": (
            "Without decrypting HTTPS, Spectra analyzes metadata: upload/download ratio, "
            "connection timing regularity, new destinations, and off-hours spikes. "
            "Critical alerts highlight upload-heavy devices and unknown remote hosts."
        ),
        "limitations": (
            "Cannot read encrypted payloads. Not a replacement for antivirus. "
            "Cannot detect passive Wi-Fi sniffing. Threat intel feed integration "
            "is planned for domain/IP reputation checks."
        ),
        "status": "partial",
    },
    {
        "id": "device_inventory",
        "symbol": "◎",
        "title": "Device Inventory",
        "summary": "Maintains a live registry of every device on your network.",
        "how_it_works": (
            "ARP table scanning discovers IP/MAC pairs. Hostnames are resolved via "
            "reverse DNS. Vendor is inferred from MAC OUI prefix. New unknown "
            "devices trigger an informational alert."
        ),
        "limitations": (
            "ARP cache only shows recently active devices. Randomized MAC addresses "
            "(iOS 14+, Android 10+) reduce tracking accuracy. IPv6-only devices "
            "may be missed."
        ),
        "status": "active",
    },
    {
        "id": "dns_logging",
        "symbol": "▤",
        "title": "DNS Query Logging",
        "summary": "Records which domains each device resolves — powerful for spotting malware.",
        "how_it_works": (
            "When Spectra runs as a network gateway or pairs with Pi-hole/NextDNS, "
            "every DNS query is logged and correlated to a device. DGA domains, "
            "long random subdomains, and typosquatting patterns are detectable."
        ),
        "limitations": (
            "Not active in this build. Requires gateway deployment or DNS sinkhole "
            "integration. DoH/DoT bypasses local DNS logging."
        ),
        "status": "planned",
    },
    {
        "id": "rogue_ap",
        "symbol": "◆",
        "title": "Rogue Access Point Detection",
        "summary": "Detects evil-twin APs and deauthentication attacks.",
        "how_it_works": (
            "Monitor-mode Wi-Fi scanning compares visible BSSIDs/SSIDs against your "
            "known network fingerprint. Duplicate SSIDs with different BSSIDs, "
            "unexpected channels, and deauth frame floods are flagged."
        ),
        "limitations": (
            "Requires Wi-Fi adapter with monitor mode support. Not available in "
            "cloud/VM environments. Planned for hardware gateway edition."
        ),
        "status": "planned",
    },
    {
        "id": "threat_intel",
        "symbol": "◇",
        "title": "Threat Intelligence Feeds",
        "summary": "Cross-references destinations against known-malicious IP/domain lists.",
        "how_it_works": (
            "Outbound connections are checked against feeds like abuse.ch, AlienVault "
            "OTX, and commercial blocklists. Matches produce critical alerts with "
            "feed source and confidence score."
        ),
        "limitations": (
            "Feed freshness and false positives vary. Encrypted DNS hides domain names. "
            "Planned integration — not yet active."
        ),
        "status": "planned",
    },
]
