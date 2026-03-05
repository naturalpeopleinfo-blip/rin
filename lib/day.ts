const DAY_STORAGE_KEY = "rin-day-v1";
const DEFAULT_DAY = 1;

function normalizeDay(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_DAY;
  }

  const parsed = Math.floor(value);
  return parsed >= 1 ? parsed : DEFAULT_DAY;
}

export function loadDay(): number {
  if (typeof window === "undefined") {
    return DEFAULT_DAY;
  }

  const raw = window.localStorage.getItem(DAY_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(DAY_STORAGE_KEY, String(DEFAULT_DAY));
    return DEFAULT_DAY;
  }

  const parsed = normalizeDay(Number(raw));
  if (parsed !== Number(raw)) {
    window.localStorage.setItem(DAY_STORAGE_KEY, String(parsed));
  }

  return parsed;
}

export function incrementDay(): number {
  if (typeof window === "undefined") {
    return DEFAULT_DAY;
  }

  const nextDay = loadDay() + 1;
  window.localStorage.setItem(DAY_STORAGE_KEY, String(nextDay));
  return nextDay;
}
