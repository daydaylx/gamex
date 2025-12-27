/**
 * Card Components - Mobile-First Design
 */

import type { ComponentChildren } from "preact";
import { cn } from "../../lib/utils";

export interface CardProps {
  className?: string;
  children?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
}

export function Card({ className, children, onClick }: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border/50 bg-card text-card-foreground",
        onClick && "cursor-pointer text-left w-full",
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
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-4", className)}>
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
}

export function CardContent({ className, children }: CardContentProps) {
  return <div className={cn("p-4 pt-0", className)}>{children}</div>;
}

export interface CardFooterProps {
  className?: string;
  children?: ComponentChildren;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={cn("flex items-center p-4 pt-0", className)}>{children}</div>
  );
}
