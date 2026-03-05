"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJstDateString, getYesterdayJstDateString } from "@/lib/date";
import { incrementDay, loadDay } from "@/lib/day";
import { isOnboarded } from "@/lib/onboarding";
import { loadProgress, saveProgress, type Progress } from "@/lib/progress";
import { useRinSfx } from "@/lib/useRinSfx";
import BreathRing from "@/app/components/BreathRing";

const STEP_DURATIONS = [20, 30, 30, 25, 25, 25, 25] as const;
const TOTAL_SECONDS = STEP_DURATIONS.reduce((sum, value) => sum + value, 0);
const TOTAL_DAYS = 66;
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
const STEPS = [
  {
    title: "RESET",
    instruction:
      "今をリセット。\n椅子に座り、足裏を床へ。\n肩の力を抜き、ゆっくり呼吸する。",
  },
  {
    title: "BREATHE",
    instruction:
      "呼吸。\n鼻から吸って、ゆっくり吐く。\nもう一度、空気を整える。",
  },
  {
    title: "IMAGINE",
    instruction:
      "空気をイメージする。\n静かなラウンジの扉を開けて、中に入る。\nその落ち着いた空気を、自分の周りにも作る。",
  },
  {
    title: "BECOME",
    instruction:
      "役に入る。\n今日選んだ自分を、先に演じてみる。\n人は演じた役に近づいていく。",
  },
  {
    title: "DECLARE",
    instruction:
      "言葉を置く。\n「私は、余裕がある」と静かに言う。\nもう一度、「私は、選ばれる人だ」。",
  },
  {
    title: "MOVE",
    instruction: "行動。\n背筋を伸ばし、ゆっくり立つ。\n一歩だけ前へ進む。",
  },
  {
    title: "SWITCH",
    instruction: "リズムを切り替える。\n胸をトン、もう一度トン。\n静かに「よし。」と言う。",
  },
] as const;
const NEXT_ACTION_HINTS = [
  "呼吸を静かに重ねる",
  "ラウンジの空気を思い描く",
  "今日選ぶ役を先に演じる",
  "言葉を短く宣言する",
  "姿勢と一歩で整える",
  "胸をトンと2回、スイッチする",
  null,
] as const;
const INTRO_QUOTE = {
  english: "Elegance is when the inside is as beautiful as the outside.",
  japanese: "エレガンスとは、内面が外見と同じように美しいこと。",
  author: "ココ・シャネル",
  role: "デザイナー",
} as const;
const SEAL_QUOTE = {
  author_en: "Coco Chanel",
  author_jp: "ココ・シャネル（デザイナー）",
  quote_en: INTRO_QUOTE.english,
  quote_jp: INTRO_QUOTE.japanese,
} as const;

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

const COUNTDOWN_TICK_MS = 1300;

export default function RitualPage() {
  const router = useRouter();
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
  const [resetting, setResetting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [stepTransitionState, setStepTransitionState] = useState<"idle" | "out" | "in">("idle");
  const [journeyDay] = useState(() => {
    if (typeof window === "undefined") {
      return 1;
    }
    const storedDay = window.localStorage.getItem("rin_day");
    const parsedDay = Number.parseInt(storedDay ?? "1", 10);
    if (!Number.isNaN(parsedDay) && parsedDay > 0) {
      return Math.min(parsedDay, TOTAL_DAYS);
    }
    window.localStorage.setItem("rin_day", "1");
    return 1;
  });
  const resetTimerRef = useRef<number | null>(null);
  const countdownTimeoutRef = useRef<number | null>(null);
  const completeTransitionRef = useRef<number | null>(null);
  const stepOutRef = useRef<number | null>(null);
  const stepInRef = useRef<number | null>(null);
  const stepIdleRef = useRef<number | null>(null);
  const completionTriggeredRef = useRef(false);
  const { playStart, playTransition } = useRinSfx();

  const today = getJstDateString();
  const todayDisplay = useMemo(() => formatTokyoDate(), []);
  const yesterday = getYesterdayJstDateString();
  const elapsed = TOTAL_SECONDS - timer;
  const controlsLocked = countdownValue !== null;
  const cumulativeDurations = STEP_DURATIONS.reduce<number[]>((acc, duration) => {
    const previous = acc[acc.length - 1] ?? 0;
    acc.push(previous + duration);
    return acc;
  }, []);
  const stepIndex = cumulativeDurations.findIndex((value) => elapsed < value);
  const currentStepIndex = stepIndex === -1 ? STEPS.length - 1 : Math.max(stepIndex, 0);
  const ritualProgressRatio = Math.min(1, Math.max(0, elapsed / TOTAL_SECONDS));
  const currentStep = STEPS[currentStepIndex];
  const displayedStep = STEPS[displayedStepIndex];
  const displayedInstruction = displayedStep.instruction.replace(/\n+/g, " ");
  const isBreatheStep = (currentStep.title || "").toUpperCase().includes("BREATHE");
  const nextActionLabel = NEXT_ACTION_HINTS[currentStepIndex];

  useEffect(() => {
    if (!isOnboarded()) {
      router.replace("/onboarding");
    }
  }, [router]);

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
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (countdownTimeoutRef.current !== null) {
        window.clearTimeout(countdownTimeoutRef.current);
      }
      if (completeTransitionRef.current !== null) {
        window.clearTimeout(completeTransitionRef.current);
      }
      if (stepOutRef.current !== null) {
        window.clearTimeout(stepOutRef.current);
      }
      if (stepInRef.current !== null) {
        window.clearTimeout(stepInRef.current);
      }
      if (stepIdleRef.current !== null) {
        window.clearTimeout(stepIdleRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showPreparation || displayedStepIndex === currentStepIndex) {
      return;
    }
    stepOutRef.current = window.setTimeout(() => {
      setStepTransitionState("out");
    }, 0);
    stepInRef.current = window.setTimeout(() => {
      setDisplayedStepIndex(currentStepIndex);
      setStepTransitionState("in");
    }, prefersReducedMotion ? 0 : 660);
    stepIdleRef.current = window.setTimeout(() => {
      setStepTransitionState("idle");
    }, prefersReducedMotion ? 0 : 1640);
    return () => {
      if (stepOutRef.current !== null) {
        window.clearTimeout(stepOutRef.current);
      }
      if (stepInRef.current !== null) {
        window.clearTimeout(stepInRef.current);
      }
      if (stepIdleRef.current !== null) {
        window.clearTimeout(stepIdleRef.current);
      }
    };
  }, [currentStepIndex, displayedStepIndex, prefersReducedMotion, showPreparation]);

  const clearCountdown = () => {
    if (countdownTimeoutRef.current !== null) {
      window.clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setCountdownValue(null);
  };

  const startWithCountdown = () => {
    clearCountdown();
    setTimer(TOTAL_SECONDS);
    setRunning(false);
    setPaused(false);
    setCountdownValue(5);
  };

  useEffect(() => {
    if (countdownValue === null) {
      return;
    }
    countdownTimeoutRef.current = window.setTimeout(() => {
      setCountdownValue((prev) => {
        if (prev === null) {
          return null;
        }
        if (prev <= 1) {
          playTransition();
          setTimer(TOTAL_SECONDS);
          setRunning(true);
          setPaused(false);
          return null;
        }
        return prev - 1;
      });
    }, prefersReducedMotion ? 1000 : COUNTDOWN_TICK_MS);
    return () => {
      if (countdownTimeoutRef.current !== null) {
        window.clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, [countdownValue, playTransition, prefersReducedMotion]);

  const handleBeginRitual = () => {
    playStart();
    setShowPreparation(false);
    setTimer(TOTAL_SECONDS);
    setDisplayedStepIndex(0);
    setStepTransitionState("idle");
    completionTriggeredRef.current = false;
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

  useEffect(() => {
    if (
      showPreparation ||
      controlsLocked ||
      timer !== 0 ||
      completionTriggeredRef.current
    ) {
      return;
    }
    const completeNow = window.setTimeout(() => {
      completionTriggeredRef.current = true;
      setRunning(false);
      setPaused(false);
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

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "rin_share_payload",
          JSON.stringify({
            theme: todaysTheme,
            day,
            quote: SEAL_QUOTE,
            streak: nextProgress.streak,
            points: nextProgress.points,
          }),
        );
      }

      setIsCompleting(true);
      completeTransitionRef.current = window.setTimeout(
        () => router.push("/share"),
        prefersReducedMotion ? 0 : 760,
      );
    }, 0);
    return () => window.clearTimeout(completeNow);
  }, [
    controlsLocked,
    day,
    prefersReducedMotion,
    progress.lastCompletedDate,
    progress.points,
    progress.streak,
    router,
    showPreparation,
    timer,
    today,
    todaysTheme,
    yesterday,
  ]);

  return (
    <main
      className={`h-[100svh] min-h-[100svh] overflow-hidden overscroll-none bg-[var(--rin-bg)] text-[var(--rin-text)] transition-opacity duration-[800ms] ease-in-out ${
        isCompleting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pt-3.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <header className="shrink-0 rounded-xl border border-[var(--rin-gold)]/50 bg-[color:rgba(255,251,241,0.72)] px-3 py-2 text-[10px] tracking-[0.07em] text-[var(--rin-muted)]">
          <div className="flex items-center justify-between">
            <p>{todayDisplay}</p>
            <p>Day {journeyDay}/{TOTAL_DAYS}</p>
          </div>
          <div className="mt-2.5 text-center">
            <div className="mx-auto max-w-[340px] rounded-xl border border-[var(--rin-gold)]/38 bg-[var(--rin-paper)] px-4 py-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
              <p className="text-[16px] tracking-[0.055em] text-[var(--rin-text)]">
                Theme：{todaysTheme}
              </p>
            </div>
          </div>
        </header>

        <section className="flex flex-1 min-h-0 flex-col items-center justify-center px-2 py-2">
          {showPreparation ? (
            <div className="w-full text-center">
              <p className="text-[10px] tracking-[0.22em] text-[var(--rin-muted)]">QUIET GIFT</p>
              <article className="rin-quiet-gift-sheet mx-auto mt-3 w-full max-w-[22.5rem] px-5 py-6 text-center">
                <p className="rin-quiet-gift-quote text-xs leading-[1.55] italic text-[var(--rin-muted)]/78">
                  “{INTRO_QUOTE.english}”
                </p>
                <p className="mt-3 text-[1.03rem] leading-[1.8] text-[var(--rin-text)]">
                  「{INTRO_QUOTE.japanese}」
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-[var(--rin-muted)]">
                  {INTRO_QUOTE.author} <span className="text-[10px] text-[var(--rin-muted)]/82">（{INTRO_QUOTE.role}）</span>
                </p>
              </article>
              <p className="mt-2.5 whitespace-pre-line text-[11px] leading-[1.65] tracking-[0.04em] text-[var(--rin-muted)]/90">
                {"この言葉を合図に、呼吸と“香り”で朝を整えます。\n香水をひと押し。コーヒーでも、お茶でも。\nあなたが落ち着く香りをそっと手元に。準備できたらBEGIN。"}
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-1 min-h-0 flex-col items-center justify-center text-center">
              <div
                className={`rin-step-shell w-full ${
                  stepTransitionState === "out"
                    ? "is-out"
                    : stepTransitionState === "in"
                      ? "is-in"
                      : "is-idle"
                }`}
              >
                <p className="rin-step-meta text-[11px] tracking-[0.1em] text-[var(--rin-muted)]/88">
                  Step {displayedStepIndex + 1}/{STEPS.length}
                </p>
                <p className="rin-step-label mt-1 text-[10px] tracking-[0.2em] text-[var(--rin-muted)]">
                  {displayedStep.title}
                </p>
                <p className="rin-ritual-copy mx-auto mt-2.5 text-[var(--rin-text)]">
                  {displayedInstruction}
                </p>
              </div>
              <div className="relative z-[2] mt-3.5 flex min-h-[12.5rem] items-center justify-center">
                <BreathRing
                  timeLabel={formatTimer(timer)}
                  countdownValue={countdownValue}
                  progress={ritualProgressRatio}
                  mode={isBreatheStep ? "breathe" : "ambient"}
                  active={running && !paused && timer > 0 && !controlsLocked}
                  paused={paused || controlsLocked}
                />
              </div>
            </div>
          )}
        </section>

        <footer className="shrink-0 pt-1">
          <section
            className={`mx-auto w-full max-w-[22.5rem] rounded-2xl border border-[var(--rin-gold)]/60 bg-[color:rgba(251,247,236,0.86)] p-3 shadow-sm transition-[opacity,transform,filter] duration-[2000ms] ease-out ${
              resetting ? "rin-resetting" : ""
            }`}
          >
            <div
              className={`transition-[opacity,transform] ease-in-out ${
                controlsLocked
                  ? "pointer-events-none translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100"
              } ${prefersReducedMotion ? "duration-0" : "duration-[600ms]"}`}
            >
              <p
                className={`text-center text-[11px] tracking-[0.04em] text-[var(--rin-muted)]/90 transition-opacity duration-[1200ms] ${
                  nextActionLabel && !showPreparation ? "opacity-100" : "opacity-0"
                }`}
              >
                {nextActionLabel ? `NEXT: ${nextActionLabel}` : ""}
              </p>

              <div className="mt-2.5 flex w-full min-h-[2.25rem] items-center justify-center">
                {showPreparation ? (
                  <button
                    type="button"
                    onClick={handleBeginRitual}
                    disabled={controlsLocked}
                    className="rin-begin-button rounded-full border border-[var(--rin-gold)] px-10 py-2 text-xs tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rin-gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rin-bg)]"
                  >
                    BEGIN
                  </button>
                ) : (
                  <div className="flex w-full justify-center">
                    <div className="inline-flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={running ? handlePause : handleResume}
                        disabled={timer === 0 || controlsLocked}
                        className="rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)]/45 px-5 py-1.5 text-[11px] tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {running ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={controlsLocked}
                        className="rounded-full border border-[var(--rin-gold)] px-5 py-1.5 text-[11px] tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </footer>
      </div>
    </main>
  );
}
