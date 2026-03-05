"use client";

type HourglassProgressProps = {
  progress: number;
  size?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function HourglassProgress({ progress, size = 132 }: HourglassProgressProps) {
  const ratio = clamp(progress, 0, 1);
  const percent = Math.round(ratio * 100);
  const height = Math.max(96, size);
  const width = Math.round(height * 0.36);

  return (
    <div
      role="progressbar"
      aria-label="Progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="rin-hourglass-progress"
    >
      <span className="sr-only">{percent}%</span>
      <div
        className="rin-hourglass-progress-capsule"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="rin-hourglass-progress-track">
          <div className="rin-hourglass-progress-fill" style={{ height: `${ratio * 100}%` }}>
            <span aria-hidden className="rin-hourglass-progress-noise" />
            <span aria-hidden className="rin-hourglass-progress-shimmer" />
          </div>
        </div>
        <span aria-hidden className="rin-hourglass-progress-highlight" />
      </div>
    </div>
  );
}
