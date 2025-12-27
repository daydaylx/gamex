# GameX Project Context

## 🌍 Project Overview
**GameX** is a local-first, privacy-focused application designed to help couples explore intimacy, communication, and relationship dynamics.

**Current Focus:** The project is currently centered on the **`apps/web-new`** directory, which is a modern **Preact/Vite** application wrapped with **Capacitor** for mobile deployment. This supersedes legacy Python/Kivy implementations mentioned in older documentation.

## 🏗️ Architecture & Tech Stack (Active)

### Frontend (`apps/web-new`)
*   **Framework:** [Preact](https://preactjs.com/) (Lightweight React alternative)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Mobile Native:** [Capacitor](https://capacitorjs.com/) (Android target)
*   **State/Storage:** Local-first architecture using `localStorage` and JSON file loading. No remote backend.

### Key Data Structures
*   **Templates:** JSON files defining questionnaire modules (e.g., `default_template.json`).
*   **Scenarios:** JSON files defining "Decks" of hypothetical situations (e.g., `scenarios.json`).
*   **Sessions:** Local objects storing answers for "Person A" and "Person B".

## 🧩 Core Features & Concepts

### 1. Unified Interview Mode
*   **Master Controller:** `UnifiedInterviewScreen.tsx` manages the user flow.
*   **Stages:**
    *   **Check-in:** 12 warm-up questions (`InterviewMiniForm`).
    *   **Dashboard:** Central menu to select Decks or Modules.
    *   **Active Play:** Renders either `ScenariosView` (for decks) or `QuestionnaireForm` (for modules).
*   **Zen Mode:** UI design philosophy minimizing distractions (no counters, semantic muted colors).

### 2. Scenarios & Decks
*   Story-based cards with 4 reaction options (A, B, C, D).
*   Categorized into "Decks" (e.g., Warm-up, High Risk).
*   **Logic:** `ScenariosView.tsx`

### 3. Questionnaires
*   Structured questions with various schemas (Likert, Yes/No, Text).
*   Organized into "Modules" (e.g., Logistics, Limits).
*   **Logic:** `QuestionnaireForm.tsx`

## 🛠️ Development & Commands

### Setup & Run
All commands should be run from `apps/web-new`:

```bash
cd apps/web-new
npm install
npm run dev      # Start development server
npm run build    # Build for production
```

### Key Directories
*   `apps/web-new/src/screens/`: Top-level views (UnifiedInterview, Session, Home).
*   `apps/web-new/src/components/`: Reusable UI components.
*   `apps/web-new/src/services/`: Data loading (`api.ts`), storage logic (`interview-storage.ts`).
*   `apps/web-new/public/data/`: JSON content files (templates, scenarios).

## 🎨 Design System
*   **Theme:** Dark mode by default (`#0f0a0f`).
*   **Semantic Colors:** Defined in `index.css`. Use variables like `--color-phase-foundation` instead of hardcoded hex values.
*   **Typography:** "Inter" and "Outfit".

## 📝 Recent Changes (as of Dec 2025)
*   **Migration:** Moved from separate Scenario/Questionnaire screens to a single **Unified Interview Screen**.
*   **UI Overhaul:** Implemented "Zen Mode" to reduce user anxiety (removed progress counters, softened colors).
*   **Mobile Optimization:** Fixed grid layouts and touch targets for mobile use.

## 🤝 Conventions
*   **Local First:** Never assume a backend server exists. All data persists to the device.
*   **Mobile First:** UI must be touch-friendly and responsive.
*   **Privacy:** No analytics, no tracking code.
