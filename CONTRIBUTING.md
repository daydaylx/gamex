# Contributing to Intimacy Tool

Vielen Dank für dein Interesse am Projekt! 🎉

## Quick Start

### Web App Setup (Preact + Vite)

```bash
cd apps/web-new

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Browser öffnen: http://localhost:5173

# Tests ausführen
npm run test

# TypeScript prüfen
npm run typecheck

# Linting
npm run lint
```

### Mobile App (Android)

Siehe detaillierte Anleitung: [docs/APK_BUILD_GUIDE.md](docs/APK_BUILD_GUIDE.md)

---

## Development Workflow

### 1. Branch erstellen

```bash
git checkout -b feature/dein-feature-name
# oder
git checkout -b fix/bug-beschreibung
```

### 2. Code schreiben

**Code Style:**
- **TypeScript:** Strict Mode aktiviert, ESLint-Regeln befolgen
- **Preact/React:** Functional Components mit Hooks
- **Commits:** Aussagekräftige Messages (siehe unten)

**Tools:**
```bash
cd apps/web-new

# Code formatieren
npm run format

# Linting
npm run lint
npm run lint:fix  # Automatische Fixes

# Type Checking
npm run typecheck

# Tests
npm run test
npm run test:watch  # Watch-Mode
```

### 3. Tests schreiben

**Frontend (Vitest + Testing Library):**
```bash
cd apps/web-new
npm run test                    # Alle Tests
npm run test:watch              # Watch-Mode
npm run test -- --coverage      # Mit Coverage
npm run test -- Button.test     # Einzelne Datei
```

**Test-Struktur:**
```typescript
import { render, screen } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    // Given (Vorbedingungen)
    const text = 'Click me';

    // When (Aktion)
    render(<Button>{text}</Button>);

    // Then (Erwartung)
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
```

**Coverage-Ziel:** 80% für kritische Komponenten

### 4. Commit Guidelines

Wir nutzen [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Neues Feature
- `fix`: Bugfix
- `docs`: Dokumentation
- `refactor`: Code-Refactoring (keine Feature-Änderung)
- `test`: Tests hinzufügen/ändern
- `chore`: Build-Prozess, Dependencies, etc.
- `perf`: Performance-Verbesserung
- `ci`: CI/CD Änderungen

**Beispiele:**
```bash
git commit -m "feat(compare): add conversation prompts generation"
git commit -m "fix(validation): handle missing conditions correctly"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(routes): add tests for backup endpoint"
```

### 5. Pull Request erstellen

```bash
git push origin feature/dein-feature-name
```

Dann auf GitHub einen PR erstellen mit:
- **Beschreibung:** Was ändert der PR?
- **Motivation:** Warum ist die Änderung nötig?
- **Testing:** Wie wurde getestet?
- **Screenshots:** Bei UI-Änderungen

**PR-Checklist:**
- [ ] Tests geschrieben und passing
- [ ] Code formatiert (`npm run format`)
- [ ] Linting passing (`npm run lint`)
- [ ] TypeScript Check passing (`npm run typecheck`)
- [ ] Dokumentation aktualisiert (falls nötig)
- [ ] CHANGELOG aktualisiert (bei größeren Features)

---

## Code-Organisation

### Frontend (`apps/web-new/src/`)

```
src/
├── components/         # UI-Komponenten
│   ├── form/          # Formular-Inputs & Questionnaire
│   ├── ui/            # Basis-UI (Button, Card, etc.)
│   ├── interview/     # Interview-spezifische Komponenten
│   └── a11y/          # Accessibility-Komponenten
├── services/          # Business-Logik & API
│   ├── ai/            # AI-Integration (OpenRouter)
│   ├── comparison/    # Vergleichsalgorithmus
│   ├── validation/    # Validierungsregeln
│   ├── api.ts         # API-Calls & Storage
│   └── logger.ts      # Logging
├── types/             # TypeScript-Typen
│   ├── common.ts      # Gemeinsame Types
│   ├── interview.ts   # Interview-Types
│   ├── form.ts        # Formular-Types
│   ├── compare.ts     # Vergleichs-Types
│   └── ai.ts          # AI-Types
├── hooks/             # Custom React Hooks
├── contexts/          # React Contexts
├── screens/           # Haupt-Screens
├── views/             # View-Komponenten
├── lib/               # Utility-Funktionen
├── platform/          # Capacitor-Integration
└── App.tsx            # Haupt-App
```

**Wichtig:**
- `services/` enthält **keine** UI-Logik (testbar ohne Components)
- `components/` sind reine View-Components
- Types sind zentral in `types/` organisiert

---

## Testing-Strategie

### Frontend Tests (Vitest)

**Unit Tests:**
```typescript
// tests/unit/services/comparison/compare.test.ts
import { describe, it, expect } from 'vitest';
import { compareResponses } from './compare';

describe('compareResponses', () => {
  it('should identify matching consent ratings', () => {
    const respA = { Q1: { status: 'YES', interest: 3, comfort: 3 } };
    const respB = { Q1: { status: 'YES', interest: 4, comfort: 4 } };

    const result = compareResponses(template, respA, respB);

    expect(result.items[0].pair_status).toBe('MATCH');
  });
});
```

**Component Tests:**
```typescript
// tests/component/QuestionnaireForm.test.tsx
import { render, screen, waitFor } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuestionnaireForm } from './QuestionnaireForm';

describe('QuestionnaireForm', () => {
  it('should auto-save after 2 seconds', async () => {
    const onSave = vi.fn();
    render(<QuestionnaireForm sessionId="test" person="A" onSave={onSave} />);

    const input = screen.getByLabelText('Antwort');
    await userEvent.type(input, 'Test answer');

    await waitFor(() => expect(onSave).toHaveBeenCalled(), { timeout: 2500 });
  });
});
```

**Test-Fixtures:**
```typescript
// tests/fixtures/templates.ts
import type { Template } from '../../src/types/common';

export const mockTemplate: Template = {
  id: 'unified_v3_pure',
  version: '3.0',
  modules: [
    {
      id: 'communication',
      title: 'Kommunikation',
      questions: [/* ... */]
    }
  ]
};
```

---

## Security Guidelines

**WICHTIG:** Dieses Tool verarbeitet **sensible Daten**.

### Do's:
- ✅ Validiere **alle** User-Inputs im Frontend
- ✅ Nutze Content Security Policy (CSP)
- ✅ Sanitize Output (XSS-Prävention)
- ✅ HTTPS in Production
- ✅ Secure Storage für sensitive Daten (Capacitor SecureStorage)

### Don'ts:
- ❌ **NIEMALS** Secrets in Git committen
- ❌ **NIEMALS** sensible Daten in Logs ausgeben
- ❌ **NIEMALS** `dangerouslySetInnerHTML` ohne Sanitization nutzen
- ❌ **NIEMALS** API-Keys im Frontend-Code hardcoden

**Geplant:**
- Encryption-at-rest für IndexedDB
- Capacitor SecureStorage für API-Keys
- Biometric Authentication für Mobile App

---

## Dokumentation schreiben

### Code-Dokumentation

**TypeScript (Services):**
```typescript
/**
 * Vergleicht zwei Antwort-Sets basierend auf einem Template.
 *
 * @param template - Template-Definition mit Modulen und Fragen
 * @param respA - Antworten von Person A (question_id -> answer)
 * @param respB - Antworten von Person B (question_id -> answer)
 *
 * @returns Vergleichs-Resultat mit:
 *   - meta: Template-Metadaten
 *   - summary: Counts & Flags
 *   - items: Liste aller Fragen mit Paar-Status
 *   - actionPlan: Top 3 empfohlene Aktivitäten
 *
 * @throws {Error} Wenn Template nicht gefunden
 */
export function compareResponses(
  template: Template,
  respA: ResponseMap,
  respB: ResponseMap
): ComparisonResult {
  // ...
}
```

**TypeScript (Komponenten):**
```typescript
/**
 * Normalisiert eine Antwort für Rückwärtskompatibilität
 *
 * @param answer - Rohe Antwort vom User
 * @returns Normalisierte Antwort mit Defaults
 *
 * @example
 * ```tsx
 * const normalized = normalizeAnswer({ status: 'YES' });
 * // Returns: { status: 'YES', interest: 3, comfort: 3 }
 * ```
 */
export function normalizeAnswer(answer: Partial<Answer>): Answer {
  // ...
}
```

### User-Dokumentation

Für User-facing Features:
- Update `README.md` (Features-Liste)
- Ggf. neue Datei in `docs/` erstellen
- Screenshots bei UI-Änderungen

---

## Getting Help

- **Bug gefunden?** [GitHub Issue](https://github.com/daydaylx/gamex/issues) erstellen
- **Frage?** Issue mit Label `question` erstellen
- **Feature-Idee?** Issue mit Label `enhancement` erstellen

---

## Lizenz

Durch Beiträge akzeptierst du, dass dein Code unter der Projekt-Lizenz veröffentlicht wird.

---

**Danke fürs Beitragen! 🚀**
