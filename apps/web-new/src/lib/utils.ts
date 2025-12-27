/**
 * Utility function for merging class names
 * Similar to clsx or classnames, but simplified for our use case
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

