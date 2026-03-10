"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getJstDateString, getYesterdayJstDateString } from "@/lib/date";
import { incrementDay, loadDay } from "@/lib/day";
import { isOnboarded } from "@/lib/onboarding";
import { loadProgress, saveProgress, type Progress } from "@/lib/progress";
import { useRinSfx } from "@/lib/useRinSfx";
import BreathRing, { type BreathRingStepTone } from "@/app/components/BreathRing";

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
const PREPARATION_REVEAL_TIMINGS_MS = {
  card: 250,
  description: 700,
  ring: 1200,
  begin: 1700,
} as const;
const BEGIN_ENTRANCE_TIMINGS_MS = {
  buttonPress: 180,
  ringInhaleDelay: 140,
  startCountdown: 860,
} as const;
const COMPLETION_TIMINGS_MS = {
  messageReveal: 920,
  fadeOut: 2260,
  routePush: 2980,
} as const;

type PreparationRevealState = {
  theme: boolean;
  card: boolean;
  description: boolean;
  ring: boolean;
  begin: boolean;
};

type CompletionPhase = "idle" | "settling" | "message" | "fading";

const PREPARATION_REVEAL_BASE: PreparationRevealState = {
  theme: true,
  card: false,
  description: false,
  ring: false,
  begin: false,
};

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
  const [beginPressing, setBeginPressing] = useState(false);
  const [beginEntranceActive, setBeginEntranceActive] = useState(false);
  const [ringEntranceActive, setRingEntranceActive] = useState(false);
  const [preparationReveal, setPreparationReveal] = useState<PreparationRevealState>(
    PREPARATION_REVEAL_BASE,
  );
  const [completionPhase, setCompletionPhase] = useState<CompletionPhase>("idle");
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
  const beginPressRef = useRef<number | null>(null);
  const beginRingRef = useRef<number | null>(null);
  const beginStartRef = useRef<number | null>(null);
  const completionMessageRef = useRef<number | null>(null);
  const completionFadeRef = useRef<number | null>(null);
  const completionTriggeredRef = useRef(false);
  const { playStart, playTransition } = useRinSfx();

  const today = getJstDateString();
  const todayDisplay = useMemo(() => formatTokyoDate(), []);
  const yesterday = getYesterdayJstDateString();
  const elapsed = TOTAL_SECONDS - timer;
  const controlsLocked = countdownValue !== null || completionPhase !== "idle";
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
  const displayedInstructionParagraphs = useMemo(() => {
    const lines = displayedStep.instruction
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 2) {
      return [lines.join(" ")].filter(Boolean);
    }

    const firstParagraph = lines.slice(0, 2).join(" ");
    const secondParagraph = lines.slice(2).join(" ");
    return [firstParagraph, secondParagraph].filter(Boolean);
  }, [displayedStep.instruction]);
  const isBreatheStep = (currentStep.title || "").toUpperCase().includes("BREATHE");
  const nextActionLabel = NEXT_ACTION_HINTS[currentStepIndex];
  const isActivePhase = !showPreparation;
  const ringTimeLabel = showPreparation ? formatTimer(TOTAL_SECONDS) : formatTimer(timer);
  const ringProgress = showPreparation ? 0.06 : ritualProgressRatio;
  const ringMode = !showPreparation && isBreatheStep ? "breathe" : "ambient";
  const ringStepTone: BreathRingStepTone = showPreparation
    ? "preparation"
    : (currentStep.title.toLowerCase() as BreathRingStepTone);
  const ringActive = !showPreparation && running && !paused && timer > 0 && !controlsLocked;
  const ringPaused = !showPreparation && (paused || controlsLocked);

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
    if (!showPreparation || prefersReducedMotion) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setPreparationReveal(PREPARATION_REVEAL_BASE);
    }, 0);
    const cardTimer = window.setTimeout(() => {
      setPreparationReveal((prev) => ({ ...prev, card: true }));
    }, PREPARATION_REVEAL_TIMINGS_MS.card);
    const descriptionTimer = window.setTimeout(() => {
      setPreparationReveal((prev) => ({ ...prev, description: true }));
    }, PREPARATION_REVEAL_TIMINGS_MS.description);
    const ringTimer = window.setTimeout(() => {
      setPreparationReveal((prev) => ({ ...prev, ring: true }));
    }, PREPARATION_REVEAL_TIMINGS_MS.ring);
    const beginTimer = window.setTimeout(() => {
      setPreparationReveal((prev) => ({ ...prev, begin: true }));
    }, PREPARATION_REVEAL_TIMINGS_MS.begin);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(cardTimer);
      window.clearTimeout(descriptionTimer);
      window.clearTimeout(ringTimer);
      window.clearTimeout(beginTimer);
    };
  }, [prefersReducedMotion, showPreparation]);

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
      if (beginPressRef.current !== null) {
        window.clearTimeout(beginPressRef.current);
      }
      if (beginRingRef.current !== null) {
        window.clearTimeout(beginRingRef.current);
      }
      if (beginStartRef.current !== null) {
        window.clearTimeout(beginStartRef.current);
      }
      if (completionMessageRef.current !== null) {
        window.clearTimeout(completionMessageRef.current);
      }
      if (completionFadeRef.current !== null) {
        window.clearTimeout(completionFadeRef.current);
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
    setCompletionPhase("idle");
    setIsCompleting(false);
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
    if (beginEntranceActive || controlsLocked) {
      return;
    }

    const startCountdown = () => {
      setBeginEntranceActive(false);
      setBeginPressing(false);
      setRingEntranceActive(false);
      setShowPreparation(false);
      setTimer(TOTAL_SECONDS);
      setDisplayedStepIndex(0);
      setStepTransitionState("idle");
      completionTriggeredRef.current = false;
      startWithCountdown();
    };

    playStart();
    if (prefersReducedMotion) {
      startCountdown();
      return;
    }

    setBeginEntranceActive(true);
    setBeginPressing(true);
    setRingEntranceActive(false);

    if (beginPressRef.current !== null) {
      window.clearTimeout(beginPressRef.current);
    }
    if (beginRingRef.current !== null) {
      window.clearTimeout(beginRingRef.current);
    }
    if (beginStartRef.current !== null) {
      window.clearTimeout(beginStartRef.current);
    }

    beginPressRef.current = window.setTimeout(() => {
      setBeginPressing(false);
    }, BEGIN_ENTRANCE_TIMINGS_MS.buttonPress);

    beginRingRef.current = window.setTimeout(() => {
      setRingEntranceActive(true);
    }, BEGIN_ENTRANCE_TIMINGS_MS.ringInhaleDelay);

    beginStartRef.current = window.setTimeout(() => {
      startCountdown();
    }, BEGIN_ENTRANCE_TIMINGS_MS.startCountdown);
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
    setCompletionPhase("idle");
    setIsCompleting(false);
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

      if (prefersReducedMotion) {
        setCompletionPhase("fading");
        setIsCompleting(true);
        completeTransitionRef.current = window.setTimeout(() => router.push("/share"), 0);
        return;
      }

      setCompletionPhase("settling");
      completionMessageRef.current = window.setTimeout(() => {
        setCompletionPhase("message");
      }, COMPLETION_TIMINGS_MS.messageReveal);
      completionFadeRef.current = window.setTimeout(() => {
        setCompletionPhase("fading");
        setIsCompleting(true);
      }, COMPLETION_TIMINGS_MS.fadeOut);
      completeTransitionRef.current = window.setTimeout(
        () => router.push("/share"),
        COMPLETION_TIMINGS_MS.routePush,
      );
    }, 0);
    return () => {
      window.clearTimeout(completeNow);
      if (completionMessageRef.current !== null) {
        window.clearTimeout(completionMessageRef.current);
      }
      if (completionFadeRef.current !== null) {
        window.clearTimeout(completionFadeRef.current);
      }
    };
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
      data-completion={completionPhase}
      className={`h-[100svh] min-h-[100svh] overflow-hidden overscroll-none bg-[var(--rin-bg)] text-[var(--rin-text)] transition-opacity duration-[800ms] ease-in-out ${
        isCompleting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`mx-auto flex h-full w-full max-w-md flex-col px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] ${
          isActivePhase ? "pt-3" : "pt-3.5"
        }`}
      >
        <header
          className={`shrink-0 rounded-xl border border-[var(--rin-gold)]/50 bg-[color:rgba(255,251,241,0.72)] tracking-[0.07em] text-[var(--rin-muted)] transition-[padding] duration-[680ms] ease-out ${
            isActivePhase ? "px-2.5 py-1.5 text-[9px]" : "px-3 py-2 text-[10px]"
          }`}
        >
          <div className="flex items-center justify-between">
            <p>{todayDisplay}</p>
            <p>Day {journeyDay}/{TOTAL_DAYS}</p>
          </div>
          {isActivePhase ? (
            <p className="mt-1.5 text-center text-[11px] tracking-[0.05em] text-[var(--rin-text)]/90">
              Theme: <span className="text-[var(--rin-text)]">{todaysTheme}</span>
            </p>
          ) : (
            <div
              className={`rin-prep-reveal mt-2.5 text-center ${
                preparationReveal.theme ? "is-visible" : ""
              }`}
            >
              <div className="mx-auto max-w-[340px] rounded-xl border border-[var(--rin-gold)]/38 bg-[var(--rin-paper)] px-4 py-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
                <p className="text-[16px] tracking-[0.055em] text-[var(--rin-text)]">
                  Theme：{todaysTheme}
                </p>
              </div>
            </div>
          )}
        </header>

        <section
          className={`flex flex-1 min-h-0 flex-col items-center justify-center px-1.5 ${
            isActivePhase ? "pt-2 pb-1.5" : "py-1.5"
          }`}
        >
          <div
            className={`rin-ritual-core-flow flex w-full flex-1 min-h-0 flex-col items-center justify-center text-center ${
              !showPreparation && completionPhase !== "idle"
                ? completionPhase === "message"
                  ? "is-message"
                  : completionPhase === "fading"
                    ? "is-fading"
                    : "is-settling"
                : ""
            }`}
          >
            {showPreparation ? (
              <div className="w-full text-center">
                <div className={`rin-prep-reveal ${preparationReveal.card ? "is-visible" : ""}`}>
                  <p className="text-[10px] tracking-[0.22em] text-[var(--rin-muted)]">QUIET GIFT</p>
                  <article className="rin-quiet-gift-sheet mx-auto mt-2.5 w-full max-w-[22.25rem] px-4 py-4 text-center">
                    <p className="rin-quiet-gift-quote text-[11px] leading-[1.55] italic text-[var(--rin-muted)]/78">
                      “{INTRO_QUOTE.english}”
                    </p>
                    <p className="mt-2.5 text-[0.97rem] leading-[1.78] text-[var(--rin-text)]">
                      「{INTRO_QUOTE.japanese}」
                    </p>
                    <p className="mt-2.5 text-[10.5px] leading-relaxed text-[var(--rin-muted)]">
                      {INTRO_QUOTE.author}{" "}
                      <span className="text-[10px] text-[var(--rin-muted)]/82">（{INTRO_QUOTE.role}）</span>
                    </p>
                  </article>
                </div>
                <p
                  className={`rin-prep-reveal mt-2.5 whitespace-pre-line text-[10.5px] leading-[1.6] tracking-[0.035em] text-[var(--rin-muted)]/90 ${
                    preparationReveal.description ? "is-visible" : ""
                  }`}
                >
                  {"香水でも、お茶でも。\n落ち着く香りをそっと手元に。準備できたらBEGIN。"}
                </p>
              </div>
            ) : (
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
                <p className="rin-step-label mt-1.5 text-[10px] tracking-[0.2em] text-[var(--rin-muted)]">
                  {displayedStep.title}
                </p>
                <div className="rin-ritual-copy-stack mx-auto mt-3">
                  {displayedInstructionParagraphs.map((paragraph, index) => (
                    <p key={`${displayedStep.title}-${index}`} className="rin-ritual-copy text-[var(--rin-text)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div
              className={`rin-ring-stage relative z-[2] flex min-h-[12.1rem] items-center justify-center ${
                showPreparation
                  ? `is-preparation rin-prep-reveal mt-2.5 ${
                      preparationReveal.ring ? "is-visible" : ""
                    } ${ringEntranceActive ? "is-entrance" : ""}`
                  : "mt-3.5"
              }`}
            >
              <BreathRing
                timeLabel={ringTimeLabel}
                countdownValue={showPreparation ? null : countdownValue}
                progress={ringProgress}
                mode={ringMode}
                stepTone={ringStepTone}
                active={ringActive}
                paused={ringPaused}
              />
            </div>
          </div>
        </section>

        <footer className={`shrink-0 ${isActivePhase ? "pt-0.5" : "pt-1"}`}>
          <section
            className={`mx-auto w-full max-w-[22.5rem] border border-[var(--rin-gold)]/52 bg-[color:rgba(251,247,236,0.82)] shadow-[0_1px_4px_rgba(61,53,39,0.06)] transition-[opacity,transform,filter,padding,border-radius] duration-[1200ms] ease-out ${
              isActivePhase ? "rounded-xl px-2.5 py-2" : "rounded-2xl p-3"
            } ${completionPhase !== "idle" && !showPreparation ? "rin-ritual-complete-panel" : ""} ${
              resetting ? "rin-resetting" : ""
            }`}
          >
            <div
              className={`transition-[opacity,transform,filter] ease-in-out ${
                prefersReducedMotion ? "duration-0" : "duration-[600ms]"
              }`}
            >
              <p
                className={`text-center tracking-[0.04em] text-[var(--rin-muted)]/90 transition-opacity duration-[1200ms] ${
                  isActivePhase ? "text-[9.5px]" : "text-[11px]"
                } ${
                  nextActionLabel && !showPreparation && completionPhase === "idle"
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                {nextActionLabel ? `NEXT: ${nextActionLabel}` : ""}
              </p>

              <div
                className={`relative flex w-full min-h-[2.2rem] items-center justify-center ${
                  isActivePhase ? "mt-1" : "mt-2.5"
                }`}
              >
                <div
                  className={`transition-[opacity,transform,filter] ease-in-out ${
                    controlsLocked
                      ? "pointer-events-none translate-y-2 opacity-0 blur-[1px]"
                      : "translate-y-0 opacity-100 blur-0"
                  } ${prefersReducedMotion ? "duration-0" : "duration-[560ms]"}`}
                >
                  {showPreparation ? (
                    <div className={`rin-prep-reveal ${preparationReveal.begin ? "is-visible" : ""}`}>
                      <button
                        type="button"
                        onClick={handleBeginRitual}
                        disabled={
                          controlsLocked ||
                          beginEntranceActive ||
                          (!prefersReducedMotion && !preparationReveal.begin)
                        }
                        className={`rin-begin-button rounded-full border border-[var(--rin-gold)] px-7 py-2.5 text-xs tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rin-gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rin-bg)] ${
                          beginPressing ? "is-pressing" : ""
                        }`}
                      >
                        BEGIN
                      </button>
                    </div>
                  ) : (
                    <div className="flex w-full justify-center">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={running ? handlePause : handleResume}
                          disabled={timer === 0 || controlsLocked}
                          className={`rounded-full border border-[var(--rin-gold)] bg-[var(--rin-gold-soft)]/45 tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-45 ${
                            isActivePhase ? "px-4 py-1 text-[10px]" : "px-5 py-1.5 text-[11px]"
                          }`}
                        >
                          {running ? "Pause" : "Resume"}
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          disabled={controlsLocked}
                          className={`rounded-full border border-[var(--rin-gold)] tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-45 ${
                            isActivePhase ? "px-4 py-1 text-[10px]" : "px-5 py-1.5 text-[11px]"
                          }`}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {!showPreparation ? (
                  <div
                    className={`rin-ritual-completion-note pointer-events-none absolute inset-0 flex flex-col items-center justify-center ${
                      completionPhase === "message"
                        ? "is-visible"
                        : completionPhase === "fading"
                          ? "is-fading"
                          : completionPhase === "settling"
                            ? "is-settling"
                            : ""
                    }`}
                    aria-live="polite"
                  >
                    <p className="text-[11px] tracking-[0.08em] text-[var(--rin-text)]/90">整いました。</p>
                    <p className="mt-1 text-[10px] tracking-[0.045em] text-[var(--rin-muted)]/88">
                      この静けさのまま、次へ。
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </footer>
      </div>
    </main>
  );
}
