"use client";

import type { CSSProperties } from "react";

export type BreathRingStepTone =
  | "preparation"
  | "reset"
  | "breathe"
  | "imagine"
  | "become"
  | "declare"
  | "move"
  | "switch";

type BreathRingProps = {
  timeLabel: string;
  countdownValue?: number | null;
  progress: number;
  mode?: "ambient" | "breathe";
  stepTone?: BreathRingStepTone;
  active: boolean;
  paused: boolean;
};

export default function BreathRing({
  timeLabel,
  countdownValue = null,
  progress,
  mode = "ambient",
  stepTone = "preparation",
  active,
  paused,
}: BreathRingProps) {
  const vesselProgress = Math.max(0, Math.min(1, progress));
  const ringStyle = {
    "--vessel-progress": vesselProgress.toFixed(4),
  } as CSSProperties;

  return (
    <div
      className={`rin-breath-ring-ui rin-ring ${active ? "is-active" : ""} ${paused ? "is-paused" : ""}`}
      data-mode={mode}
      data-step={stepTone}
      style={ringStyle}
      aria-live="polite"
      aria-label={`Ritual timer ${timeLabel}`}
    >
      <span aria-hidden className="rin-breath-ring-ui-field" />
      <span aria-hidden className="rin-breath-ring-ui-aura" />
      <span aria-hidden className="rin-breath-ring-track" />
      <span aria-hidden className="rin-breath-ring-ui-inner">
        <span aria-hidden className="rin-breath-ring-ui-vessel" />
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
