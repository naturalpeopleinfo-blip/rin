"use client";

import { useRouter } from "next/navigation";
import { setOnboarded } from "@/lib/onboarding";

export default function OnboardingFlow() {
  const router = useRouter();

  const begin = () => {
    setOnboarded();
    router.replace("/ritual");
  };

  return (
    <main className="min-h-screen bg-[var(--rin-bg)] px-6 py-10 text-[var(--rin-text)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center justify-center">
        <section className="rin-fade-in w-full max-w-2xl rounded-2xl border border-[var(--rin-gold)]/55 bg-white/58 px-8 py-12 text-center shadow-sm md:px-12 md:py-14">
          <h1 className="text-6xl font-medium tracking-[0.15em] md:text-7xl">RIN</h1>
          <p className="mt-8 whitespace-pre-line text-base leading-relaxed tracking-[0.04em] text-[var(--rin-text)] md:text-lg">
            {"66日、3分。\n今日のThemeとQuiet Giftを受け取って、\n香りで場を整え、静かに始める。"}
          </p>
          <p className="mt-6 text-sm leading-relaxed tracking-[0.05em] text-[var(--rin-muted)] md:text-base">
            続けるほど、“選ばれる私”が整っていく。
          </p>
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={begin}
              className="rin-begin-button rounded-full border border-[var(--rin-gold)] px-12 py-3 text-sm tracking-[0.2em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rin-gold)]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rin-bg)]"
            >
              BEGIN
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
