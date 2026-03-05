"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setOnboarded } from "@/lib/onboarding";

type Slide = {
  id: string;
  canAutoAdvance?: boolean;
  autoAdvanceMs?: number;
  timingText?: string;
};

const BASE_SECONDS = 3.0;
const SECONDS_PER_CHARACTER = 0.14;
const MIN_SECONDS = 4.5;
const MAX_SECONDS = 11;

function clamp(min: number, max: number, value: number): number {
  return Math.min(Math.max(value, min), max);
}

function getVisibleCharacterCount(text: string): number {
  return text.replace(/\s+/g, "").length;
}

function getSlideDurationMs(text: string): number {
  const seconds = BASE_SECONDS + getVisibleCharacterCount(text) * SECONDS_PER_CHARACTER;
  return Math.round(clamp(MIN_SECONDS, MAX_SECONDS, seconds) * 1000);
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(
    () => [
      {
        id: "intro",
        canAutoAdvance: true,
        timingText: "A quiet place before the world begins.世界が始まる前の、静かな場所。",
      },
      {
        id: "cycle",
        canAutoAdvance: true,
        timingText: "凛は、巡る。66 Morning Rituals",
      },
      {
        id: "door",
        canAutoAdvance: false,
        timingText: "最初の七日間は 静かな準備です。その先には もう一つの扉があります。",
      },
    ].map((slide) => ({
      ...slide,
      autoAdvanceMs:
        slide.canAutoAdvance && slide.timingText
          ? getSlideDurationMs(slide.timingText)
          : undefined,
    })),
    [],
  );

  const isLast = index === slides.length - 1;

  useEffect(() => {
    if (!slides[index]?.canAutoAdvance) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex((prev) => Math.min(prev + 1, slides.length - 1));
    }, slides[index]?.autoAdvanceMs ?? 4500);
    return () => window.clearTimeout(timer);
  }, [index, slides]);

  const completeOnboarding = () => {
    setOnboarded();
    router.replace("/ritual");
  };

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const handleBack = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <main className="min-h-screen bg-[var(--rin-bg)] px-6 py-8 text-[var(--rin-text)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col">
        <header className="flex justify-end">
          <button
            type="button"
            onClick={completeOnboarding}
            className="text-xs tracking-[0.12em] text-[var(--rin-muted)] hover:underline"
          >
            Skip
          </button>
        </header>

        <button
          type="button"
          onClick={handleNext}
          className="flex flex-1 flex-col items-center justify-center text-center"
        >
          <div
            key={slides[index]?.id}
            className="rin-fade-in mx-auto flex min-h-[26rem] w-full max-w-2xl flex-col items-center justify-center"
          >
            {slides[index]?.id === "intro" ? (
              <>
                <p className="text-6xl font-medium tracking-[0.15em] md:text-7xl">RIN</p>
                <p className="mt-8 text-base tracking-[0.06em] text-[var(--rin-muted)] md:text-lg">
                  A quiet place before the world begins.
                </p>
                <p className="mt-2 text-sm tracking-[0.08em] text-[var(--rin-muted)]">
                  「世界が始まる前の、静かな場所。」
                </p>
              </>
            ) : null}

            {slides[index]?.id === "cycle" ? (
              <>
                <p className="text-6xl font-medium tracking-[0.15em] md:text-7xl">RIN</p>
                <p className="mt-8 text-3xl font-medium tracking-[0.08em] md:text-4xl">
                  「凛は、巡る。」
                </p>
                <p className="mt-4 text-xs tracking-[0.16em] text-[var(--rin-muted)] md:text-sm">
                  66 Morning Rituals
                </p>
              </>
            ) : null}

            {slides[index]?.id === "door" ? (
              <div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg">
                <p className="whitespace-pre-line text-xl leading-relaxed tracking-[0.05em] md:text-2xl">
                  {"最初の七日間は 静かな準備です。\nその先には もう一つの扉があります。"}
                </p>
                <p className="mt-6 text-sm tracking-[0.08em] text-[var(--rin-muted)]">
                  ゆっくり、始めましょう。
                </p>
                <div className="mt-10 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={completeOnboarding}
                    className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)]/60 px-6 py-3 text-sm tracking-[0.1em] transition hover:bg-[var(--rin-gold-soft)]"
                  >
                    Begin Ritual
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </button>

        <footer className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={index === 0}
            className="text-sm tracking-[0.1em] text-[var(--rin-muted)] disabled:opacity-40"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            {slides.map((slide, dotIndex) => (
              <span
                key={slide.id}
                className={`h-2 w-2 rounded-full transition ${
                  dotIndex === index ? "bg-[var(--rin-gold)]" : "bg-[var(--rin-gold)]/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="text-sm tracking-[0.1em] text-[var(--rin-muted)]"
          >
            {isLast ? "Begin" : "Next"}
          </button>
        </footer>
      </div>
    </main>
  );
}
