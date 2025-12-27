/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 */

import { useState, useEffect } from "preact/hooks";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
  clearAfter?: number;
}

export function LiveRegion({
  message,
  politeness = "polite",
  clearAfter = 5000
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

/**
 * Hook to create announcements for screen readers
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState("");

  function announce(message: string) {
    // Clear first to ensure re-announcement of same message
    setAnnouncement("");
    requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }

  return { announcement, announce };
}
