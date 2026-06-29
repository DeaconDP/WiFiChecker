import { useState } from "react";
import type { ProcessTraffic } from "../types";
import { formatRate } from "../api";
import GreedBar from "./GreedBar";

interface Props {
  processes: ProcessTraffic[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={handleCopy}
      title="Copy path"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
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
    <div className="table-scroll table-scroll-cards">
      <table className="data-table card-layout">
        <thead>
          <tr>
            <th>▣ Process</th>
            <th>PID</th>
            <th>Path</th>
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
              <td data-label="Process">{p.name}</td>
              <td data-label="PID">{p.pid}</td>
              <td className="exe-path-cell" data-label="Path">
                {p.exe ? (
                  <>
                    <span className="exe-path" title={p.exe}>
                      {p.exe}
                    </span>
                    <CopyButton text={p.exe} />
                  </>
                ) : (
                  <span className="text-dim">—</span>
                )}
              </td>
              <td data-label="Download">{formatRate(p.rate_recv)}</td>
              <td data-label="Upload">{formatRate(p.rate_sent)}</td>
              <td data-label="Conns">{p.connection_count}</td>
              <td className="remote-hosts-cell" data-label="Remote Hosts">
                {p.remote_hosts.slice(0, 3).join(", ")}
                {p.remote_hosts.length > 3 && ` +${p.remote_hosts.length - 3}`}
              </td>
              <td data-label="Greed">
                <GreedBar score={p.greed_score} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
