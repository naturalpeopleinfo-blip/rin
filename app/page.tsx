"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadDay } from "@/lib/day";
import { isOnboarded } from "@/lib/onboarding";

const OPENING_LINES = [
  "世界が始まる前の、静かな場所。",
  "凛は、巡る。",
  "一日、三分。六十六日。",
  "今日の空気を整える。",
] as const;
const READING_CHARS_PER_SECOND = 5.5;
const DURATION_BASE_MS = 1400;
const DURATION_MIN_MS = 4800;
const DURATION_MAX_MS = 9500;
const FADE_MS = 600;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp(min: number, max: number, value: number): number {
  return Math.min(Math.max(value, min), max);
}

function getLineDurationMs(line: string): number {
  const charCount = line.replace(/\s+/g, "").length;
  const durationMs = DURATION_BASE_MS + (charCount / READING_CHARS_PER_SECOND) * 1000;
  return clamp(DURATION_MIN_MS, DURATION_MAX_MS, Math.round(durationMs));
}

function formatTokyoDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date).replace(/-/g, "/");
}

export default function LobbyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });
  const lineTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [day] = useState(() => loadDay());
  const today = useMemo(() => formatTokyoDate(), []);

  useEffect(() => {
    if (!isOnboarded()) {
      router.replace("/onboarding");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    if (!ready || paused) {
      return;
    }

    lineTimerRef.current = window.setTimeout(() => {
      if (prefersReducedMotion) {
        setLineIndex((prev) => (prev + 1) % OPENING_LINES.length);
        return;
      }

      setFadingOut(true);
      fadeTimerRef.current = window.setTimeout(() => {
        setLineIndex((prev) => (prev + 1) % OPENING_LINES.length);
        setFadingOut(false);
      }, FADE_MS);
    }, getLineDurationMs(OPENING_LINES[lineIndex]));

    return () => {
      if (lineTimerRef.current !== null) {
        window.clearTimeout(lineTimerRef.current);
      }
      if (fadeTimerRef.current !== null) {
        window.clearTimeout(fadeTimerRef.current);
      }
    };
  }, [ready, paused, lineIndex, prefersReducedMotion]);

  if (!ready) {
    return (
      <main className="min-h-screen bg-[var(--rin-bg)]" aria-label="Loading" />
    );
  }

  return (
    <main className="min-h-screen bg-[var(--rin-bg)] px-6 text-[var(--rin-text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center text-center">
        <h1 className="text-6xl font-medium tracking-[0.15em] md:text-7xl">RIN</h1>
        <div
          className="mt-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <p
            className={`text-base tracking-[0.08em] text-[var(--rin-muted)] md:text-lg ${
              prefersReducedMotion ? "" : "transition-opacity duration-500"
            } ${fadingOut ? "opacity-0" : "opacity-100"}`}
          >
            {OPENING_LINES[lineIndex]}
          </p>
        </div>
        <p className="mt-2 text-sm tracking-[0.1em] text-[var(--rin-muted)]">
          {today} / {day}日目
        </p>
        <p className="mt-2 text-sm tracking-[0.1em] text-[var(--rin-muted)]">
          Today is yours.
        </p>
        <Link
          href="/ritual"
          className="mt-12 rounded-full border border-[var(--rin-gold)] px-10 py-3 text-sm uppercase tracking-[0.18em] transition hover:bg-[var(--rin-gold-soft)]/30"
        >
          Begin
        </Link>
      </section>
    </main>
  );
}
