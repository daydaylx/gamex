/**
 * OfflineIndicator Component
 * Shows offline status banner
 */

import { WifiOff } from "lucide-preact";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 animate-slide-down">
      <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>Offline – AI-Features nicht verfügbar</span>
      </div>
    </div>
  );
}
