"""Tests for conntrack parsing and per-IP aggregation."""

from app.services.conntrack_reader import (
    aggregate_conntrack_lines,
    is_lan_ip,
    parse_conntrack_line,
)


SAMPLE_ESTABLISHED = (
    "ipv4     2 tcp      6 299 ESTABLISHED "
    "src=192.168.1.10 dst=8.8.8.8 sport=57637 dport=443 packets=8 bytes=852 "
    "src=8.8.8.8 dst=192.168.1.1 sport=443 dport=57637 packets=6 bytes=410 "
    "[ASSURED]"
)

SAMPLE_SECOND_DEVICE = (
    "ipv4     2 tcp      6 120 ESTABLISHED "
    "src=192.168.1.20 dst=1.1.1.1 sport=51000 dport=443 packets=20 bytes=5000 "
    "src=1.1.1.1 dst=192.168.1.1 sport=443 dport=51000 packets=15 bytes=3000 "
    "[ASSURED]"
)


def test_parse_conntrack_line_attributes_lan_client():
    parsed = parse_conntrack_line(SAMPLE_ESTABLISHED)
    assert parsed == ("192.168.1.10", 852, 410)


def test_aggregate_conntrack_lines_sums_per_ip():
    stats = aggregate_conntrack_lines([SAMPLE_ESTABLISHED, SAMPLE_SECOND_DEVICE])
    assert stats["192.168.1.10"].bytes_sent == 852
    assert stats["192.168.1.10"].bytes_recv == 410
    assert stats["192.168.1.10"].connection_count == 1
    assert stats["192.168.1.20"].bytes_sent == 5000
    assert stats["192.168.1.20"].connection_count == 1


def test_is_lan_ip_accepts_private_ranges():
    assert is_lan_ip("192.168.1.10", "192.168.1.5")
    assert is_lan_ip("10.0.0.5", "192.168.1.5")
    assert not is_lan_ip("8.8.8.8", "192.168.1.5")
