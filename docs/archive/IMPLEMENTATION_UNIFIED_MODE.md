# Implementation Report: Unified Interview Mode
**Date:** 2025-12-27
**Status:** Complete ✅

## Overview
We have transitioned from a fragmented UI (separate screens for Scenarios vs. Questionnaires) to a unified "Interview Mode" driven by a single Master Controller.

## Key Changes

### 1. New Core Component: `UnifiedInterviewScreen.tsx`
This component acts as the state machine for the user's journey.
- **State Management:** Tracks current stage (`dashboard`, `checkin`, `deck`, `module`).
- **Data Loading:** Pre-fetches all necessary templates and scenarios in parallel.
- **Navigation:** Handles transitions between stages without page reloads.

### 2. The Dashboard
A new internal view that allows users to pick their path:
- **Decks:** Visual cards for Scenario Decks (e.g., "Warm-Up", "High Risk").
- **Modules:** Visual cards for Questionnaire Modules.
- **Check-in:** A dedicated entry point for the initial 12-question warm-up.

### 3. Integration Details
- **Check-in:** Implemented using a lightweight wrapper around `InterviewMiniForm`.
- **Questionnaires:** `QuestionnaireForm` is now rendered as a sub-view within the Unified Screen.
- **Scenarios:** `ScenariosView` is rendered as a sub-view.
- **Routing:** Updated `App.tsx` to route `/sessions/:id/interview/:person` to the new Unified Screen.

## User Flow
1. **Lobby (SessionView):** User selects "Person A".
2. **Dashboard:** User sees "Check-in" recommendation.
3. **Check-in:** User answers 12 rapid-fire questions.
4. **Dashboard:** User selects "Deck 1: Warm-Up".
5. **Deck Play:** User swipes through scenario cards.
6. **Dashboard:** User selects "Module: Logistics".
7. **Module Play:** User answers specific logistics questions.

## Files Created/Modified
- `apps/web-new/src/screens/UnifiedInterviewScreen.tsx` (New)
- `apps/web-new/src/App.tsx` (Modified Route)
- `apps/web-new/src/views/SessionView.tsx` (Updated Text)
- `apps/web-new/src/services/api.ts` (Added `loadTemplate` export)
