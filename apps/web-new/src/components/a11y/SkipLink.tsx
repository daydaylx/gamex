/**
 * Skip Link Component
 * Allows keyboard users to skip navigation and jump to main content
 */

interface SkipLinkProps {
  targetId?: string;
  children?: string;
}

export function SkipLink({
  targetId = "main-content",
  children = "Zum Hauptinhalt springen"
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="
        sr-only focus:not-sr-only
        focus:absolute focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2 focus:rounded-lg
        focus:bg-primary focus:text-primary-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
      "
    >
      {children}
    </a>
  );
}
