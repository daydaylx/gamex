import { useEffect, useState } from "preact/hooks";
import { Check, AlertCircle, Info, X } from "lucide-preact";
import { Button } from "./button";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(toast.id), 300); // Match animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const iconMap = {
    success: <Check className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const colorMap = {
    success: "bg-green-600 text-white border-green-700",
    error: "bg-red-600 text-white border-red-700",
    info: "bg-blue-600 text-white border-blue-700",
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
        backdrop-blur-md
        ${colorMap[toast.type]}
        ${isLeaving ? "animate-slide-down opacity-0" : "animate-slide-up"}
        transition-all duration-300
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0">{iconMap[toast.type]}</div>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="h-6 w-6 hover:bg-white/20 -mr-1"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 pointer-events-none"
      aria-label="Benachrichtigungen"
    >
      <div className="max-w-md mx-auto space-y-2 pointer-events-auto mb-4">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info", duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);
    return id;
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, duration?: number) => showToast(message, "success", duration);
  const error = (message: string, duration?: number) => showToast(message, "error", duration);
  const info = (message: string, duration?: number) => showToast(message, "info", duration);

  return {
    toasts,
    showToast,
    closeToast,
    success,
    error,
    info,
  };
}
