/**
 * useSwipe Hook
 * Detects swipe gestures for navigation
 */

import { useEffect, useRef } from "preact/hooks";
import { haptics } from "../platform/capacitor";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe (px)
  velocityThreshold?: number; // Minimum velocity
  preventScroll?: boolean; // Prevent default scroll behavior
}

export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const { threshold = 80, velocityThreshold = 0.3, preventScroll = false } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    let mounted = true;

    function handleTouchStart(e: TouchEvent) {
      if (!mounted) return;

      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      isSwiping.current = false;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!mounted || !touchStart.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStart.current.x);
      const deltaY = Math.abs(touch.clientY - touchStart.current.y);

      // Detect horizontal swipe
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping.current = true;
        if (preventScroll) {
          e.preventDefault();
        }
      }
    }

    async function handleTouchEnd(e: TouchEvent) {
      if (!mounted || !touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const velocity = absX / deltaTime;

      // Horizontal swipe
      if (absX > absY && absX > threshold && velocity > velocityThreshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          await haptics.light();
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          await haptics.light();
          handlers.onSwipeLeft();
        }
      }
      // Vertical swipe
      else if (absY > absX && absY > threshold && velocity > velocityThreshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          await haptics.light();
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          await haptics.light();
          handlers.onSwipeUp();
        }
      }

      touchStart.current = null;
      isSwiping.current = false;
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: !preventScroll });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      mounted = false;
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handlers, threshold, velocityThreshold, preventScroll]);
}
