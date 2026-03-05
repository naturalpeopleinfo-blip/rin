export type Progress = {
  streak: number;
  points: number;
  lastCompletedDate: string;
};

const STORAGE_KEY = "rin-progress-v1";

const defaultProgress: Progress = {
  streak: 0,
  points: 0,
  lastCompletedDate: "",
};

export function getDefaultProgress(): Progress {
  return defaultProgress;
}

export function loadProgress(): Progress {
  if (typeof window === "undefined") {
    return defaultProgress;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      streak:
        typeof parsed.streak === "number" && parsed.streak >= 0
          ? parsed.streak
          : 0,
      points:
        typeof parsed.points === "number" && parsed.points >= 0
          ? parsed.points
          : 0,
      lastCompletedDate:
        typeof parsed.lastCompletedDate === "string" ? parsed.lastCompletedDate : "",
    };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

