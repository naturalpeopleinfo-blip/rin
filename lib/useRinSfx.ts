"use client";

import { useCallback, useRef } from "react";

type RinSfx = {
  playStart: () => void;
  playTransition: () => void;
};

function createContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }
  return new AudioContextCtor();
}

export function useRinSfx(): RinSfx {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = createContext();
    }
    if (!audioContextRef.current) {
      return null;
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playStart = useCallback(() => {
    void (async () => {
      const context = await getContext();
      if (!context) {
        return;
      }

      const now = context.currentTime;
      const endAt = now + 0.22;

      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(0.05, now + 0.02);
      master.gain.exponentialRampToValueAtTime(0.0001, endAt);
      master.connect(context.destination);

      const fundamental = context.createOscillator();
      fundamental.type = "triangle";
      fundamental.frequency.setValueAtTime(1320, now);
      fundamental.frequency.exponentialRampToValueAtTime(1180, endAt);
      fundamental.connect(master);
      fundamental.start(now);
      fundamental.stop(endAt);

      const overtone = context.createOscillator();
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(1760, now);
      overtone.frequency.exponentialRampToValueAtTime(1540, endAt);
      const overtoneGain = context.createGain();
      overtoneGain.gain.setValueAtTime(0.45, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.12, endAt);
      overtone.connect(overtoneGain);
      overtoneGain.connect(master);
      overtone.start(now);
      overtone.stop(endAt);
    })().catch(() => {
      // Silent fallback when audio is unavailable.
    });
  }, [getContext]);

  const playTransition = useCallback(() => {
    void (async () => {
      const context = await getContext();
      if (!context) {
        return;
      }

      const now = context.currentTime;
      const endAt = now + 0.1;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      gain.connect(context.destination);

      const breath = context.createOscillator();
      breath.type = "sine";
      breath.frequency.setValueAtTime(860, now);
      breath.frequency.exponentialRampToValueAtTime(760, endAt);
      breath.connect(gain);
      breath.start(now);
      breath.stop(endAt);
    })().catch(() => {
      // Silent fallback when audio is unavailable.
    });
  }, [getContext]);

  return { playStart, playTransition };
}
