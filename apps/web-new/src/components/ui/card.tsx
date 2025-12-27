/**
 * Card Components - Mobile-First Design
 */

import type { ComponentChildren } from "preact";
import { cn } from "../../lib/utils";

export interface CardProps {
  className?: string;
  children?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
  variant?: "default" | "elevated" | "outlined" | "glass";
  padding?: "compact" | "comfortable" | "spacious" | "none";
}

const cardVariants = {
  default: "bg-card border-border/50",
  elevated: "bg-card border-border/30 shadow-lg shadow-black/20",
  outlined: "bg-card/50 border-border/60",
  glass: "bg-card/40 backdrop-blur-md border-border/20",
};

const cardPadding = {
  none: "",
  compact: "p-3",
  comfortable: "p-4 sm:p-6",
  spacious: "p-6 sm:p-8",
};

export function Card({
  className,
  children,
  onClick,
  variant = "default",
  padding,
}: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-xl border text-card-foreground transition-all duration-200",
        cardVariants[variant],
        padding && cardPadding[padding],
        onClick && "cursor-pointer text-left w-full card-interactive",
        className
      )}
    >
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  className?: string;
  children?: ComponentChildren;
  padding?: "compact" | "comfortable" | "spacious";
}

export function CardHeader({ className, children, padding = "comfortable" }: CardHeaderProps) {
  const headerPadding = {
    compact: "p-3",
    comfortable: "p-4",
    spacious: "p-6",
  };

  return (
    <div className={cn("flex flex-col space-y-1.5", headerPadding[padding], className)}>
      {children}
    </div>
  );
}

export interface CardTitleProps {
  className?: string;
  children?: ComponentChildren;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
    >
      {children}
    </h3>
  );
}

export interface CardDescriptionProps {
  className?: string;
  children?: ComponentChildren;
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  );
}

export interface CardContentProps {
  className?: string;
  children?: ComponentChildren;
  padding?: "compact" | "comfortable" | "spacious";
}

export function CardContent({ className, children, padding = "comfortable" }: CardContentProps) {
  const contentPadding = {
    compact: "p-3 pt-0",
    comfortable: "p-4 pt-0",
    spacious: "p-6 pt-0",
  };

  return <div className={cn(contentPadding[padding], className)}>{children}</div>;
}

export interface CardFooterProps {
  className?: string;
  children?: ComponentChildren;
  padding?: "compact" | "comfortable" | "spacious";
}

export function CardFooter({ className, children, padding = "comfortable" }: CardFooterProps) {
  const footerPadding = {
    compact: "p-3 pt-0",
    comfortable: "p-4 pt-0",
    spacious: "p-6 pt-0",
  };

  return (
    <div className={cn("flex items-center", footerPadding[padding], className)}>{children}</div>
  );
}
