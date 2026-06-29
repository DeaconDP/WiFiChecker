interface Props {
  score: number;
}

export default function GreedBar({ score }: Props) {
  const high = score >= 40;
  return (
    <div className="greed-bar">
      <div className="greed-track">
        <div
          className={`greed-fill ${high ? "high" : ""}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className="greed-pct">{score.toFixed(0)}%</span>
    </div>
  );
}
