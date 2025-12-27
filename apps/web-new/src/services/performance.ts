/**
 * Performance Monitoring Service
 * Uses Web Vitals to track Core Web Vitals metrics
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";
import { logger } from "./logger";

// Storage key for performance metrics
const PERF_STORAGE_KEY = "gamex:performance";
const MAX_ENTRIES = 50;

export interface PerformanceEntry {
  timestamp: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
}

/**
 * Get stored performance metrics
 */
function getStoredMetrics(): PerformanceEntry[] {
  try {
    const stored = localStorage.getItem(PERF_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store a performance metric
 */
function storeMetric(entry: PerformanceEntry): void {
  try {
    const metrics = getStoredMetrics();
    metrics.unshift(entry);
    // Keep only recent entries
    const trimmed = metrics.slice(0, MAX_ENTRIES);
    localStorage.setItem(PERF_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage might be full, ignore
  }
}

/**
 * Handle a Web Vitals metric
 */
function handleMetric(metric: Metric): void {
  const entry: PerformanceEntry = {
    timestamp: new Date().toISOString(),
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };

  // Store the metric
  storeMetric(entry);

  // Log based on rating
  const context = {
    value: metric.value.toFixed(2),
    rating: metric.rating,
    id: metric.id,
  };

  if (metric.rating === "poor") {
    logger.warn(`Poor ${metric.name} performance`, undefined, context);
  } else {
    logger.debug(`${metric.name} metric recorded`, context);
  }

  // Log to console in development
  if (import.meta.env.DEV) {
    const emoji = metric.rating === "good" ? "" : metric.rating === "needs-improvement" ? "" : "";
    // eslint-disable-next-line no-console
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

/**
 * Initialize performance monitoring
 * Tracks Core Web Vitals:
 * - LCP: Largest Contentful Paint
 * - FID: First Input Delay
 * - CLS: Cumulative Layout Shift
 * - FCP: First Contentful Paint
 * - INP: Interaction to Next Paint
 * - TTFB: Time to First Byte
 */
export function initPerformanceMonitoring(): void {
  try {
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric); // INP replaced FID in web-vitals v4+
    onLCP(handleMetric);
    onTTFB(handleMetric);

    logger.debug("Performance monitoring initialized");
  } catch (error) {
    logger.error("Failed to initialize performance monitoring", error as Error);
  }
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  metrics: Record<string, { latest: number; average: number; rating: string }>;
  entries: PerformanceEntry[];
} {
  const entries = getStoredMetrics();
  const metricsByName: Record<string, PerformanceEntry[]> = {};

  for (const entry of entries) {
    if (!metricsByName[entry.name]) {
      metricsByName[entry.name] = [];
    }
    metricsByName[entry.name].push(entry);
  }

  const metrics: Record<string, { latest: number; average: number; rating: string }> = {};

  for (const [name, values] of Object.entries(metricsByName)) {
    const latest = values[0];
    const average = values.reduce((sum, v) => sum + v.value, 0) / values.length;

    metrics[name] = {
      latest: latest.value,
      average,
      rating: latest.rating,
    };
  }

  return { metrics, entries };
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  localStorage.removeItem(PERF_STORAGE_KEY);
  logger.info("Performance metrics cleared");
}

/**
 * Export performance data as JSON
 */
export function exportPerformanceData(): string {
  const summary = getPerformanceSummary();
  return JSON.stringify(summary, null, 2);
}
