import { useState, useEffect } from "preact/hooks";
import { Plus, X } from "lucide-preact";

interface TouchTextInputProps {
  value?: { text: string };
  onChange: (value: { text: string }) => void;
  placeholder?: string;
  quickReplies?: string[];
  disabled?: boolean;
}

// Default quick reply suggestions for common text questions
const DEFAULT_QUICK_REPLIES = [
  "Keine besonderen Wünsche",
  "Darüber möchte ich später sprechen",
  "Siehe meine Notizen",
];

export function TouchTextInput({
  value,
  onChange,
  placeholder = "Deine Antwort...",
  quickReplies = DEFAULT_QUICK_REPLIES,
  disabled,
}: TouchTextInputProps) {
  const [text, setText] = useState(value?.text || "");
  const [showFreeText, setShowFreeText] = useState(false);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  // Parse existing text value to find selected chips
  useEffect(() => {
    if (value?.text) {
      setText(value.text);
      // Check if any quick replies are in the existing text
      const found = quickReplies.filter(qr => value.text.includes(qr));
      setSelectedChips(found);
      // Show free text if there's content beyond quick replies
      const remainingText = quickReplies.reduce((acc, qr) => acc.replace(qr, '').trim(), value.text);
      if (remainingText.length > 0 && remainingText !== '; ') {
        setShowFreeText(true);
      }
    }
  }, []);

  function handleChipToggle(chip: string) {
    const newSelected = selectedChips.includes(chip)
      ? selectedChips.filter(c => c !== chip)
      : [...selectedChips, chip];
    
    setSelectedChips(newSelected);
    updateValue(newSelected, text);
  }

  function handleTextChange(newText: string) {
    setText(newText);
    updateValue(selectedChips, newText);
  }

  function updateValue(chips: string[], freeText: string) {
    // Combine chips and free text
    const parts: string[] = [...chips];
    
    // Check if free text contains any chips (to avoid duplication)
    let cleanFreeText = freeText;
    chips.forEach(chip => {
      cleanFreeText = cleanFreeText.replace(chip, '').trim();
    });
    
    // Remove any leftover semicolons from previous combinations
    cleanFreeText = cleanFreeText.replace(/^;\s*/, '').replace(/;\s*$/, '').trim();
    
    if (cleanFreeText) {
      parts.push(cleanFreeText);
    }
    
    const combinedText = parts.join('; ');
    onChange({ text: combinedText });
  }

  function clearAll() {
    setText("");
    setSelectedChips([]);
    onChange({ text: "" });
  }

  return (
    <div className="space-y-4">
      {/* Quick Reply Chips */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Schnellantworten (antippen zum Auswählen)
        </label>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleChipToggle(chip)}
              disabled={disabled}
              className={`
                px-4 py-3 rounded-full text-sm font-medium transition-all min-h-[48px]
                ${selectedChips.includes(chip)
                  ? 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Free Text */}
      {!showFreeText ? (
        <button
          type="button"
          onClick={() => setShowFreeText(true)}
          disabled={disabled}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Eigenen Text hinzufügen (optional)
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">
              Eigener Text
            </label>
            <button
              type="button"
              onClick={() => {
                setShowFreeText(false);
                // Keep any chips but clear free text that wasn't from chips
                const chipText = selectedChips.join('; ');
                setText(chipText);
                onChange({ text: chipText });
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange((e.target as HTMLTextAreaElement).value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full min-h-[120px] px-4 py-3 border border-input rounded-lg
              bg-background text-base resize-y
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{ fontSize: '16px' }} // Prevent iOS zoom on focus
          />
        </div>
      )}

      {/* Clear button when there's content */}
      {(selectedChips.length > 0 || text.trim().length > 0) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            Alles löschen
          </button>
        </div>
      )}

      {/* Preview of combined answer */}
      {(selectedChips.length > 0 || text.trim().length > 0) && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1">Deine Antwort:</p>
          <p className="text-sm">
            {selectedChips.length > 0 && !text.includes(selectedChips[0])
              ? [...selectedChips, text.trim()].filter(Boolean).join('; ')
              : text || selectedChips.join('; ')
            }
          </p>
        </div>
      )}
    </div>
  );
}

// Context-specific quick replies for common question types
export const QUICK_REPLIES = {
  hardLimits: [
    "Keine Hard Limits",
    "Möchte ich persönlich besprechen",
    "Siehe Liste unten",
  ],
  softLimits: [
    "Keine Soft Limits aktuell",
    "Vielleicht später erkunden",
    "Brauche mehr Zeit",
  ],
  aftercare: [
    "Kuscheln & Nähe",
    "Wasser & Snacks",
    "Stille & Ruhe",
    "Reden & Austauschen",
    "Warme Decke",
    "Allein sein",
  ],
  fantasies: [
    "Möchte ich mündlich teilen",
    "Habe aktuell keine konkreten",
    "Muss darüber nachdenken",
  ],
  safewords: [
    "Ampelsystem (Rot/Gelb/Grün)",
    "Eigenes Safeword vereinbart",
    "Müssen wir noch festlegen",
  ],
  allergies: [
    "Keine bekannten Allergien",
    "Latexallergie",
    "Duftstoffallergie",
    "Siehe separaten Hinweis",
  ],
  notes: [
    "Keine weiteren Anmerkungen",
    "Später ergänzen",
    "Mündlich besprechen",
  ],
  highlights: [
    "Mehr spontane Momente",
    "Mehr Zeit für Vorspiel",
    "Mehr Kommunikation",
    "Mehr Experimentierfreude",
  ],
  pauseList: [
    "Aktuell keine Pausen nötig",
    "Brauche Pause bei intensiven Praktiken",
    "Möchte langsamer vorgehen",
  ],
};
