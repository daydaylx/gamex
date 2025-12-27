# Level 3: Komponenten-Architektur für Karten-basierte UI

## Technischer Roadmap für Card Stack Implementation

Basierend auf dem Card Stack Konzept aus Level 2, hier die detaillierte Komponenten-Hierarchie und empfohlene Bibliotheken.

---

## Komponenten-Hierarchie

### Haupt-Struktur

```
CardStackContainer (Root)
├── ProgressIndicator (oben, fixed)
├── CardStack (Zentrum)
│   ├── CardShadow[] (2-3 Hintergrund-Karten)
│   └── SwipeableCard (aktuelle Karte)
│       ├── QuestionHeader
│       │   ├── ModuleTag
│       │   ├── RiskLevelBadge
│       │   └── HelpIconButton
│       ├── QuestionContent
│       │   ├── QuestionText
│       │   ├── QuestionHelp (optional)
│       │   └── QuestionInput
│       │       ├── ConsentRatingInput (falls schema === "consent_rating")
│       │       ├── ScaleInput (falls schema === "scale")
│       │       ├── EnumInput (falls schema === "enum")
│       │       └── MultiInput (falls schema === "multi")
│       ├── GestureOverlay
│       │   ├── SwipeIndicators (Yes/No/Maybe Hints)
│       │   └── DragFeedback (visuelles Feedback während Drag)
│       └── ActionButtons (Desktop-Fallback)
├── HandoverScreen (conditional, bei Übergabe)
│   ├── LockOverlay
│   ├── UnlockProgress
│   └── PersonIndicator
└── InfoModal (conditional, bei Help-Click)
    ├── InfoTitle
    ├── InfoDetails
    └── CloseButton
```

---

## Komponenten-Details

### 1. CardStackContainer

**Pfad:** `apps/web-new/src/components/questionnaire/CardStackContainer.tsx`

**Zuständigkeit:**
- Haupt-Container für die gesamte Card-Stack-Experience
- Verwaltet State (via Signals)
- Koordiniert Übergänge zwischen Fragen
- Handles Handover-Logik

**Props:**
```typescript
interface CardStackContainerProps {
  sessionId: string;
  person: 'A' | 'B';
  template: Template;
  onComplete?: () => void;
  onHandover?: () => void; // Wird getriggert, wenn Person A fertig ist
}
```

**Dependencies:**
- Signals Store (`questionnaireStore`)
- API Service (`api.ts`)

---

### 2. SwipeableCard

**Pfad:** `apps/web-new/src/components/questionnaire/SwipeableCard.tsx`

**Zuständigkeit:**
- Einzelne Frage-Karte
- Swipe-Gesten-Handling
- Visuelles Feedback während Drag
- Animation-Triggering

**Props:**
```typescript
interface SwipeableCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onSwipe: (direction: 'yes' | 'no' | 'maybe' | 'skip') => void;
  onAnswerChange: (questionId: string, value: ResponseValue) => void;
  currentAnswer?: ResponseValue;
}
```

**Dependencies:**
- `@use-gesture/react` für Gesten
- `framer-motion` oder `@react-spring/web` für Animationen

---

### 3. GestureOverlay

**Pfad:** `apps/web-new/src/components/questionnaire/GestureOverlay.tsx`

**Zuständigkeit:**
- Gesten-Erkennung (Swipe, Tap, Long-Press)
- Visuelles Feedback während Gesten
- Swipe-Indikatoren (Yes/No/Maybe Hints)

**Implementation:**
```typescript
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from '@react-spring/web';

function GestureOverlay({ onSwipe, children }) {
  const [{ x, y, rotateY }, api] = useSpring(() => ({ x: 0, y: 0, rotateY: 0 }));
  
  const bind = useDrag(({ movement: [mx, my], direction: [xDir, yDir], velocity }) => {
    // Update spring during drag
    api.start({
      x: mx,
      y: my,
      rotateY: mx / 10, // Slight rotation
      immediate: true,
    });
    
    // On release
    if (!active) {
      // Determine swipe direction and trigger onSwipe
      // ...
      api.start({ x: 0, y: 0, rotateY: 0 }); // Reset
    }
  });
  
  return (
    <animated.div {...bind()} style={{ x, y, rotateY }}>
      {children}
    </animated.div>
  );
}
```

---

### 4. CardShadow

**Pfad:** `apps/web-new/src/components/questionnaire/CardShadow.tsx`

**Zuständigkeit:**
- Hintergrund-Karten für Stapel-Tiefe-Effekt
- 2-3 Karten sichtbar, leicht verschoben

**Implementation:**
```tsx
function CardShadow({ index, totalShadows }: { index: number; totalShadows: number }) {
  const offset = (totalShadows - index) * 8; // 8px offset per card
  const opacity = 0.3 - (index * 0.1); // Decreasing opacity
  const scale = 1 - (index * 0.05); // Decreasing scale
  
  return (
    <div
      className="absolute inset-0 rounded-2xl bg-gray-100"
      style={{
        transform: `translateY(${offset}px) scale(${scale})`,
        opacity,
        zIndex: -index - 1,
      }}
    />
  );
}
```

---

### 5. ProgressIndicator

**Pfad:** `apps/web-new/src/components/questionnaire/ProgressIndicator.tsx`

**Zuständigkeit:**
- Farbkodierte Fortschrittsanzeige oben
- Dynamische Farbe basierend auf Modul-Phase

**Implementation:**
```tsx
import { useComputed } from '@preact/signals-react';
import { progress, currentPhase } from '../../store/questionnaireStore';

function ProgressIndicator() {
  const progressValue = useComputed(() => progress.value);
  const phase = useComputed(() => currentPhase.value);
  
  const phaseColors = {
    foundation: 'bg-blue-500',
    exploration: 'bg-green-500',
    advanced: 'bg-yellow-500',
    expert: 'bg-red-500',
    lifestyle: 'bg-purple-500',
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
      <div
        className={`h-full transition-all duration-500 ${phaseColors[phase.value]}`}
        style={{ width: `${progressValue.value}%` }}
      />
    </div>
  );
}
```

---

### 6. HandoverScreen

**Pfad:** `apps/web-new/src/components/questionnaire/HandoverScreen.tsx`

**Zuständigkeit:**
- Übergabe zwischen Person A und B
- Privacy Lock mit Long-Press-Unlock
- Optional: PIN-Eingabe

**Props:**
```typescript
interface HandoverScreenProps {
  fromPerson: 'A' | 'B';
  toPerson: 'A' | 'B';
  onUnlock: () => void;
  requirePin?: boolean;
}
```

**Dependencies:**
- Keine externen Libraries (native touch events)

---

### 7. LockOverlay

**Pfad:** `apps/web-new/src/components/questionnaire/LockOverlay.tsx`

**Zuständigkeit:**
- Privacy Lock während Übergabe
- Long-Press-Progress-Anzeige

---

## Empfohlene Bibliotheken

### Animation Libraries

#### Option 1: Framer Motion (Empfohlen)
```bash
npm install framer-motion
```

**Pros:**
- Sehr mächtig und flexibel
- Gute Dokumentation
- Große Community
- Works mit Preact (via `framer-motion-preact`)

**Cons:**
- Größeres Bundle (~50KB)

**Nutzung:**
```tsx
import { motion } from 'framer-motion-preact';

<motion.div
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
  onDragEnd={(e, info) => {
    if (info.offset.x > 100) {
      onSwipe('yes');
    }
  }}
>
  {/* Card content */}
</motion.div>
```

#### Option 2: React Spring (Lighter Alternative)
```bash
npm install @react-spring/web
```

**Pros:**
- Kleinere Bundle-Größe (~30KB)
- Sehr performant
- Physik-basierte Animationen

**Cons:**
- Weniger Features als Framer Motion

**Nutzung:**
```tsx
import { useSpring, animated } from '@react-spring/web';

const [{ x, rotateY }, api] = useSpring(() => ({ x: 0, rotateY: 0 }));
```

---

### Gesture Libraries

#### @use-gesture/react (Empfohlen)
```bash
npm install @use-gesture/react
```

**Pros:**
- Exzellente Gesten-Erkennung
- Works mit allen Animation-Libraries
- Gute Performance

**Nutzung:**
```tsx
import { useDrag } from '@use-gesture/react';

const bind = useDrag(({ movement: [mx, my], direction, velocity }) => {
  // Handle drag
});
```

---

### State Management

#### @preact/signals-core (Bereits empfohlen in Level 3.1)
```bash
npm install @preact/signals-core @preact/signals
```

---

### QR Code (für zukünftigen Export/Import)

#### qrcode.react
```bash
npm install qrcode.react
```

---

## Datei-Struktur

```
apps/web-new/src/
├── components/
│   ├── questionnaire/              # Neue Karten-basierte Komponenten
│   │   ├── CardStackContainer.tsx
│   │   ├── SwipeableCard.tsx
│   │   ├── GestureOverlay.tsx
│   │   ├── CardShadow.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── HandoverScreen.tsx
│   │   ├── LockOverlay.tsx
│   │   ├── QuestionHeader.tsx
│   │   ├── QuestionContent.tsx
│   │   └── index.ts                # Barrel export
│   └── form/                       # Altes Formular (behalten für Migration)
│       ├── QuestionnaireForm.tsx
│       └── ...
├── store/
│   ├── questionnaireStore.ts       # Signals Store (aus Level 3.1)
│   └── exportImport.ts             # Export/Import (aus Level 3.2)
├── services/
│   ├── api.ts                      # Persistenz (behalten)
│   └── gestures.ts                 # Gesten-Helpers (optional)
└── types/
    ├── questionnaire.ts            # Neue Types für Card Components
    └── ...
```

---

## Implementierungsreihenfolge

### Phase 1: Foundation (Woche 1)
1. ✅ Signals Store implementieren (`questionnaireStore.ts`)
2. ✅ CardStackContainer erstellen (skeleton)
3. ✅ SwipeableCard erstellen (ohne Gesten, nur Layout)
4. ✅ ProgressIndicator implementieren

### Phase 2: Gestures & Animation (Woche 2)
5. ✅ GestureOverlay implementieren
6. ✅ Swipe-Gesten integrieren
7. ✅ Card-Animationen (Spring/Frame Motion)
8. ✅ CardShadow für Tiefen-Effekt

### Phase 3: Handover & Polish (Woche 3)
9. ✅ HandoverScreen implementieren
10. ✅ LockOverlay mit Long-Press
11. ✅ InfoModal für Help-Text
12. ✅ Desktop-Fallback (Tastatur-Navigation)

### Phase 4: Migration (Woche 4)
13. ✅ Alte Form-View als Fallback behalten
14. ✅ Feature-Flag für Card-Stack vs. Form
15. ✅ User-Testing
16. ✅ Vollständige Migration

---

## TypeScript Types

**Neue Datei:** `apps/web-new/src/types/questionnaire.ts`

```typescript
export interface CardStackProps {
  sessionId: string;
  person: 'A' | 'B';
  template: Template;
  onComplete?: () => void;
  onHandover?: () => void;
}

export interface SwipeDirection {
  type: 'yes' | 'no' | 'maybe' | 'skip';
  velocity: number;
  distance: number;
}

export interface SwipeFeedback {
  direction: SwipeDirection['type'];
  progress: number; // 0-1
  color: string; // Hintergrund-Farbe während Swipe
}
```

---

## Performance-Optimierungen

### Lazy Loading
- CardShadow nur rendern, wenn sichtbar
- InfoModal nur laden, wenn geöffnet

### Memoization
- QuestionContent memoizen (nur re-rendern wenn Frage wechselt)
- GestureOverlay memoizen (nur re-rendern wenn nötig)

### Animation-Performance
- CSS `transform` statt `top/left` (GPU-beschleunigt)
- `will-change: transform` auf animierenden Elementen
- Debounce bei schnellen Swipe-Gesten

---

## Zusammenfassung

**Komponenten:**
- 8 neue Komponenten für Card-Stack
- Alte Form-Komponenten bleiben (Fallback)

**Bibliotheken:**
- `framer-motion` oder `@react-spring/web` (Animationen)
- `@use-gesture/react` (Gesten)
- `@preact/signals-core` (State)

**Aufwand:**
- ~3-4 Wochen für vollständige Implementation
- Schrittweise Migration möglich (Feature-Flag)


