import { useState, useEffect } from "preact/hooks";

/**
 * Hook to detect landscape orientation
 * Returns true if device is in landscape mode with limited vertical space
 */
export function useLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkLandscape = () => {
      // Landscape if width > height AND height is limited
      const landscape =
        window.innerWidth > window.innerHeight && window.innerHeight < 600;
      setIsLandscape(landscape);
    };

    // Check on mount
    checkLandscape();

    // Listen for orientation changes
    window.addEventListener("resize", checkLandscape);
    window.addEventListener("orientationchange", checkLandscape);

    return () => {
      window.removeEventListener("resize", checkLandscape);
      window.removeEventListener("orientationchange", checkLandscape);
    };
  }, []);

  return isLandscape;
}
