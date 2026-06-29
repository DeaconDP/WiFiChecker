interface Props {
  data: number[];
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 80, height = 24 }: Props) {
  if (!data.length) {
    return (
      <svg width={width} height={height} className="sparkline">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--text-dim)"
          strokeWidth={1}
          opacity={0.3}
        />
      </svg>
    );
  }

  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      className="sparkline"
      aria-label="24h traffic"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--neon-cyan)"
        strokeWidth={1.5}
        opacity={0.85}
      />
    </svg>
  );
}
