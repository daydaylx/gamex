# Test Coverage Report
**Date:** 2025-12-27
**Status:** All Tests Passed ✅

## Summary
A comprehensive test suite has been implemented for the `apps/web-new` project, covering services, components, and integration flows.

**Total Tests:** 81

## Coverage Details

### 1. Service Layer (Unit Tests)
Located in `tests/unit/services/`

*   **`api.test.ts`**:
    *   Session creation and retrieval.
    *   Template loading and caching strategy.
    *   Scenario data fetching.
    *   Response persistence to `localStorage`.
*   **`interview-storage.test.ts`**:
    *   `createInterviewSession`: Initialization logic.
    *   `saveInterviewAnswer`: Updating session state.
    *   `getCombinedSession`: Merging answers from Person A and Person B.
*   **`comparison/compare.test.ts`**: (Existing) Logic for comparing answers.
*   **`validation/validator.test.ts`**: (Existing) Input validation rules.

### 2. Component Layer (Integration Tests)
Located in `tests/component/`

*   **`UnifiedInterviewScreen.test.tsx`**:
    *   Verifies the "Master Controller" logic.
    *   Tests navigation from Dashboard -> Decks -> Dashboard.
    *   Tests navigation from Dashboard -> Modules -> Questionnaire.
    *   Tests Check-in flow entry.
*   **`ScenariosView.test.tsx`**:
    *   Deck rendering and "Initial Deck" prop handling.
    *   Navigation between scenario cards.
    *   Interaction with answer buttons (Option A-D).
*   **`QuestionnaireForm.test.tsx`**:
    *   Dynamic schema rendering (Text, Scale, etc.).
    *   "Initial Module" jumping logic.
    *   Form validation (Next/Finish button state).
    *   Completion callback triggering.

## Infrastructure
*   **Environment:** `jsdom` configured in `vite.config.ts`.
*   **Setup:** `tests/setup.ts` loads `@testing-library/jest-dom` matchers.
*   **Mocks:** `localStorage` and `fetch` are globally mocked/spied upon.

## How to Run
```bash
cd apps/web-new
npm run test
```
