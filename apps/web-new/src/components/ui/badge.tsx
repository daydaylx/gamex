/**
 * Badge Component - Mobile-First Design
 */

import type { ComponentChildren } from "preact";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children?: ComponentChildren;
}

const variantClasses = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border border-input bg-transparent text-foreground",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
