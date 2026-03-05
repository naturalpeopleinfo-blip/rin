"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setOnboarded } from "@/lib/onboarding";

type Slide = {
  id: string;
  canAutoAdvance?: boolean;
};

const AUTO_ADVANCE_MS = 2200;

export default function OnboardingFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [showMirrorNote, setShowMirrorNote] = useState(false);

  const slides: Slide[] = useMemo(
    () => [
      { id: "intro", canAutoAdvance: true },
      { id: "cycle", canAutoAdvance: true },
      { id: "voice", canAutoAdvance: true },
      { id: "door", canAutoAdvance: true },
      { id: "day1" },
    ],
    [],
  );

  const isLast = index === slides.length - 1;

  useEffect(() => {
    if (!slides[index]?.canAutoAdvance) {
      return;
    }
    const timer = window.setTimeout(() => {
      setIndex((prev) => Math.min(prev + 1, slides.length - 1));
    }, AUTO_ADVANCE_MS);
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
          key={slides[index]?.id}
          type="button"
          onClick={handleNext}
          className="rin-fade-in flex flex-1 flex-col items-center justify-center text-center"
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

          {slides[index]?.id === "voice" ? (
            <>
              <div className="mb-8 h-24 w-24 rounded-full border border-[var(--rin-gold)]/60" />
              <p className="whitespace-pre-line text-xl leading-relaxed tracking-[0.05em] md:text-2xl">
                {"これは 朝の小さな儀式です。\n一日、三分。\n六十六日かけて 空気を整えていきます。"}
              </p>
              <p className="mt-6 max-w-lg text-xs tracking-[0.04em] text-[var(--rin-muted)] md:text-sm">
                This is a small morning ritual. 3 minutes a day. 66 days to refine your air.
              </p>
            </>
          ) : null}

          {slides[index]?.id === "door" ? (
            <p className="whitespace-pre-line text-xl leading-relaxed tracking-[0.05em] md:text-2xl">
              {"最初の七日間は 静かな準備です。\nその先には もう一つの扉があります。"}
            </p>
          ) : null}

          {slides[index]?.id === "day1" ? (
            <div onClick={(event) => event.stopPropagation()} className="w-full max-w-lg">
              <p className="text-6xl font-semibold tracking-[0.12em] md:text-7xl">Day 1</p>
              <p className="mt-4 text-2xl tracking-[0.08em] md:text-3xl">「空気をまとう」</p>
              <div className="mt-10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={completeOnboarding}
                  className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)]/60 px-6 py-3 text-sm tracking-[0.1em] transition hover:bg-[var(--rin-gold-soft)]"
                >
                  Begin Ritual
                </button>
                <button
                  type="button"
                  onClick={() => setShowMirrorNote((prev) => !prev)}
                  className="rounded-full border border-[var(--rin-gold)] px-6 py-3 text-sm tracking-[0.1em] transition hover:bg-[var(--rin-gold-soft)]/20"
                >
                  Mirror Mode
                </button>
              </div>
              {showMirrorNote ? (
                <p className="mt-4 text-sm text-[var(--rin-muted)]">
                  Mirror Mode is coming soon.
                </p>
              ) : null}
            </div>
          ) : null}
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
