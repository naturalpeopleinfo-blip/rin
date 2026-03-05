"use client";

type HourglassProgressProps = {
  progress: number;
  width?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function HourglassProgress({ progress, width = 220 }: HourglassProgressProps) {
  const ratio = clamp(progress, 0, 1);
  const percent = Math.round(ratio * 100);
  const topRatio = 1 - ratio;
  const bottomRatio = ratio;
  const streamVisible = ratio > 0.01 && ratio < 0.995;

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
        style={{ width: `${Math.max(168, width)}px` }}
      >
        <div className="rin-hourglass-progress-track">
          <div className="rin-hourglass-progress-top" aria-hidden>
            <div className="rin-hourglass-progress-fill" style={{ height: `${topRatio * 100}%` }}>
              <span aria-hidden className="rin-hourglass-progress-noise" />
              <span aria-hidden className="rin-hourglass-progress-shimmer" />
            </div>
          </div>
          <div className="rin-hourglass-progress-bottom" aria-hidden>
            <div className="rin-hourglass-progress-fill" style={{ height: `${bottomRatio * 100}%` }}>
              <span aria-hidden className="rin-hourglass-progress-noise" />
              <span aria-hidden className="rin-hourglass-progress-shimmer" />
            </div>
          </div>
          <span
            aria-hidden
            className={`rin-hourglass-progress-stream ${streamVisible ? "is-active" : ""}`}
          />
        </div>
        <span aria-hidden className="rin-hourglass-progress-highlight" />
      </div>
    </div>
  );
}
