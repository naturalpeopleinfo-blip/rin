"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { getJstDateString, getYesterdayJstDateString } from "@/lib/date";
import { incrementDay, loadDay } from "@/lib/day";
import { loadProgress, saveProgress, type Progress } from "@/lib/progress";
import { useSpotlight } from "@/lib/useSpotlight";
import RinSealCard from "@/app/components/RinSealCard";

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
const SEAL_QUOTE = {
  author_en: "Coco Chanel",
  author_jp: "ココ・シャネル（デザイナー）",
  quote_en: INTRO_QUOTE.english,
  quote_jp: INTRO_QUOTE.japanese,
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
  const [paused, setPaused] = useState(false);
  const [showPreparation, setShowPreparation] = useState(true);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const [day, setDay] = useState(() => loadDay());
  const [todaysTheme] = useState(
    () => THEMES[Math.floor(Math.random() * THEMES.length)],
  );
  const [completionMessage, setCompletionMessage] = useState(() => pickRandomMessage());
  const [startCueVisible, setStartCueVisible] = useState(false);
  const [stepFlash, setStepFlash] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [timerSettling, setTimerSettling] = useState(false);
  const [showSeal, setShowSeal] = useState(false);
  const [sealDay, setSealDay] = useState<number | null>(null);
  const [canShareSeal, setCanShareSeal] = useState(false);
  const [isSavingSeal, setIsSavingSeal] = useState(false);
  const [isSharingSeal, setIsSharingSeal] = useState(false);
  const startCueFadeTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const timerSettleRef = useRef<number | null>(null);
  const previousStepIndexRef = useRef<number | null>(null);
  const completionTriggeredRef = useRef(false);
  const sealCardRef = useRef<HTMLDivElement | null>(null);
  const ritualCardRef = useRef<HTMLElement | null>(null);

  const today = getJstDateString();
  const todayDisplay = useMemo(() => formatTokyoDate(), []);
  const yesterday = getYesterdayJstDateString();
  const doneToday = progress.lastCompletedDate === today;
  const elapsed = TOTAL_SECONDS - timer;
  const controlsLocked = countdownValue !== null;
  const cumulativeDurations = STEP_DURATIONS.reduce<number[]>((acc, duration) => {
    const previous = acc[acc.length - 1] ?? 0;
    acc.push(previous + duration);
    return acc;
  }, []);
  const stepIndex = cumulativeDurations.findIndex((value) => elapsed < value);
  const currentStepIndex = stepIndex === -1 ? STEPS.length - 1 : Math.max(stepIndex, 0);
  const currentStepStartSeconds =
    currentStepIndex === 0 ? 0 : cumulativeDurations[currentStepIndex - 1];
  const currentStepElapsed = Math.max(0, elapsed - currentStepStartSeconds);
  const currentStepRemaining = Math.max(
    0,
    STEP_DURATIONS[currentStepIndex] - currentStepElapsed,
  );
  const ritualProgressRatio = Math.min(1, Math.max(0, elapsed / TOTAL_SECONDS));
  const topChamberPercent = (1 - ritualProgressRatio) * 100;
  const bottomChamberPercent = ritualProgressRatio * 100;
  const sessionLabel = paused ? "Paused" : running ? "In ritual" : "Ready";
  const isDoneEnabled = timer === 0 && !doneToday;
  const currentStep = STEPS[currentStepIndex];
  const isImagineStep = currentStep.title === "IMAGINE";

  useSpotlight(ritualCardRef);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }
    const shareAvailable =
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function";
    setCanShareSeal(shareAvailable);
  }, []);

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
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", onChange);
    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (startCueFadeTimerRef.current !== null) {
        window.clearTimeout(startCueFadeTimerRef.current);
      }
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      if (timerSettleRef.current !== null) {
        window.clearTimeout(timerSettleRef.current);
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

  const applyCompletionProgress = useCallback(() => {
    if (doneToday) {
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
  }, [doneToday, progress.lastCompletedDate, progress.points, progress.streak, today, yesterday]);

  const clearCountdown = () => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownValue(null);
  };

  const startWithCountdown = () => {
    if (prefersReducedMotion) {
      clearCountdown();
      setRunning(true);
      setPaused(false);
      triggerStartCue();
      return;
    }
    clearCountdown();
    setRunning(false);
    setCountdownValue(5);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdownValue((prev) => {
        if (prev === null) {
          return null;
        }
        if (prev <= 1) {
          clearCountdown();
          setRunning(true);
          setPaused(false);
          triggerStartCue();
          setTimerSettling(true);
          if (timerSettleRef.current !== null) {
            window.clearTimeout(timerSettleRef.current);
          }
          timerSettleRef.current = window.setTimeout(() => {
            setTimerSettling(false);
          }, 460);
          return null;
        }
        return prev - 1;
      });
    }, 760);
  };

  const handleComplete = () => {
    if (!isDoneEnabled) {
      return;
    }
    applyCompletionProgress();
  };

  const handleBeginRitual = () => {
    setShowPreparation(false);
    completionTriggeredRef.current = false;
    setShowSeal(false);
    startWithCountdown();
  };

  const handlePause = () => {
    if (!running) {
      return;
    }
    setRunning(false);
    setPaused(true);
  };

  const handleResume = () => {
    if (running || timer === 0) {
      return;
    }
    setRunning(true);
    setPaused(false);
  };

  const handleReset = () => {
    clearCountdown();
    setRunning(false);
    setPaused(false);
    setTimerSettling(false);
    setShowSeal(false);
    completionTriggeredRef.current = false;
    setTimer(TOTAL_SECONDS);
    setResetting(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setResetting(false);
    }, 360);
  };

  const getSealPng = async (): Promise<string> => {
    if (!sealCardRef.current) {
      throw new Error("seal card not ready");
    }
    return toPng(sealCardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#f4efe3",
      cacheBust: true,
    });
  };

  const sealFilename = `RIN-Day-${String(sealDay ?? day).padStart(2, "0")}.png`;

  const handleSaveSeal = async () => {
    if (isSavingSeal) {
      return;
    }
    setIsSavingSeal(true);
    try {
      const dataUrl = await getSealPng();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = sealFilename;
      link.click();
    } finally {
      setIsSavingSeal(false);
    }
  };

  const handleShareSeal = async () => {
    if (!canShareSeal || isSharingSeal) {
      return;
    }
    setIsSharingSeal(true);
    try {
      const dataUrl = await getSealPng();
      const blob = await fetch(dataUrl).then((response) => response.blob());
      const file = new File([blob], sealFilename, { type: "image/png" });
      if (!navigator.canShare({ files: [file] })) {
        setCanShareSeal(false);
        return;
      }
      await navigator.share({
        title: "RIN",
        text: "",
        files: [file],
      });
    } finally {
      setIsSharingSeal(false);
    }
  };

  useEffect(() => {
    if (
      showPreparation ||
      controlsLocked ||
      timer !== 0 ||
      completionTriggeredRef.current
    ) {
      return;
    }
    completionTriggeredRef.current = true;
    setRunning(false);
    setPaused(false);
    setSealDay(day);
    applyCompletionProgress();
    setShowSeal(true);
  }, [applyCompletionProgress, controlsLocked, day, showPreparation, timer]);

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
          <h1 className="text-5xl font-medium tracking-[0.15em] md:text-6xl">RIN</h1>
          <p className="mt-3 text-base tracking-[0.08em] text-[var(--rin-muted)] md:text-lg">
            {todayDisplay} / Day {day}
          </p>
        </section>

        <section
          ref={ritualCardRef}
          className="rin-spotlight card-page page-transition rounded-2xl border border-[var(--rin-gold)]/60 p-8 text-center shadow-sm"
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
          <section className="rin-quiet-gift card-page page-transition relative overflow-hidden rounded-2xl border border-[var(--rin-gold)]/60 p-8 shadow-sm md:p-10">
            <div className="flex justify-center">
              <Image
                src="/illustrations/feather.svg"
                alt=""
                aria-hidden
                width={42}
                height={42}
                className="opacity-70"
              />
            </div>
            <p className="text-center text-xs uppercase tracking-[0.24em] text-[var(--rin-muted)]">
              Quiet Gift
            </p>
            <p className="mt-2 text-center text-sm tracking-[0.08em] text-[var(--rin-muted)]">
              今日の静かな贈りもの
            </p>
            <div className="section-divider" />

            <blockquote className="card-page mt-8 rounded-xl border border-[var(--rin-gold)]/35 bg-white/34 px-6 py-7 md:px-8">
              <p className="rin-quiet-gift-quote text-lg leading-[1.95] italic md:text-xl">
                “{INTRO_QUOTE.english}”
              </p>
              <p className="mt-5 text-sm leading-[1.9] text-[var(--rin-muted)] md:text-[15px]">
                「{INTRO_QUOTE.japanese}」
              </p>
              <p className="mt-5 text-xs tracking-[0.08em] text-[var(--rin-muted)]/90 md:text-sm">
                ココ・シャネル（ファッションデザイナー）
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--rin-text)]/90">
                この一行を胸に、リチュアルへ。
              </p>
            </blockquote>

            <div className="card-page mt-6 rounded-xl border border-[var(--rin-gold)]/35 bg-white/26 px-6 py-7 md:px-8">
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/illustrations/botanical.svg"
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  className="opacity-75"
                />
                <span className="text-[10px] tracking-[0.2em] text-[var(--rin-muted)]">✦</span>
              </div>
              <p className="text-sm tracking-[0.14em] text-[var(--rin-muted)] md:text-base">
                整える
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--rin-text)]">
                好きな香りをひと吹き。今日はこの言葉を胸に置いて始めましょう。
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--rin-text)] md:text-base">
                <li>・香りを1プッシュ。</li>
                <li>・深呼吸をひとつ。</li>
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-[var(--rin-muted)] md:text-base">
                香水でも、お茶でも。あなたが落ち着く香りを、そっと手元に。
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--rin-text)]/90">
                準備ができたら、BEGIN。
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleBeginRitual}
                disabled={controlsLocked}
                className="rin-begin-button rounded-full border border-[var(--rin-gold)] px-12 py-3 text-sm tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rin-gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rin-bg)]"
              >
                BEGIN
              </button>
              <p className="text-sm tracking-[0.08em] text-[var(--rin-muted)]">
                3分のリチュアルへ進みます
              </p>
            </div>
          </section>
        ) : (
          <>
            <section
              className={`rin-ritual-card card-page page-transition relative overflow-hidden rounded-2xl border border-[var(--rin-gold)]/60 p-8 text-center transition-[box-shadow,opacity,transform,filter] duration-500 ${
                running && !controlsLocked
                  ? "shadow-[0_14px_30px_rgba(61,53,39,0.12)]"
                  : "shadow-sm"
              } ${resetting ? "rin-resetting" : ""}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/illustrations/moon.svg"
                  alt=""
                  aria-hidden
                  width={26}
                  height={26}
                  className="opacity-75"
                />
                <span className="text-[10px] tracking-[0.2em] text-[var(--rin-muted)]">✦</span>
              </div>
              {isImagineStep ? (
                <div aria-hidden className="rin-imagine-bloom">
                  <span className="rin-imagine-bloom-core" />
                  <span className="rin-imagine-bloom-haze" />
                </div>
              ) : null}
              <div className="relative mt-3 min-h-[5rem] md:min-h-[5.6rem]" data-resettable>
                {controlsLocked ? (
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                    <p
                      key={countdownValue}
                      className="rin-countdown-pop text-[4.1rem] font-semibold tracking-[0.12em] text-[var(--rin-text)] md:text-[4.8rem]"
                    >
                      {countdownValue}
                    </p>
                  </div>
                ) : null}
                {!controlsLocked ? (
                  <p
                    className={`text-6xl font-semibold tabular-nums transition-all duration-500 ${
                      timerSettling ? "rin-timer-settle" : ""
                    }`}
                  >
                    {formatTimer(timer)}
                  </p>
                ) : null}
              </div>
              {!controlsLocked ? (
                <>
                  <p className="mt-2 text-sm tracking-[0.08em] text-[var(--rin-muted)] transition-all duration-500" data-resettable>
                    {sessionLabel} ·{" "}
                    <span className="font-medium text-[var(--rin-text)]">
                      {formatTimer(currentStepRemaining)}
                    </span>
                  </p>
                  <p
                    className={`mt-2 min-h-[1rem] text-xs tracking-[0.08em] text-[var(--rin-muted)] transition-opacity duration-500 ${
                      startCueVisible || (paused && !controlsLocked) ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {paused && !controlsLocked ? "Paused" : "今から3分。“私”に戻る。"}
                  </p>
                  <div className="mt-6 flex justify-center" data-resettable>
                    <div className="rin-hourglass-pill">
                      <div className="rin-hourglass-chamber rin-hourglass-top">
                        <div
                          className={`rin-hourglass-liquid ${running ? "rin-hourglass-flow" : ""}`}
                          style={{ height: `${topChamberPercent}%` }}
                        />
                      </div>
                      <div className="rin-hourglass-neck" />
                      <div className="rin-hourglass-chamber rin-hourglass-bottom">
                        <div
                          className={`rin-hourglass-liquid ${running ? "rin-hourglass-flow" : ""}`}
                          style={{ height: `${bottomChamberPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-7 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={running ? handlePause : handleResume}
                      disabled={timer === 0}
                      className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)] px-6 py-2 transition-all duration-300 disabled:cursor-not-allowed disabled:bg-[var(--rin-gold-soft)]/55 disabled:text-[var(--rin-muted)] disabled:shadow-none"
                    >
                      {running ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
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
                      {currentStep.title}
                    </p>
                    <p className="mt-3 whitespace-pre-line text-sm font-medium text-[var(--rin-text)] md:text-base">
                      {currentStep.instruction}
                    </p>
                  </div>
                  <div className="mt-8 flex flex-col items-center gap-3 pb-2">
                    <p className="text-[11px] tracking-[0.14em] text-[var(--rin-muted)]/85">
                      {currentStepIndex + 1}/{STEPS.length}
                    </p>
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={!isDoneEnabled || controlsLocked || showSeal}
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
                </>
              ) : (
                <p className="mt-6 text-xs tracking-[0.12em] text-[var(--rin-muted)]/80">
                  Ritual starts in...
                </p>
              )}
            </section>
          </>
        )}
      </div>
      {showSeal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(34,29,21,0.36)] p-6 backdrop-blur-[4px]">
          <div className="w-full max-w-lg">
            <RinSealCard
              ref={sealCardRef}
              theme={todaysTheme}
              day={sealDay ?? day}
              quote={SEAL_QUOTE}
            />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSaveSeal}
                disabled={isSavingSeal}
                className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)] px-6 py-2 text-sm tracking-[0.08em] transition hover:bg-[var(--rin-gold-soft)]/80 disabled:opacity-60"
              >
                {isSavingSeal ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleShareSeal}
                disabled={!canShareSeal || isSharingSeal}
                className="rounded-full border border-[var(--rin-gold)] px-6 py-2 text-sm tracking-[0.08em] transition hover:bg-[var(--rin-gold-soft)]/18 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSharingSeal ? "Sharing..." : "Share"}
              </button>
              <button
                type="button"
                onClick={() => setShowSeal(false)}
                className="rounded-full border border-[var(--rin-gold)]/65 px-6 py-2 text-sm tracking-[0.08em] text-[var(--rin-muted)] transition hover:bg-[var(--rin-gold-soft)]/16"
              >
                Close
              </button>
            </div>
            {!canShareSeal ? (
              <p className="mt-2 text-center text-xs text-[var(--rin-muted)]">
                Share is unavailable in this browser.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
