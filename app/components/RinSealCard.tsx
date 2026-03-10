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

const TOTAL_DAYS = 66;

function getBenefitLine(theme: string): string {
  if (theme.includes("視線")) {
    return "静かな視線で、今日の大切なものを選べる。";
  }
  if (theme.includes("空気")) {
    return "落ち着いた空気で、人と向き合える。";
  }
  if (theme.includes("言葉")) {
    return "焦らず、自分の言葉で伝えられる。";
  }
  if (theme.includes("所作")) {
    return "やわらかな所作で、一日を始められる。";
  }
  if (theme.includes("芯")) {
    return "ぶれない芯で、今日の選択に迷わない。";
  }
  if (theme.includes("決断")) {
    return "軽やかな決断で、流れをつくれる。";
  }
  if (theme.includes("自信")) {
    return "静かな自信で、今日をまっすぐ進める。";
  }
  if (theme.includes("迷い")) {
    return "迷いに引かれず、必要なことに集中できる。";
  }
  if (theme.includes("選ばれる")) {
    return "自然体のまま、信頼される印象でいられる。";
  }
  return "整った自分で、今日を心地よく過ごせる。";
}

const RinSealCard = forwardRef<HTMLDivElement, RinSealCardProps>(function RinSealCard(
  { theme, day, quote },
  ref,
) {
  const benefitLine = getBenefitLine(theme);

  return (
    <div
      ref={ref}
      className="rin-seal-card relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-[var(--rin-gold)]/55 bg-[var(--rin-bg)]/98 px-6 py-7 text-[var(--rin-text)] shadow-[0_22px_45px_rgba(61,53,39,0.16)]"
    >
      <div className="rin-seal-glow" aria-hidden />
      <p className="relative z-10 text-center text-[17px] tracking-[0.05em] text-[var(--rin-text)]/94">
        Today, in tune.
      </p>

      <section className="rin-seal-day-block relative z-10 mt-3 rounded-xl border border-[var(--rin-gold)]/46 bg-white/34 px-5 py-4 text-center">
        <p className="text-[10.5px] tracking-[0.16em] text-[var(--rin-muted)]/92">
          {TOTAL_DAYS}日の旅、{day}日目
        </p>
        <p className="mt-1.5 leading-none">
          <span className="text-[13px] tracking-[0.2em] text-[var(--rin-muted)]/88">DAY</span>
          <span className="rin-seal-day-value mx-1.5 text-[35px] font-semibold tracking-[0.08em] text-[var(--rin-text)]">
            {day}
          </span>
          <span className="text-[20px] font-medium tracking-[0.1em] text-[var(--rin-text)]/84">
            / {TOTAL_DAYS}
          </span>
        </p>
      </section>

      <section className="rin-seal-benefit-block relative z-10 mt-4 rounded-xl border border-[var(--rin-gold)]/40 bg-white/35 px-5 py-5">
        <p className="text-[11px] tracking-[0.12em] text-[var(--rin-muted)]/92">今日のわたし</p>
        <p className="mt-2 text-[18.5px] leading-[1.72] text-[var(--rin-text)]/92">
          {benefitLine}
        </p>
      </section>

      <section className="rin-seal-quote-block relative z-10 mt-4 rounded-xl border border-[var(--rin-gold)]/32 bg-white/23 px-5 py-4">
        <p className="text-[10px] tracking-[0.14em] text-[var(--rin-muted)]/80">Quiet Gift</p>
        <p className="rin-seal-quote mt-2 text-[15px] leading-[1.76] text-[var(--rin-text)]/84">
          “{quote.quote_en}”
        </p>
        <p className="mt-2.5 text-[11px] tracking-[0.08em] text-[var(--rin-muted)]/78">
          {quote.author_en}
        </p>
      </section>

      <div className="rin-seal-signet" aria-hidden>
        <span className="rin-seal-signet-core" />
      </div>

      <p className="relative z-10 mt-7 border-t border-[var(--rin-gold)]/35 pt-3 text-center text-[9.5px] tracking-[0.22em] text-[var(--rin-muted)]/84">
        RIN
      </p>
    </div>
  );
});

export default RinSealCard;
