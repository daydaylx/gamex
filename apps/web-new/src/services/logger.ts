/**
 * Logging Service
 * Structured logging with localStorage persistence for debugging
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
}

const LOG_STORAGE_KEY = "gamex:logs";
const MAX_LOG_ENTRIES = 100;
const IS_DEV = import.meta.env.DEV;

/**
 * Get stored logs from localStorage
 */
function getStoredLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store logs to localStorage (keeps only recent entries)
 */
function storeLogs(logs: LogEntry[]): void {
  try {
    // Keep only the most recent entries
    const trimmed = logs.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Storage might be full, try to clear old logs
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-10)));
    } catch {
      // Give up on storage
    }
  }
}

/**
 * Add a log entry
 */
function addLogEntry(entry: LogEntry): void {
  const logs = getStoredLogs();
  logs.push(entry);
  storeLogs(logs);
}

/**
 * Format error for storage
 */
function formatError(error: Error): LogEntry["error"] {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

/**
 * Log to console with appropriate styling
 */
function logToConsole(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  const styles: Record<LogLevel, string> = {
    debug: "color: #888",
    info: "color: #3b82f6",
    warn: "color: #f59e0b",
    error: "color: #ef4444; font-weight: bold",
  };

  const consoleMethod = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }[level];

  if (IS_DEV) {
    consoleMethod(`%c${prefix} ${message}`, styles[level]);
    if (error) consoleMethod(error);
    if (context) consoleMethod("Context:", context);
  } else {
    // Production: minimal logging
    if (level === "error" || level === "warn") {
      consoleMethod(`${prefix} ${message}`);
      if (error) consoleMethod(error.message);
    }
  }
}

/**
 * Main logger object
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!IS_DEV) return; // Skip debug logs in production

    logToConsole("debug", message, undefined, context);

    addLogEntry({
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      context,
    });
  },

  info(message: string, context?: Record<string, unknown>): void {
    logToConsole("info", message, undefined, context);

    addLogEntry({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context,
    });
  },

  warn(message: string, error?: Error, context?: Record<string, unknown>): void {
    logToConsole("warn", message, error, context);

    addLogEntry({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      error: error ? formatError(error) : undefined,
      context,
    });
  },

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    logToConsole("error", message, error, context);

    addLogEntry({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      error: error ? formatError(error) : undefined,
      context,
    });
  },

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return getStoredLogs();
  },

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return getStoredLogs().filter(log => log.level === level);
  },

  /**
   * Get recent errors
   */
  getRecentErrors(count = 10): LogEntry[] {
    return getStoredLogs()
      .filter(log => log.level === "error")
      .slice(-count);
  },

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    localStorage.removeItem(LOG_STORAGE_KEY);
  },

  /**
   * Export logs as JSON string (for debugging/support)
   */
  exportLogs(): string {
    return JSON.stringify(getStoredLogs(), null, 2);
  },
};

// Capture global unhandled errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error", event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    logger.error("Unhandled promise rejection", error);
  });
}
