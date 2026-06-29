import type { FeatureInfo } from "../types";

interface Props {
  features: FeatureInfo[];
}

export default function FeatureGrid({ features }: Props) {
  return (
    <div className="feature-grid">
      {features.map((f) => (
        <div key={f.id} className="feature-card">
          <div className="feature-symbol">{f.symbol}</div>
          <div className="feature-title">{f.title}</div>
          <p className="feature-summary">{f.summary}</p>
          <div className="feature-section">
            <div className="feature-section-label">▸ How it works</div>
            <p>{f.how_it_works}</p>
          </div>
          <div className="feature-section">
            <div className="feature-section-label">▸ Limitations</div>
            <p>{f.limitations}</p>
          </div>
          <span className={`status-badge ${f.status}`}>{f.status}</span>
        </div>
      ))}
    </div>
  );
}
