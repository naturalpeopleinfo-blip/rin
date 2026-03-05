"use client";

import { useCallback, useRef } from "react";

const COUNTDOWN_SFX_URL = "/sfx/soft-chime.mp3";

type RinSfx = {
  playStart: () => void;
  playTransition: () => void;
};

export function useRinSfx(): RinSfx {
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const getChime = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }
    if (!chimeRef.current) {
      chimeRef.current = new Audio(COUNTDOWN_SFX_URL);
      chimeRef.current.preload = "auto";
      chimeRef.current.volume = 0.16;
    }
    return chimeRef.current;
  }, []);

  const unlockSfx = useCallback(() => {
    if (unlockedRef.current) {
      return;
    }
    unlockedRef.current = true;
    const chime = getChime();
    if (!chime) {
      return;
    }
    void chime.play().then(() => {
      chime.pause();
      chime.currentTime = 0;
    }).catch(() => {
      // Ignore autoplay restrictions.
    });
  }, [getChime]);

  const playStart = useCallback(() => {
    unlockSfx();
  }, [unlockSfx]);

  const playTransition = useCallback(() => {
    void (async () => {
      try {
        const chime = getChime();
        if (!chime) {
          return;
        }
        chime.currentTime = 0;
        await chime.play();
      } catch {
        // Keep silent if unavailable. No synthetic beep fallback.
      }
    })().catch(() => {
      // Silent fallback when audio is unavailable.
    });
  }, [getChime]);

  return { playStart, playTransition };
}
