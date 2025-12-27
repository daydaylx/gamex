/**
 * Skeleton Component - Loading Placeholders
 */

import { cn } from "../../lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer",
    none: "",
  };

  const style: Record<string, string> = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "bg-muted/50",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    />
  );
}

// Specific Skeleton Layouts

export function SessionCardSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-surface/50 border border-border/30 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2 mt-2">
            <Skeleton variant="circular" className="w-6 h-6" />
            <Skeleton variant="circular" className="w-6 h-6" />
          </div>
        </div>
        <Skeleton className="w-4 h-4 flex-shrink-0" />
      </div>
    </div>
  );
}

export function InterviewQuestionSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in px-4 py-6">
      {/* Section Tag */}
      <Skeleton className="h-6 w-24 rounded-full" />

      {/* Scenario Text */}
      <div className="bg-surface rounded-2xl rounded-tl-sm p-5 border border-border/50">
        <Skeleton className="h-5 w-full mb-3" />
        <Skeleton className="h-5 w-4/5 mb-3" />
        <Skeleton className="h-5 w-3/4" />
      </div>

      {/* Question Title */}
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full mb-4" />

      {/* Answer Form */}
      <div className="bg-surface/50 rounded-xl p-4 border border-border/30 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <Skeleton className="h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function SessionViewSkeleton() {
  return (
    <div className="p-4 pb-safe animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Person Cards */}
      <section className="mb-6">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </section>

      {/* Actions */}
      <section className="space-y-2">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-16 rounded-xl" />
      </section>
    </div>
  );
}
