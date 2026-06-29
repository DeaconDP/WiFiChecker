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
    <table className="data-table">
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
            <td>
              {d.is_local_agent && <span title="This machine">▣ </span>}
              {d.hostname}
            </td>
            <td>{d.ip}</td>
            <td>{d.vendor}</td>
            <td>{formatRate(d.rate_recv)}</td>
            <td>{formatRate(d.rate_sent)}</td>
            <td>
              <Sparkline data={sparklines[d.id] ?? []} />
            </td>
            <td>{d.connection_count}</td>
            <td>
              <GreedBar score={d.greed_score} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
