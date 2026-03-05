import { RefObject, useEffect } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useSpotlight<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
): void {
  useEffect(() => {
    const element = targetRef.current;
    if (!element || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    let reducedMotion = mediaQuery.matches;
    let rafId: number | null = null;
    let currentX = 50;
    let currentY = 50;
    let targetX = 50;
    let targetY = 50;

    const applyPosition = (x: number, y: number) => {
      element.style.setProperty("--sx", `${x}%`);
      element.style.setProperty("--sy", `${y}%`);
    };

    const scheduleRender = () => {
      if (rafId !== null || reducedMotion) {
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        rafId = null;

        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        applyPosition(currentX, currentY);

        if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
          scheduleRender();
        }
      });
    };

    const updateTarget = (clientX: number, clientY: number) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const normalizedX = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const normalizedY = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      targetX = normalizedX;
      targetY = normalizedY;
      scheduleRender();
    };

    const resetToCenter = () => {
      targetX = 50;
      targetY = 50;
      scheduleRender();
    };

    const handlePointerMove = (event: PointerEvent) => {
      updateTarget(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      updateTarget(touch.clientX, touch.clientY);
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      if (reducedMotion) {
        targetX = 50;
        targetY = 50;
        currentX = 50;
        currentY = 50;
        applyPosition(50, 50);
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else {
        scheduleRender();
      }
    };

    applyPosition(50, 50);

    if (!reducedMotion) {
      element.addEventListener("pointermove", handlePointerMove);
      element.addEventListener("pointerleave", resetToCenter);
      element.addEventListener("touchmove", handleTouchMove, { passive: true });
      element.addEventListener("touchend", resetToCenter);
      element.addEventListener("touchcancel", resetToCenter);
    }

    mediaQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      if (!reducedMotion) {
        element.removeEventListener("pointermove", handlePointerMove);
        element.removeEventListener("pointerleave", resetToCenter);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", resetToCenter);
        element.removeEventListener("touchcancel", resetToCenter);
      }

      mediaQuery.removeEventListener("change", handleMotionPreferenceChange);

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [targetRef]);
}
