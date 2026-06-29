import type { ProcessTraffic } from "../types";
import { formatRate } from "../api";
import GreedBar from "./GreedBar";

interface Props {
  processes: ProcessTraffic[];
}

export default function ProcessTable({ processes }: Props) {
  if (processes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-symbol">▣</div>
        <p>No active network processes detected.</p>
        <p style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          Some processes require elevated permissions to inspect.
        </p>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>▣ Process</th>
          <th>PID</th>
          <th>↓ Download</th>
          <th>↑ Upload</th>
          <th>Conns</th>
          <th>Remote Hosts</th>
          <th>Greed</th>
        </tr>
      </thead>
      <tbody>
        {processes.map((p) => (
          <tr key={p.pid}>
            <td title={p.exe ?? undefined}>{p.name}</td>
            <td>{p.pid}</td>
            <td>{formatRate(p.rate_recv)}</td>
            <td>{formatRate(p.rate_sent)}</td>
            <td>{p.connection_count}</td>
            <td style={{ fontSize: "0.75rem", maxWidth: "200px" }}>
              {p.remote_hosts.slice(0, 3).join(", ")}
              {p.remote_hosts.length > 3 && ` +${p.remote_hosts.length - 3}`}
            </td>
            <td>
              <GreedBar score={p.greed_score} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
