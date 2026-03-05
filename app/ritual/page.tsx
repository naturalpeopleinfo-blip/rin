"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getJstDateString, getYesterdayJstDateString } from "@/lib/date";
import { incrementDay, loadDay } from "@/lib/day";
import { loadProgress, saveProgress, type Progress } from "@/lib/progress";
import { useSpotlight } from "@/lib/useSpotlight";

const STEP_DURATIONS = [20, 30, 30, 60, 40] as const;
const TOTAL_SECONDS = STEP_DURATIONS.reduce((sum, value) => sum + value, 0);
const THEMES = [
  "静かな自信をまとう",
  "選ばれる所作が整う",
  "迷いがほどける",
  "視線が澄む",
  "芯が立つ",
  "決断が軽くなる",
  "言葉が整う",
  "一段、品が上がる",
  "今日の自分が整う",
  "“私”に戻る",
];
const COMPLETION_MESSAGES = [
  "Today, you chose grace.",
  "Quietly, you leveled up.",
  "Keep the room within you.",
  "The day is yours, again.",
  "Carry this calm with you.",
] as const;
const STEPS = [
  {
    title: "GROUND",
    instruction: "椅子に深く座る。足裏を床に置く。肩をゆるめる。",
  },
  {
    title: "BREATHE",
    instruction: "4秒吸う。6秒吐く。これを2回。",
  },
  {
    title: "IMAGINE",
    instruction: "今日のテーマを静かに読む。\nその状態の自分の目元を想像する。",
  },
  {
    title: "DECLARE",
    instruction:
      "1) 小さく唱える: 「私は、選ばれる。」を3回。\n2) リズム動作: 胸を上から下へ、ゆっくり撫で下ろす ×2回。\n3) イメージ: 選ばれる所作が整った自分を、10〜15秒で1カットだけ想像する。",
  },
  {
    title: "INTEGRATE",
    instruction: "今日の一歩をひとつ決める。\n自分をひとつ褒める。",
  },
] as const;
const INTRO_QUOTE = {
  english: "Elegance is when the inside is as beautiful as the outside.",
  japanese: "エレガンスとは、内面が外見と同じように美しいこと。",
  author: "ココ・シャネル",
  role: "ファッションデザイナー",
} as const;

function pickRandomMessage(): string {
  return COMPLETION_MESSAGES[
    Math.floor(Math.random() * COMPLETION_MESSAGES.length)
  ];
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

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, "0")}`;
}

export default function RitualPage() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [timer, setTimer] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [showPreparation, setShowPreparation] = useState(true);
  const [day, setDay] = useState(() => loadDay());
  const [todaysTheme] = useState(
    () => THEMES[Math.floor(Math.random() * THEMES.length)],
  );
  const [completionMessage, setCompletionMessage] = useState(() => pickRandomMessage());
  const [startCueVisible, setStartCueVisible] = useState(false);
  const [stepFlash, setStepFlash] = useState(false);
  const [resetting, setResetting] = useState(false);
  const startCueFadeTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const previousStepIndexRef = useRef<number | null>(null);
  const ritualCardRef = useRef<HTMLElement | null>(null);

  const today = getJstDateString();
  const todayDisplay = useMemo(() => formatTokyoDate(), []);
  const yesterday = getYesterdayJstDateString();
  const doneToday = progress.lastCompletedDate === today;
  const elapsed = TOTAL_SECONDS - timer;
  const cumulativeDurations = STEP_DURATIONS.reduce<number[]>((acc, duration) => {
    const previous = acc[acc.length - 1] ?? 0;
    acc.push(previous + duration);
    return acc;
  }, []);
  const stepIndex = cumulativeDurations.findIndex((value) => elapsed < value);
  const currentStepIndex =
    stepIndex === -1 ? STEPS.length - 1 : Math.max(stepIndex, 0);
  const currentStepStartSeconds =
    currentStepIndex === 0 ? 0 : cumulativeDurations[currentStepIndex - 1];
  const currentStepElapsed = Math.max(0, elapsed - currentStepStartSeconds);
  const currentStepRemaining = Math.max(
    0,
    STEP_DURATIONS[currentStepIndex] - currentStepElapsed,
  );
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;
  const isDoneEnabled = timer === 0 && !doneToday;
  const currentStep = STEPS[currentStepIndex];
  const rawNextStep = currentStepIndex < STEPS.length - 1 ? STEPS[currentStepIndex + 1] : null;
  const nextStep = rawNextStep ?? null;
  const isImagineStep = currentStep.title === "IMAGINE";

  useSpotlight(ritualCardRef);

  useEffect(() => {
    if (!running) {
      return;
    }

    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const previous = previousStepIndexRef.current;
    previousStepIndexRef.current = currentStepIndex;
    if (previous === null || previous === currentStepIndex) {
      return;
    }

    let flashTimer: number | null = null;
    const flashStartTimer = window.setTimeout(() => {
      setStepFlash(true);
      flashTimer = window.setTimeout(() => {
        setStepFlash(false);
      }, 200);
    }, 0);
    return () => {
      window.clearTimeout(flashStartTimer);
      if (flashTimer !== null) {
        window.clearTimeout(flashTimer);
      }
    };
  }, [currentStepIndex]);

  useEffect(() => {
    return () => {
      if (startCueFadeTimerRef.current !== null) {
        window.clearTimeout(startCueFadeTimerRef.current);
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const triggerStartCue = () => {
    if (startCueFadeTimerRef.current !== null) {
      window.clearTimeout(startCueFadeTimerRef.current);
    }
    setStartCueVisible(true);
    startCueFadeTimerRef.current = window.setTimeout(() => {
      setStartCueVisible(false);
    }, 6000);
  };

  const handleComplete = () => {
    if (doneToday || timer !== 0) {
      return;
    }

    const nextStreak =
      progress.lastCompletedDate === yesterday ? progress.streak + 1 : 1;

    const nextProgress: Progress = {
      streak: nextStreak,
      points: progress.points + 2,
      lastCompletedDate: today,
    };
    const nextDay = incrementDay();

    saveProgress(nextProgress);
    setProgress(nextProgress);
    setDay(nextDay);
    setCompletionMessage(pickRandomMessage());
  };

  const handleBeginRitual = () => {
    setShowPreparation(false);
    setRunning(true);
    triggerStartCue();
  };

  return (
    <main className="min-h-screen bg-[var(--rin-bg)] px-6 py-10 text-[var(--rin-text)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex items-center justify-between text-sm text-[var(--rin-muted)]">
          <Link href="/" className="hover:underline">
            ← Lobby
          </Link>
          <p>継続 {progress.streak}日 / 記録 {progress.points}</p>
        </header>

        <section className="text-center">
          <h1 className="text-5xl font-medium tracking-[0.15em] md:text-6xl">RIN.</h1>
          <p className="mt-3 text-base tracking-[0.08em] text-[var(--rin-muted)] md:text-lg">
            {todayDisplay} / Day {day}
          </p>
        </section>

        <section
          ref={ritualCardRef}
          className="rin-spotlight rounded-2xl border border-[var(--rin-gold)]/60 bg-white/60 p-8 text-center shadow-sm"
        >
          <p className="text-xs tracking-[0.14em] text-[var(--rin-muted)]">
            Today&apos;s Theme
          </p>
          <p className="mt-2 text-3xl font-medium leading-relaxed">{todaysTheme}</p>
          <p className="mt-3 text-xs tracking-[0.1em] text-[var(--rin-muted)]">
            Quiet Direction for Today
          </p>
        </section>

        {showPreparation ? (
          <section className="rounded-2xl border border-[var(--rin-gold)]/60 bg-white/60 p-8 shadow-sm md:p-10">
            <p className="text-center text-xs uppercase tracking-[0.24em] text-[var(--rin-muted)]">
              Preparation
            </p>

            <div className="mt-8 rounded-xl border border-[var(--rin-gold)]/45 bg-[var(--rin-gold-soft)]/10 px-6 py-7 md:px-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--rin-muted)]">
                Quote
              </p>
              <blockquote className="mt-4">
                <p className="text-lg leading-[1.85] md:text-xl">
                  “{INTRO_QUOTE.english}”
                </p>
                <p className="mt-5 text-sm leading-[1.9] text-[var(--rin-muted)] md:text-base">
                  「{INTRO_QUOTE.japanese}」
                </p>
                <p className="mt-5 text-sm tracking-[0.08em] text-[var(--rin-muted)] md:text-base">
                  {INTRO_QUOTE.author} / {INTRO_QUOTE.role}
                </p>
              </blockquote>
            </div>

            <div className="mt-6 rounded-xl border border-[var(--rin-gold)]/45 bg-[var(--rin-gold-soft)]/10 px-6 py-7 md:px-8">
              <p className="text-sm tracking-[0.14em] text-[var(--rin-muted)] md:text-base">
                空気を整える
              </p>
              <p className="mt-4 text-sm leading-[1.95] text-[var(--rin-text)] md:text-base">
                香水なら1プッシュ。キャンドルなら火を灯す。お茶でもいい。好きな香りを、ひとつ近くに置く。
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--rin-muted)] md:text-base">
                準備が整ったら、BEGIN。
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleBeginRitual}
                className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)] px-12 py-3 text-sm tracking-[0.2em] transition hover:bg-[var(--rin-gold-soft)]/80"
              >
                BEGIN
              </button>
              <p className="text-sm tracking-[0.08em] text-[var(--rin-muted)]">
                3分のリチュアルを始めます
              </p>
            </div>
          </section>
        ) : (
          <>
            <section
              className={`rin-ritual-card relative overflow-hidden rounded-2xl border border-[var(--rin-gold)]/60 bg-white/60 p-8 text-center transition-[box-shadow,opacity,transform,filter] duration-500 ${
                running
                  ? "shadow-[0_14px_30px_rgba(61,53,39,0.12)]"
                  : "shadow-sm"
              } ${resetting ? "rin-resetting" : ""}`}
            >
              {isImagineStep ? (
                <div aria-hidden className="rin-imagine-bloom">
                  <span className="rin-imagine-bloom-core" />
                  <span className="rin-imagine-bloom-haze" />
                </div>
              ) : null}
              <p className="mt-3 text-6xl font-semibold tabular-nums transition-all duration-500" data-resettable>
                {formatTimer(timer)}
              </p>
              <p className="mt-2 text-sm tracking-[0.08em] text-[var(--rin-muted)] transition-all duration-500" data-resettable>
                Step {currentStepIndex + 1}/{STEPS.length} ·{" "}
                <span className="font-medium text-[var(--rin-text)]">
                  {formatTimer(currentStepRemaining)}
                </span>
              </p>
              <p
                className={`mt-2 min-h-[1rem] text-xs tracking-[0.08em] text-[var(--rin-muted)] transition-opacity duration-500 ${
                  startCueVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                今から3分。“私”に戻る。
              </p>
              <div className="mt-5">
                <div
                  className="h-[12px] w-full rounded-full shadow-inner shadow-[color:rgba(61,53,39,0.14)] transition-all duration-500"
                  data-resettable
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, color-mix(in srgb, var(--rin-gold-soft) 80%, transparent) 56%, color-mix(in srgb, var(--rin-gold-soft) 90%, transparent) 100%)",
                  }}
                >
                  <div
                    className="relative h-full overflow-hidden rounded-full transition-[width] duration-300 ease-in-out"
                    style={{
                      width: `${progressPercent}%`,
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--rin-gold-soft) 38%, white) 0%, var(--rin-gold) 52%, color-mix(in srgb, var(--rin-gold) 82%, #b89c53) 100%)",
                      boxShadow: "0 0 10px rgba(212, 190, 125, 0.18)",
                    }}
                  >
                    <span className="rin-progress-topline" />
                    {running ? <span className="rin-progress-glow" /> : null}
                  </div>
                </div>
                <p className="mt-2 text-center text-xs tracking-[0.08em] text-[var(--rin-muted)]">
                  {currentStepIndex + 1} / {STEPS.length}
                </p>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRunning(true);
                    triggerStartCue();
                  }}
                  disabled={running || timer === 0}
                  className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)] px-6 py-2 transition-all duration-300 disabled:cursor-not-allowed disabled:bg-[var(--rin-gold-soft)]/55 disabled:text-[var(--rin-muted)] disabled:shadow-none"
                >
                  {running ? "Running" : "Start"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setTimer(TOTAL_SECONDS);
                    setResetting(true);
                    if (resetTimerRef.current !== null) {
                      window.clearTimeout(resetTimerRef.current);
                    }
                    resetTimerRef.current = window.setTimeout(() => {
                      setResetting(false);
                    }, 360);
                  }}
                  className="rounded-full border border-[var(--rin-gold)] px-6 py-2 transition-colors duration-300"
                >
                  Reset
                </button>
              </div>

              <div
                className={`mt-7 rounded-xl border bg-[var(--rin-gold-soft)]/20 p-4 text-left transition-all duration-200 ${
                  stepFlash
                    ? "border-[var(--rin-gold)] shadow-sm"
                    : "border-[var(--rin-gold)]/60"
                }`}
                data-resettable
              >
                <p className="text-xs tracking-[0.18em] text-[var(--rin-muted)]">
                  STEP {currentStepIndex + 1}/{STEPS.length} · {currentStep.title}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm font-medium text-[var(--rin-text)] md:text-base">
                  {currentStep.instruction}
                </p>
              </div>
              {nextStep ? (
                <div className="mt-6 rounded-xl border border-[var(--rin-gold)]/45 bg-[var(--rin-gold-soft)]/10 p-4 text-left opacity-80">
                  <p className="text-xs tracking-[0.18em] text-[var(--rin-muted)]">
                    NEXT · {nextStep.title}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-xs text-[var(--rin-muted)]/90 md:text-sm">
                    {nextStep.instruction}
                  </p>
                </div>
              ) : null}
              <div className="mt-8 flex flex-col items-center gap-3 pb-2">
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={!isDoneEnabled}
                  className={`rounded-full border px-12 py-3 text-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDoneEnabled
                      ? "border-[var(--rin-gold)] bg-[var(--rin-gold)] text-[var(--rin-text)] shadow-sm"
                      : "border-[var(--rin-gold)] bg-[var(--rin-gold-soft)]/70"
                  }`}
                >
                  DONE
                </button>
                {doneToday ? (
                  <p className="text-sm text-[var(--rin-muted)]">
                    {completionMessage}
                  </p>
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
