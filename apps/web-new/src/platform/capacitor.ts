/**
 * Capacitor Platform Integration
 * Handles Android-specific features like back button navigation and haptics
 */

import { useEffect, useRef } from "preact/hooks";
import { useLocation } from "wouter-preact";

// Type definitions for Capacitor
interface BackButtonListenerEvent {
  canGoBack: boolean;
}

interface PluginListenerHandle {
  remove: () => Promise<void>;
}

interface AppPlugin {
  addListener: (
    eventName: "backButton",
    listenerFunc: (event: BackButtonListenerEvent) => void
  ) => Promise<PluginListenerHandle>;
  exitApp: () => Promise<void>;
}

// Haptics types
type ImpactStyle = "Heavy" | "Medium" | "Light";
type NotificationType = "Success" | "Warning" | "Error";

interface HapticsPlugin {
  impact: (options: { style: ImpactStyle }) => Promise<void>;
  notification: (options: { type: NotificationType }) => Promise<void>;
  vibrate: (options?: { duration?: number }) => Promise<void>;
  selectionStart: () => Promise<void>;
  selectionChanged: () => Promise<void>;
  selectionEnd: () => Promise<void>;
}

// Dynamic import for Capacitor (only available on native)
let appPlugin: AppPlugin | null = null;
let hapticsPlugin: HapticsPlugin | null = null;

async function getAppPlugin(): Promise<AppPlugin | null> {
  if (appPlugin) return appPlugin;
  
  try {
    const module = await import("@capacitor/app");
    appPlugin = module.App;
    return appPlugin;
  } catch {
    // Running in browser, not native
    console.log("Capacitor App plugin not available (running in browser)");
    return null;
  }
}

async function getHapticsPlugin(): Promise<HapticsPlugin | null> {
  if (hapticsPlugin) return hapticsPlugin;

  try {
    const module = await import("@capacitor/haptics");
    // Cast to our interface - Capacitor's types are compatible
    hapticsPlugin = module.Haptics as unknown as HapticsPlugin;
    return hapticsPlugin;
  } catch {
    // Running in browser or haptics not available
    console.log("Capacitor Haptics plugin not available");
    return null;
  }
}

/**
 * Haptic feedback utilities
 */
export const haptics = {
  /** Light impact - for selections and toggles */
  async light() {
    const h = await getHapticsPlugin();
    if (h) await h.impact({ style: "Light" });
  },
  
  /** Medium impact - for button presses */
  async medium() {
    const h = await getHapticsPlugin();
    if (h) await h.impact({ style: "Medium" });
  },
  
  /** Heavy impact - for important actions */
  async heavy() {
    const h = await getHapticsPlugin();
    if (h) await h.impact({ style: "Heavy" });
  },
  
  /** Success notification - for completed actions */
  async success() {
    const h = await getHapticsPlugin();
    if (h) await h.notification({ type: "Success" });
  },
  
  /** Warning notification */
  async warning() {
    const h = await getHapticsPlugin();
    if (h) await h.notification({ type: "Warning" });
  },
  
  /** Error notification */
  async error() {
    const h = await getHapticsPlugin();
    if (h) await h.notification({ type: "Error" });
  },
  
  /** Selection feedback - for dragging/scrolling */
  async selection() {
    const h = await getHapticsPlugin();
    if (h) await h.selectionChanged();
  },
};

/**
 * Hook for handling Android back button
 * Provides native-feeling navigation on Android
 */
export function useCapacitorBackButton() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    let listener: PluginListenerHandle | null = null;

    async function setupBackButton() {
      const app = await getAppPlugin();
      if (!app) return;

      listener = await app.addListener("backButton", (event) => {
        // If we can go back in browser history
        if (event.canGoBack) {
          window.history.back();
          return;
        }

        // If we're on home screen, exit the app
        if (location === "/" || location === "") {
          app.exitApp();
          return;
        }

        // Navigate to home
        setLocation("/");
      });
    }

    setupBackButton();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [location, setLocation]);
}

/**
 * Hook for interview-specific back button handling
 * Goes to previous question instead of leaving interview
 */
export function useInterviewBackButton(
  onPrevious: () => void,
  canGoPrevious: boolean,
  onExit: () => void
) {
  const confirmExitRef = useRef(false);

  useEffect(() => {
    let listener: PluginListenerHandle | null = null;

    async function setupBackButton() {
      const app = await getAppPlugin();
      if (!app) return;

      listener = await app.addListener("backButton", async () => {
        // If we can go to previous question, do that
        if (canGoPrevious) {
          await haptics.light();
          onPrevious();
          return;
        }

        // If at first question, show confirmation or exit
        if (confirmExitRef.current) {
          // Second press - exit interview
          onExit();
          confirmExitRef.current = false;
        } else {
          // First press - set flag and provide feedback
          confirmExitRef.current = true;
          await haptics.warning();
          
          // Reset after 2 seconds
          setTimeout(() => {
            confirmExitRef.current = false;
          }, 2000);
        }
      });
    }

    setupBackButton();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [onPrevious, canGoPrevious, onExit]);

  return { confirmExitPending: confirmExitRef.current };
}

/**
 * Check if running in Capacitor native environment
 */
export function isNative(): boolean {
  // @ts-expect-error - Capacitor global
  return typeof window !== "undefined" && window.Capacitor !== undefined;
}

/**
 * Get platform info
 */
export function getPlatform(): "android" | "ios" | "web" {
  if (!isNative()) return "web";
  // @ts-expect-error - Capacitor global
  return window.Capacitor?.getPlatform?.() || "web";
}

