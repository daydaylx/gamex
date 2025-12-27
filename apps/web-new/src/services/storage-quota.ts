/**
 * LocalStorage Quota Management
 * Monitors storage usage and handles quota exceeded errors
 */

import { logger } from "./logger";

// Approximate localStorage limit (5MB in most browsers)
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const WARNING_THRESHOLD = 0.8; // Warn at 80% usage

export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  items: number;
  isNearLimit: boolean;
}

export interface StorageItem {
  key: string;
  size: number;
  sizeMB: string;
}

/**
 * Calculate the size of a string in bytes
 */
function getStringSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Get current localStorage usage information
 */
export function getStorageInfo(): StorageInfo {
  let totalSize = 0;
  let itemCount = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || "";
      totalSize += getStringSize(key) + getStringSize(value);
      itemCount++;
    }
  }

  const percentage = (totalSize / STORAGE_LIMIT_BYTES) * 100;

  return {
    used: totalSize,
    total: STORAGE_LIMIT_BYTES,
    percentage,
    items: itemCount,
    isNearLimit: percentage >= WARNING_THRESHOLD * 100,
  };
}

/**
 * Get all storage items sorted by size
 */
export function getStorageItems(): StorageItem[] {
  const items: StorageItem[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || "";
      const size = getStringSize(key) + getStringSize(value);
      items.push({
        key,
        size,
        sizeMB: (size / (1024 * 1024)).toFixed(3),
      });
    }
  }

  return items.sort((a, b) => b.size - a.size);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Safe localStorage.setItem with quota handling
 */
export function safeSetItem(key: string, value: string): { success: boolean; error?: string } {
  try {
    // Check if this would exceed quota
    const currentInfo = getStorageInfo();
    const newSize = getStringSize(key) + getStringSize(value);
    const existingValue = localStorage.getItem(key);
    const existingSize = existingValue
      ? getStringSize(key) + getStringSize(existingValue)
      : 0;
    const projectedUsage = currentInfo.used - existingSize + newSize;

    if (projectedUsage > STORAGE_LIMIT_BYTES) {
      logger.warn("Storage quota would be exceeded", undefined, {
        currentUsage: formatBytes(currentInfo.used),
        newItemSize: formatBytes(newSize),
        projectedUsage: formatBytes(projectedUsage),
      });
      return {
        success: false,
        error: `Speicherplatz würde überschritten werden (${formatBytes(projectedUsage)} / ${formatBytes(STORAGE_LIMIT_BYTES)})`,
      };
    }

    localStorage.setItem(key, value);

    // Log warning if near limit
    if (projectedUsage / STORAGE_LIMIT_BYTES >= WARNING_THRESHOLD) {
      logger.warn("Storage usage near limit", undefined, {
        usage: formatBytes(projectedUsage),
        percentage: ((projectedUsage / STORAGE_LIMIT_BYTES) * 100).toFixed(1) + "%",
      });
    }

    return { success: true };
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      logger.error("LocalStorage quota exceeded", error as Error);
      return {
        success: false,
        error: "Speicherplatz ist voll. Bitte lösche alte Sessions.",
      };
    }

    logger.error("Failed to save to localStorage", error as Error);
    return {
      success: false,
      error: "Speichern fehlgeschlagen",
    };
  }
}

/**
 * Cleanup old/unused data to free space
 */
export function cleanupStorage(options: {
  keepRecentSessions?: number;
  removeLogs?: boolean;
}): { freed: number; itemsRemoved: number } {
  const { keepRecentSessions = 10, removeLogs = false } = options;

  let freedBytes = 0;
  let itemsRemoved = 0;
  const keysToRemove: string[] = [];

  // Find session keys
  const sessionKeys: { key: string; timestamp: number }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Remove logs if requested
    if (removeLogs && key.includes(":logs")) {
      keysToRemove.push(key);
      continue;
    }

    // Track sessions for cleanup
    if (key.startsWith("gamex:session:")) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const session = JSON.parse(value);
          sessionKeys.push({
            key,
            timestamp: new Date(session.updatedAt || session.createdAt || 0).getTime(),
          });
        }
      } catch {
        // Invalid session data, mark for removal
        keysToRemove.push(key);
      }
    }
  }

  // Sort sessions by timestamp (newest first) and mark old ones for removal
  sessionKeys.sort((a, b) => b.timestamp - a.timestamp);
  const oldSessions = sessionKeys.slice(keepRecentSessions);
  for (const session of oldSessions) {
    keysToRemove.push(session.key);
  }

  // Remove marked keys
  for (const key of keysToRemove) {
    const value = localStorage.getItem(key);
    if (value) {
      freedBytes += getStringSize(key) + getStringSize(value);
      localStorage.removeItem(key);
      itemsRemoved++;
    }
  }

  if (itemsRemoved > 0) {
    logger.info("Storage cleanup completed", {
      itemsRemoved,
      freedBytes: formatBytes(freedBytes),
    });
  }

  return { freed: freedBytes, itemsRemoved };
}

/**
 * Check storage health and log status
 */
export function checkStorageHealth(): StorageInfo {
  const info = getStorageInfo();

  if (info.isNearLimit) {
    logger.warn("Storage usage is high", undefined, {
      usage: `${info.percentage.toFixed(1)}%`,
      used: formatBytes(info.used),
      items: info.items,
    });
  } else {
    logger.debug("Storage health check", {
      usage: `${info.percentage.toFixed(1)}%`,
      used: formatBytes(info.used),
      items: info.items,
    });
  }

  return info;
}

/**
 * Export storage info for debugging
 */
export function exportStorageDebugInfo(): string {
  const info = getStorageInfo();
  const items = getStorageItems();

  return JSON.stringify(
    {
      summary: {
        used: formatBytes(info.used),
        total: formatBytes(info.total),
        percentage: `${info.percentage.toFixed(1)}%`,
        items: info.items,
        isNearLimit: info.isNearLimit,
      },
      largestItems: items.slice(0, 10).map((item) => ({
        key: item.key,
        size: `${item.sizeMB} MB`,
      })),
    },
    null,
    2
  );
}
