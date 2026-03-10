"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import RinSealCard from "@/app/components/RinSealCard";

type SharePayload = {
  theme: string;
  day: number;
  quote: {
    author_en: string;
    author_jp: string;
    quote_en: string;
    quote_jp: string;
  };
  streak: number;
  points: number;
};

export default function SharePage() {
  const router = useRouter();
  const sealCardRef = useRef<HTMLDivElement | null>(null);
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [canShareSeal, setCanShareSeal] = useState(false);
  const [isSavingSeal, setIsSavingSeal] = useState(false);
  const [isSharingSeal, setIsSharingSeal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem("rin_share_payload");
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SharePayload;
      setPayload(parsed);
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }
    setCanShareSeal(
      typeof navigator.share === "function" &&
        typeof navigator.canShare === "function",
    );
  }, []);

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

  const sealFilename = `Ritual-Day-${String(payload?.day ?? 1).padStart(2, "0")}.png`;

  const handleSaveSeal = async () => {
    if (isSavingSeal || !payload) {
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
    if (!canShareSeal || isSharingSeal || !payload) {
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
        title: "Today, in tune.",
        text: "",
        files: [file],
      });
    } finally {
      setIsSharingSeal(false);
    }
  };

  if (!payload) {
    return (
      <main className="flex h-[100svh] min-h-[100svh] items-center justify-center bg-[var(--rin-bg)] px-6 text-[var(--rin-text)]">
        <div className="text-center">
          <p className="text-sm text-[var(--rin-muted)]">Share card is not ready yet.</p>
          <button
            type="button"
            onClick={() => router.push("/ritual")}
            className="mt-4 rounded-full border border-[var(--rin-gold)] px-6 py-2 text-sm"
          >
            Back to ritual
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-[100svh] min-h-[100svh] items-center justify-center bg-[var(--rin-bg)] px-4 text-[var(--rin-text)]">
      <div className="w-full max-w-lg animate-[rin-fade-in_900ms_ease-out_forwards]">
        <RinSealCard
          ref={sealCardRef}
          theme={payload.theme}
          day={payload.day}
          quote={payload.quote}
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
            onClick={() => router.push("/ritual")}
            className="rounded-full border border-[var(--rin-gold)]/65 px-6 py-2 text-sm tracking-[0.08em] text-[var(--rin-muted)] transition hover:bg-[var(--rin-gold-soft)]/16"
          >
            Back
          </button>
        </div>
        <p className="mt-4 text-center text-xs tracking-[0.11em] text-[var(--rin-muted)]/90">
          継続 {payload.streak}日 / 記録 {payload.points}
        </p>
      </div>
    </main>
  );
}
