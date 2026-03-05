"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOnboarded } from "@/lib/onboarding";

export default function OnboardingFlow() {
  const router = useRouter();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const begin = () => {
    setOnboarded();
    router.replace("/ritual");
  };

  return (
    <main className="rin-onboarding-shell min-h-screen px-6 py-10 text-[var(--rin-text)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <section className="rin-hero-card rin-fade-in w-full max-w-xl rounded-2xl border border-[var(--rin-gold)]/55 px-8 py-12 text-center md:px-10 md:py-14">
          <div className="rin-hero-monogram mx-auto mb-8 h-24 w-24" aria-hidden />
          <h1 className="rin-hero-rise text-6xl font-medium tracking-[0.15em] md:text-7xl">
            RIN
          </h1>
          <p className="rin-hero-rise mt-2 text-xs uppercase tracking-[0.2em] text-[var(--rin-muted)]">
            Morning Ritual
          </p>
          <p className="rin-hero-rise mt-9 text-2xl leading-[1.85] tracking-[0.03em] md:text-[2rem]">
            朝を整える、66日の旅へ。
          </p>
          <p className="rin-hero-rise mt-5 text-sm leading-relaxed tracking-[0.05em] text-[var(--rin-muted)] md:text-base">
            続けるほど、“選ばれる私”が整っていく。
          </p>
          <div className="rin-hero-rise mt-10 flex justify-center">
            <button
              type="button"
              onClick={begin}
              className="rin-begin-button rounded-full border border-[var(--rin-gold)] px-12 py-3 text-sm tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rin-gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rin-bg)]"
            >
              Begin
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowHowItWorks((prev) => !prev)}
            className="rin-hero-rise mt-5 text-xs tracking-[0.12em] text-[var(--rin-muted)] underline-offset-4 transition hover:underline"
          >
            How it works
          </button>
          {showHowItWorks ? (
            <div className="rin-hero-rise mx-auto mt-4 max-w-md rounded-xl border border-[var(--rin-gold)]/45 bg-white/42 px-5 py-4 text-left">
              <p className="text-sm leading-relaxed text-[var(--rin-muted)]">
                毎朝、ThemeとQuiet Giftを受け取り、香りで空気を整えてから静かに始めます。
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
