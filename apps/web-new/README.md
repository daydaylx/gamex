# Intimacy Tool - Web App

**Mobile-first PWA for relationship exploration and communication**

Eine Progressive Web App (PWA) zur Erkundung von Intimität und Kommunikation in Beziehungen.

---

## Tech-Stack

- **Framework:** Preact (lightweight React alternative)
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (strict mode)
- **Routing:** wouter-preact
- **Icons:** lucide-preact
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint + Prettier
- **PWA:** vite-plugin-pwa mit Workbox

---

## Features

- **Offline-First:** Funktioniert komplett ohne Internet (Service Worker)
- **PWA:** Installierbar auf mobilen Geräten
- **Interview-Modus:** Strukturierte Fragen mit Chat-UI
- **Vergleichsreport:** Zeigt Übereinstimmungen und Unterschiede
- **Szenarien-Explorer:** Hypothetische Situationen erkunden
- **KI-Integration:** OpenRouter API für Hilfe und Reports
- **Lokale Speicherung:** Alle Daten bleiben auf dem Gerät (localStorage)
- **Capacitor-Ready:** Kann als native Android-App gebaut werden

---

## Schnellstart

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build
npm run build

# Preview des Builds
npm run preview
```

---

## Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet Entwicklungsserver auf Port 5173 |
| `npm run build` | Erstellt optimiertes Produktions-Build |
| `npm run preview` | Startet lokalen Server für Build-Preview |
| `npm run typecheck` | TypeScript-Typprüfung |
| `npm test` | Führt alle Tests einmal aus |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run lint` | ESLint Prüfung |
| `npm run lint:fix` | ESLint mit Auto-Fix |
| `npm run format` | Prettier Formatierung |
| `npm run format:check` | Prettier Prüfung |

---

## Projektstruktur

```
src/
├── components/          # UI-Komponenten
│   ├── a11y/           # Accessibility-Komponenten
│   ├── form/           # Formular-Komponenten
│   ├── interview/      # Interview-spezifische Komponenten
│   └── ui/             # Wiederverwendbare UI-Elemente
├── contexts/           # React Contexts (Theme, etc.)
├── hooks/              # Custom Hooks
├── platform/           # Capacitor-Integration
├── screens/            # Hauptbildschirme
├── services/           # Business Logic
│   ├── ai/            # KI-Integration (OpenRouter)
│   ├── comparison/    # Vergleichslogik
│   └── ...
├── types/              # TypeScript Type Definitions
├── views/              # View-Komponenten
├── App.tsx             # Root-Komponente
├── main.tsx           # Entry Point
└── index.css          # Globale Styles (Tailwind)

tests/
├── component/          # Komponenten-Tests
└── unit/              # Unit-Tests

public/
├── favicon.svg        # SVG Favicon
├── pwa-192x192.png   # PWA Icon (192x192)
├── pwa-512x512.png   # PWA Icon (512x512)
└── apple-touch-icon.png
```

---

## Services

### Logging (`services/logger.ts`)
Strukturiertes Logging mit localStorage-Persistenz:
```ts
import { logger } from './services/logger';
logger.info("User action", { context: "details" });
logger.error("Error occurred", error);
```

### Validation (`services/validation.ts`)
Input-Validierung und Sanitization:
```ts
import { sanitizeString, validateTextInput } from './services/validation';
const clean = sanitizeString(userInput);
```

### Storage Quota (`services/storage-quota.ts`)
LocalStorage-Verwaltung mit Quota-Überwachung:
```ts
import { getStorageInfo, cleanupStorage } from './services/storage-quota';
const info = getStorageInfo();
```

### Performance (`services/performance.ts`)
Web Vitals Monitoring:
```ts
import { getPerformanceSummary } from './services/performance';
const metrics = getPerformanceSummary();
```

---

## Testing

```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Modus
npm run test:watch

# Mit Coverage
npm test -- --coverage
```

Tests verwenden Vitest mit jsdom und Testing Library.

---

## Capacitor Build (Android)

```bash
# Build für Mobile
npm run build:mobile

# Capacitor Sync
npx cap sync android

# In Android Studio öffnen
npx cap open android
```

---

## Datenschutz

- Alle Daten werden lokal im Browser gespeichert (localStorage)
- Keine Server-Kommunikation außer optionaler KI-Features
- KI-Anfragen gehen direkt an OpenRouter (kein eigener Server)
- Export/Import ermöglicht Datensicherung als JSON

---

## Lizenz

MIT License
