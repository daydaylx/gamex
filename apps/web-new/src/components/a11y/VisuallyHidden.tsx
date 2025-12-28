/**
 * Visually Hidden Component
 * Hides content visually but keeps it accessible to screen readers
 */

import type { ComponentChildren } from "preact";

interface VisuallyHiddenProps {
  children: ComponentChildren;
  as?: "span" | "div";
}

export function VisuallyHidden({ children, as: Tag = "span" }: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>;
}
