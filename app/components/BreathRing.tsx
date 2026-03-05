"use client";

import type { CSSProperties } from "react";

type BreathRingProps = {
  timeLabel: string;
  countdownValue?: number | null;
  progress: number;
  mode?: "ambient" | "breathe";
  active: boolean;
  paused: boolean;
};

export default function BreathRing({
  timeLabel,
  countdownValue = null,
  progress,
  mode = "ambient",
  active,
  paused,
}: BreathRingProps) {
  const sandFill = Math.max(0.02, Math.min(1, progress));
  const sandStyle = { "--sand-fill": String(sandFill) } as CSSProperties;

  return (
    <div
      className={`rin-breath-ring-ui rin-ring ${active ? "is-active" : ""} ${paused ? "is-paused" : ""}`}
      data-mode={mode}
      aria-live="polite"
      aria-label={`Ritual timer ${timeLabel}`}
    >
      <span aria-hidden className="rin-breath-ring-ui-inner">
        <span aria-hidden className="rin-breath-ring-ui-vessel" />
        <span aria-hidden className="rin-breath-ring-ui-sand rin-sand-fill" style={sandStyle} />
      </span>
      <span aria-hidden className="rin-breath-ring-ui-pulse" />
      <span aria-hidden className="rin-breath-ring-ui-outline" />
      {countdownValue !== null ? (
        <span
          key={`countdown-${countdownValue}`}
          className="rin-breath-ring-ui-time rin-breath-ring-ui-time-countdown rin-countdown-dissolve tabular-nums"
        >
          {countdownValue}
        </span>
      ) : (
        <span className="rin-breath-ring-ui-time tabular-nums">{timeLabel}</span>
      )}
    </div>
  );
}
