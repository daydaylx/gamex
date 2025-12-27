/**
 * Button Component - Mobile-First Design
 */

import type { ComponentChildren } from "preact";
import { cn } from "../../lib/utils";

export interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
  title?: string;
}

const variantClasses = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
  ghost:
    "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
  link:
    "text-primary underline-offset-4 hover:underline",
};

const sizeClasses = {
  default: "h-11 px-5 py-2.5 text-sm",
  sm: "h-9 rounded-lg px-4 text-sm",
  lg: "h-14 rounded-xl px-8 text-base",
  icon: "h-11 w-11",
};

export function Button({
  variant = "default",
  size = "default",
  className,
  children,
  onClick,
  disabled,
  type = "button",
  "aria-label": ariaLabel,
  title,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-medium",
        "rounded-xl", // Consistent rounded corners
        "ring-offset-background transition-all duration-150",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // Touch feedback
        "touch-feedback",
        // Variant and size
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
