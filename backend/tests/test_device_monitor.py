"""Tests for device monitor metering behavior."""

from app.services.device_monitor import DeviceMonitor


def test_greed_score_ignores_unmetered_devices(monkeypatch):
    monitor = DeviceMonitor()

    monkeypatch.setattr(
        monitor,
        "_read_arp_table",
        lambda: [
            ("192.168.1.10", "00:1a:2b:11:22:33"),
            ("192.168.1.20", "aa:bb:cc:44:55:66"),
        ],
    )
    monkeypatch.setattr(monitor, "_local_ip", lambda: "192.168.1.10")
    monkeypatch.setattr(
        "app.services.device_monitor._local_mac",
        lambda: "00:1a:2b:11:22:33",
    )

    state = {"sent": 1_000_000, "recv": 2_000_000}

    def counters():
        state["sent"] += 50_000
        state["recv"] += 100_000
        return state["sent"], state["recv"]

    monkeypatch.setattr(monitor, "_local_interface_counters", counters)
    monkeypatch.setattr(monitor, "_local_connection_count", lambda _ip: 4)
    monkeypatch.setattr(
        "app.services.device_monitor.read_conntrack_snapshot",
        lambda: type(
            "Snap",
            (),
            {"by_ip": {}, "entry_count": 0, "source": "none"},
        )(),
    )

    first = monitor.scan()
    second = monitor.scan()

    local = next(d for d in second if d["ip"] == "192.168.1.10")
    remote = next(d for d in second if d["ip"] == "192.168.1.20")

    assert local["metering_source"] == "local_agent"
    assert remote["metering_source"] == "unmetered"
    assert local["greed_score"] == 100.0
    assert remote["greed_score"] == 0.0
    assert local["rate_sent"] + local["rate_recv"] > 0
    assert remote["rate_sent"] == 0
    assert remote["rate_recv"] == 0

    assert len(first) == 2
