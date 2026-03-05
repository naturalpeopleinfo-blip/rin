"use client";

import { forwardRef } from "react";

type RinSealCardProps = {
  theme: string;
  day: number;
  quote: {
    author_en: string;
    author_jp: string;
    quote_en: string;
    quote_jp: string;
  };
};

const RinSealCard = forwardRef<HTMLDivElement, RinSealCardProps>(function RinSealCard(
  { theme, day, quote },
  ref,
) {
  return (
    <div
      ref={ref}
      className="rin-seal-card relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-[var(--rin-gold)]/55 bg-[var(--rin-bg)]/98 px-6 py-7 text-[var(--rin-text)] shadow-[0_22px_45px_rgba(61,53,39,0.16)]"
    >
      <div className="rin-seal-glow" aria-hidden />
      <p className="relative z-10 text-center text-5xl font-medium tracking-[0.16em]">RIN</p>
      <p className="relative z-10 mt-3 text-center text-xs tracking-[0.2em] text-[var(--rin-muted)]">
        DAILY RIN SEAL
      </p>

      <section className="relative z-10 mt-7 rounded-xl border border-[var(--rin-gold)]/40 bg-white/35 px-5 py-5">
        <p className="text-[11px] tracking-[0.14em] text-[var(--rin-muted)]">TODAY THEME</p>
        <p className="mt-2 text-xl leading-relaxed">{theme}</p>
      </section>

      <section className="relative z-10 mt-4 rounded-xl border border-[var(--rin-gold)]/38 bg-white/28 px-5 py-5">
        <p className="text-[11px] tracking-[0.14em] text-[var(--rin-muted)]">QUIET GIFT</p>
        <p className="rin-seal-quote mt-3 text-[17px] leading-[1.8]">
          “{quote.quote_en}”
        </p>
        <p className="mt-4 text-sm leading-[1.85] text-[var(--rin-muted)]">「{quote.quote_jp}」</p>
        <p className="mt-4 text-xs tracking-[0.08em] text-[var(--rin-muted)]/95">
          {quote.author_en} / {quote.author_jp}
        </p>
      </section>

      <p className="relative z-10 mt-7 border-t border-[var(--rin-gold)]/35 pt-3 text-center text-[11px] tracking-[0.16em] text-[var(--rin-muted)]">
        RIN | DAY {day} | 66
      </p>
    </div>
  );
});

export default RinSealCard;
