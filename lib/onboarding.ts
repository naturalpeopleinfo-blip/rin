const ONBOARDED_STORAGE_KEY = "rin_onboarded";

export function isOnboarded(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ONBOARDED_STORAGE_KEY) === "true";
}

export function setOnboarded(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ONBOARDED_STORAGE_KEY, "true");
}

export function clearOnboarded(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ONBOARDED_STORAGE_KEY);
}
