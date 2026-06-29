import type { Device } from "../types";
import { formatRate } from "../api";
import GreedBar from "./GreedBar";

interface Props {
  devices: Device[];
}

export default function DeviceTable({ devices }: Props) {
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
