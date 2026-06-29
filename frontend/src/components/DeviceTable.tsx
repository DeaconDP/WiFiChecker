import { useEffect, useState } from "react";
import type { Device } from "../types";
import { fetchDeviceSparklines, formatRate } from "../api";
import GreedBar from "./GreedBar";
import Sparkline from "./Sparkline";

interface Props {
  devices: Device[];
}

export default function DeviceTable({ devices }: Props) {
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});

  useEffect(() => {
    if (devices.length === 0) return;
    fetchDeviceSparklines(24)
      .then(setSparklines)
      .catch(() => {});
    const interval = setInterval(() => {
      fetchDeviceSparklines(24)
        .then(setSparklines)
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [devices.map((d) => d.id).join(",")]);

  if (devices.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-symbol">◎</div>
        <p>Scanning for network devices…</p>
      </div>
    );
  }

  return (
    <div className="table-scroll table-scroll-cards">
      <table className="data-table card-layout">
        <thead>
          <tr>
            <th>◈ Device</th>
            <th>IP</th>
            <th>Vendor</th>
            <th>↓ Download</th>
            <th>↑ Upload</th>
            <th>24h</th>
            <th>Conns</th>
            <th>Greed</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td data-label="Device">
                {d.is_local_agent && <span title="This machine">▣ </span>}
                {d.hostname}
              </td>
              <td data-label="IP">{d.ip}</td>
              <td data-label="Vendor">{d.vendor}</td>
              <td data-label="Download">{formatRate(d.rate_recv)}</td>
              <td data-label="Upload">{formatRate(d.rate_sent)}</td>
              <td data-label="24h">
                <Sparkline data={sparklines[d.id] ?? []} />
              </td>
              <td data-label="Conns">{d.connection_count}</td>
              <td data-label="Greed">
                <GreedBar score={d.greed_score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
