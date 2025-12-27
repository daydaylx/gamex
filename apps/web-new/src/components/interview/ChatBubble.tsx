/**
 * Chat Bubble Component
 * Displays scenario text as a chat message from "Guide"
 */

interface ChatBubbleProps {
  text: string;
  title?: string;
  className?: string;
}

export function ChatBubble({ text, title, className = "" }: ChatBubbleProps) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">G</span>
        </div>
      </div>

      {/* Message */}
      <div className="flex-1 space-y-1">
        {title && (
          <div className="text-sm font-semibold text-foreground">Guide</div>
        )}
        <div className="rounded-lg rounded-tl-none bg-muted px-4 py-3 text-foreground leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
}

