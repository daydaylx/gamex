# Level 2: Detailliertes Card Stack Konzept

## UX-Flow-Beschreibung für Karten-basierte, spielerische Fragen-Oberfläche

Diese Beschreibung dient als Blaupause für Entwickler, um eine intime, spielerische Fragebogen-Erfahrung mit Tailwind CSS zu implementieren.

---

## Grundkonzept: Card Stack (Karten-Stapel)

### Visualisierung
```
┌─────────────────────────────────────┐
│  [Karte 4 - Hintergrund, 10% Deckkraft]  │
│  [Karte 3 - Hintergrund, 30% Deckkraft]  │
│  [Karte 2 - Hintergrund, 60% Deckkraft]  │
│  ┌─────────────────────────────────┐ │
│  │  [AKTUELLE KARTE - 100%]       │ │
│  │                                 │ │
│  │  Frage: "Gefesselt werden..."  │ │
│  │                                 │ │
│  │  [Swipe-Indikatoren]           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  [Progress: ████████░░] [Blau → Rot]│
└─────────────────────────────────────┘
```

---

## 2.1 Single-Question Card View (Einzelfragen-Karten-Ansicht)

### Display-Logik

**Eine Frage auf einmal, Vollbild:**
- Die aktuelle Frage nimmt ~80% des Viewports ein
- 2-3 Karten sind im Hintergrund sichtbar (Stapel-Tiefe-Effekt)
- Keine Scroll-Funktionalität - nur Gesten

**Card Styling (Tailwind CSS):**
```css
/* Aktuelle Karte */
.primary-card {
  @apply w-full max-w-lg mx-auto;
  @apply rounded-2xl shadow-2xl;
  @apply bg-gradient-to-br from-white to-gray-50;
  @apply border border-gray-200;
  @apply transform transition-all duration-300;
  @apply relative z-50;
}

/* Hintergrund-Karten (Stapel-Effekt) */
.card-shadow {
  @apply absolute inset-0 mx-auto;
  @apply rounded-2xl bg-gray-100;
  @apply transform scale-95;
  @apply opacity-30;
  @apply -z-10;
}
```

### Frage-Inhalt Layout

**Struktur:**
```
┌─────────────────────────────┐
│  [Modul-Tag] [Risiko-Level] │ ← Top Bar (klein, dezent)
│                             │
│  Frage-Text                 │ ← Groß, zentriert, lesbar
│  (1.5rem, font-medium)      │
│                             │
│  [Hilfe-Icon] ℹ️             │ ← Optional, rechts oben
│                             │
│  [Kleiner Hilfetext]        │ ← Optional, kursiv, grau
│                             │
│                             │
│  [Input-Bereich]            │ ← Consent-Rating / Enum / etc.
│                             │
│  [Swipe-Hinweise]           │ ← Unten, dezent
│  ← Nein    Vielleicht    Ja →│
└─────────────────────────────┘
```

---

## 2.2 Gestenbasierte Interaktion

### Swipe-Gesten Mapping

| Geste | Aktion | Visuelles Feedback |
|-------|--------|-------------------|
| **Swipe Rechts** | "Ja/Interessiert" (✓) | Karte dreht nach rechts, grüner Haken erscheint, Karte fliegt raus |
| **Swipe Links** | "Nein/Nicht interessiert" (✗) | Karte dreht nach links, roter X erscheint, Karte fliegt raus |
| **Swipe Hoch** | "Vielleicht/Erkunden" (?) | Karte dreht nach oben, gelbes Fragezeichen, Karte fliegt raus |
| **Swipe Runter** | "Überspringen/Später" (⏭) | Karte bewegt sich nach unten, grauer Skip-Indikator |
| **Tap (kurz)** | Hilfe/Kontext anzeigen | Info-Popover erscheint |
| **Long Press** | Mehr Optionen | Kontext-Menü erscheint (z.B. "Zurück", "Überspringen") |

### Gesture Detection Implementation

**Library-Empfehlung:** `@use-gesture/react` (kompatibel mit Preact)

**Code-Struktur:**
```typescript
import { useDrag } from '@use-gesture/react';

function SwipeableCard({ question, onSwipe }) {
  const bind = useDrag(({ movement: [mx, my], direction: [xDir, yDir], velocity }) => {
    // Determine swipe direction
    if (Math.abs(mx) > Math.abs(my)) {
      // Horizontal swipe
      if (xDir > 0 && mx > 100) {
        // Swipe right = Yes
        onSwipe('yes');
      } else if (xDir < 0 && mx < -100) {
        // Swipe left = No
        onSwipe('no');
      }
    } else {
      // Vertical swipe
      if (yDir < 0 && my < -100) {
        // Swipe up = Maybe
        onSwipe('maybe');
      } else if (yDir > 0 && my > 100) {
        // Swipe down = Skip
        onSwipe('skip');
      }
    }
  });

  return (
    <div
      {...bind()}
      className="primary-card cursor-grab active:cursor-grabbing"
    >
      {/* Card content */}
    </div>
  );
}
```

### Visuelles Feedback während Swipe

**Während des Swipe:**
- Karte folgt dem Finger/Maus
- Hintergrund-Farbe ändert sich je nach Richtung:
  - Rechts: Grün (Yes)
  - Links: Rot (No)
  - Hoch: Gelb (Maybe)
  - Runter: Grau (Skip)
- Rotation: Karte kippt leicht in Swipe-Richtung

**Animation beim Loslassen:**
- Wenn über Threshold: Karte fliegt raus (Spring-Animation)
- Nächste Karte rückt nach vorne
- Progress-Indikator aktualisiert sich

---

## 2.3 Progress Indicator (Farbkodierte Fortschrittsanzeige)

### Farbkodierung nach Modul-Intensität

**Farb-Progression:**
```
Blau (Fundament) → Grün (Erkundung) → Gelb (Vertiefung) → Rot (Expert:in) → Lila (Lebensstil)
```

**Implementation:**
```typescript
const getModulePhase = (moduleId: string): 'foundation' | 'exploration' | 'advanced' | 'expert' | 'lifestyle' => {
  if (moduleId.includes('soft') || moduleId.includes('emotional') || moduleId.includes('logistics')) {
    return 'foundation';
  } else if (moduleId.includes('touch') || moduleId.includes('sex') || moduleId.includes('sensory')) {
    return 'exploration';
  } else if (moduleId.includes('power') || moduleId.includes('impact') || moduleId.includes('bondage')) {
    return 'advanced';
  } else if (moduleId.includes('risk') || moduleId.includes('extreme')) {
    return 'expert';
  } else if (moduleId.includes('future') || moduleId.includes('digital')) {
    return 'lifestyle';
  }
  return 'exploration';
};

const phaseColors = {
  foundation: 'bg-blue-500',
  exploration: 'bg-green-500',
  advanced: 'bg-yellow-500',
  expert: 'bg-red-500',
  lifestyle: 'bg-purple-500'
};
```

**Visual Design:**
- Minimal: Nur ein dünner Balken am oberen Rand
- Farbe ändert sich dynamisch basierend auf aktuellem Modul
- Keine Zahlen - nur visueller Fortschritt
- Smooth Transition zwischen Phasen

**Tailwind Implementation:**
```tsx
<div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
  <div
    className={`h-full transition-all duration-500 ${phaseColors[currentPhase]}`}
    style={{ width: `${progress}%` }}
  />
</div>
```

---

## 2.4 Handover Screen (Pass-and-Play Übergabe)

### Transition Animation Sequence

**Schritt 1: Card Flip Animation**
- Aktuelle Karte dreht sich um (Y-Achse, 180°)
- Während der Drehung: Frage verschwindet, "Übergabe"-Bildschirm erscheint
- Dauer: ~600ms (smooth, nicht zu schnell)

**Schritt 2: Privacy Lock Screen**
- Schwarzer oder dunkler Bildschirm
- Zentriert: "Für Person B bereit"
- Untertitel: "Long-Press zum Entsperren"

**Schritt 3: Unlock Gesture**
- Long-Press (mindestens 1 Sekunde) auf Bildschirm
- Während Long-Press: Progress-Ring erscheint (lädt von 0% zu 100%)
- Bei Loslassen vor 100%: Zurück zum Lock-Screen
- Bei 100%: Übergang zur ersten Frage für Person B

### Handover Screen Design

**Visual:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          🔒                          │
│                                     │
│    Für Person B bereit              │
│                                     │
│  [Long-Press zum Entsperren]       │
│                                     │
│    [Progress-Ring: ████░░░░░]      │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
```tsx
function HandoverScreen({ onUnlock }) {
  const [progress, setProgress] = useState(0);
  const longPressRef = useRef(null);

  const handleTouchStart = () => {
    longPressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          onUnlock();
          return 100;
        }
        return prev + 2; // 2% alle ~20ms = 1 Sekunde total
      });
    }, 20);
  };

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearInterval(longPressRef.current);
      setProgress(0);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center z-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <div className="text-6xl mb-8">🔒</div>
      <h2 className="text-2xl mb-4">Für Person B bereit</h2>
      <p className="text-gray-400 mb-8">Long-Press zum Entsperren</p>
      {progress > 0 && (
        <div className="w-48 h-48 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
}
```

### Optional: PIN/Biometrie-Unlock

**Wenn implementiert:**
- Nach Long-Press: PIN-Eingabe oder Biometrie-Abfrage
- Nur dann Übergang zu Person B
- Falls PIN falsch: Zurück zum Lock-Screen

---

## 2.5 Animation-Details

### Card Stack Animation

**Beim Swipe:**
- Aktuelle Karte: `transform: translateX(mx) rotateY(mx/10)`
- Hintergrund-Karten: Leicht nach vorne bewegen, Opacity erhöhen
- Neue Karte (von hinten): Smooth nach vorne schieben

**Library-Empfehlung:** `framer-motion` oder `@react-spring/web`

**Spring-Animation:**
```tsx
import { useSpring, animated } from '@react-spring/web';

function CardStack({ questions, currentIndex }) {
  const [{ x, rotateY }, api] = useSpring(() => ({ x: 0, rotateY: 0 }));

  // On swipe
  const handleSwipe = (direction: 'left' | 'right') => {
    api.start({
      x: direction === 'right' ? 500 : -500,
      rotateY: direction === 'right' ? 45 : -45,
      config: { tension: 300, friction: 30 }
    });
  };

  return (
    <animated.div
      style={{
        transform: `translateX(${x}) rotateY(${rotateY})`,
      }}
      className="primary-card"
    >
      {/* Card content */}
    </animated.div>
  );
}
```

---

## 2.6 Responsive Design

### Mobile-First Approach

- **Touch-Gesten:** Primär für Mobile optimiert
- **Desktop-Fallback:** Maus-Drag funktioniert auch
- **Tablet:** Beste Erfahrung - große Karten, präzise Gesten

### Breakpoints

```css
/* Mobile: Vollbild-Karte */
@media (max-width: 640px) {
  .primary-card {
    @apply h-screen rounded-none;
  }
}

/* Tablet: Zentrierte Karte mit Padding */
@media (min-width: 641px) {
  .primary-card {
    @apply max-w-xl h-auto p-8;
  }
}

/* Desktop: Größere Karte, aber immer noch fokussiert */
@media (min-width: 1024px) {
  .primary-card {
    @apply max-w-2xl;
  }
}
```

---

## 2.7 Accessibility

### Keyboard-Navigation Fallback

Falls Gesten nicht funktionieren:
- **Pfeiltasten:** Links = Nein, Rechts = Ja, Hoch = Vielleicht, Runter = Skip
- **Escape:** Zurück zur vorherigen Frage
- **Enter:** Bestätigen (wenn Input-Fokus auf Karte)

### Screen Reader Support

- Jede Karte hat `role="dialog"` und `aria-label` mit Frage
- Swipe-Hinweise als `aria-live` Region
- Progress-Indikator als `aria-progressbar`

---

## Zusammenfassung: Vom Formular zum Spiel

**Vorher (Formular):**
- Scrollbare Liste
- Buttons zum Navigieren
- Technische UI
- Checklisten-Mentalität

**Nachher (Spiel):**
- Eine Karte auf einmal
- Gesten-basierte Interaktion
- Emotionale Atmosphäre
- Neugier und Exploration

Dieses Konzept transformiert die Fragebogen-Erfahrung von einer administrativen Aufgabe zu einer intimen, spielerischen Entdeckungsreise.


