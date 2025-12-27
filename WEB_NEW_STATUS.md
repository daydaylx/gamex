# web-new Implementation Status Report

**Date:** 2025-12-26  
**Status:** PARTIALLY COMPLETE (Backend Complete, Frontend UI Needs Work)

## ✅ Completed Components (Backend/Services)

### 1. LocalAPI Service ✅
**File:** `apps/web-new/src/services/api/localApi.ts` (416 lines)

**Fully Implemented:**
- ✅ IndexedDB integration
- ✅ Session CRUD operations
- ✅ Response loading/saving
- ✅ Template loading with caching
- ✅ Scenarios loading
- ✅ Validation integration
- ✅ Comparison integration
- ✅ Request routing (all endpoints)

**Endpoints Implemented:**
- `GET /api/templates` - List templates
- `GET /api/scenarios` - Get scenarios
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session info
- `POST /api/sessions/:id/responses/:person/load` - Load responses
- `POST /api/sessions/:id/responses/:person/save` - Save responses
- `POST /api/sessions/:id/compare` - Compare responses

### 2. Comparison Service ✅
**File:** `apps/web-new/src/services/comparison/compare.ts` (465 lines)

**Fully Implemented:**
- ✅ MATCH/EXPLORE/BOUNDARY bucket classification
- ✅ Risk flagging (low comfort + high interest)
- ✅ Action plan generation
- ✅ Category breakdown
- ✅ Conversation prompt generation
- ✅ Statistical summaries
- ✅ Full TypeScript types

### 3. Storage Service ✅
**File:** `apps/web-new/src/services/storage/indexedDB.ts`

**Fully Implemented:**
- ✅ IndexedDB wrapper with types
- ✅ CRUD operations (get, getAll, put, delete)
- ✅ Database initialization
- ✅ Object store management

### 4. Template Service ✅
**File:** `apps/web-new/src/services/templates/normalize.ts`

**Fully Implemented:**
- ✅ Template normalization logic
- ✅ Question ID generation
- ✅ Module flattening
- ✅ Type-safe implementation

### 5. Validation Service ✅
**File:** `apps/web-new/src/services/validation/validator.ts`

**Fully Implemented:**
- ✅ Response validation
- ✅ Schema-based validation
- ✅ Error reporting
- ✅ TypeScript integration

### 6. Type Definitions ✅
**Files:** `apps/web-new/src/types/*.ts`

**Fully Implemented:**
- ✅ Template types
- ✅ Session types
- ✅ Form/Response types
- ✅ Comparison types
- ✅ API types
- ✅ Storage types

### 7. UI Components (Basic) ✅
**Files:** `apps/web-new/src/components/ui/*.tsx`

**Implemented:**
- ✅ Button component
- ✅ Card component
- ✅ Badge component
- ✅ Layout component

## ❌ Missing Components (Frontend/Views)

### 1. HomeView Integration ❌
**File:** `apps/web-new/src/views/HomeView.tsx` (87 lines)

**Current State:** Uses MOCK_SESSIONS hardcoded data

**Needs:**
```typescript
// Replace MOCK_SESSIONS with:
import { listSessions, createSession } from '../services/api';
import { useEffect, useState } from 'preact/hooks';

export function HomeView() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession(name: string, templateId: string) {
    try {
      await createSession({ name, template_id: templateId });
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }

  // ... rest of component
}
```

**Estimated Time:** 1-2 hours

### 2. SessionView Implementation ❌
**File:** `apps/web-new/src/views/SessionView.tsx` (29 lines stub)

**Current State:** Just a "Work in Progress" placeholder

**Needs:**
- Session info display (name, created date, template)
- Person A/B selection
- Navigation to questionnaire
- Progress indicators
- Comparison button (when both completed)
- Export functionality

**Estimated Time:** 4-6 hours

### 3. Questionnaire Form Components ❌
**Missing Files:** Need to create

**Required Components:**
- `QuestionnaireForm.tsx` - Main form container
- `ConsentRatingInput.tsx` - For consent_rating questions
- `ScaleInput.tsx` - For scale questions
- `EnumInput.tsx` - For single-choice questions
- `MultiInput.tsx` - For multi-choice questions
- `FormProgress.tsx` - Progress bar
- Auto-save logic

**Estimated Time:** 8-12 hours

### 4. Comparison View ❌
**Missing File:** Need to create `ComparisonView.tsx`

**Required Features:**
- Display comparison results from compareSession()
- Filter controls (MATCH/EXPLORE/BOUNDARY)
- Risk-only toggle
- Flagged-only toggle
- Search functionality
- Module/category filter
- Conversation prompts display
- Edit answer links
- Summary statistics display

**Estimated Time:** 8-10 hours

### 5. Scenarios View ❌
**Missing File:** Need to create `ScenariosView.tsx`

**Required Features:**
- Scenario card deck display
- Card navigation (previous/next)
- Answer tracking per person
- Progress indicator
- Deck completion status

**Estimated Time:** 4-6 hours

### 6. Create Session Dialog ❌
**Missing Component:** Template selection UI

**Needs:**
- Modal/dialog component
- Template list from loadTemplates()
- Name input field
- Submit handler calling createSession()

**Estimated Time:** 2-3 hours

## Summary

### Code Statistics
- **Total TypeScript/TSX Lines:** 2,434
- **Backend Services Complete:** ~1,500 lines (62%)
- **Frontend UI Needed:** ~900 lines (38%)

### Implementation Completeness
| Component | Status | Lines | Completeness |
|-----------|--------|-------|--------------|
| LocalAPI | ✅ Complete | 416 | 100% |
| Comparison | ✅ Complete | 465 | 100% |
| Storage | ✅ Complete | ~100 | 100% |
| Templates | ✅ Complete | ~150 | 100% |
| Validation | ✅ Complete | ~100 | 100% |
| Types | ✅ Complete | ~200 | 100% |
| UI Components (Basic) | ✅ Complete | ~300 | 100% |
| HomeView | ⚠️ Stub | 87 | 30% |
| SessionView | ❌ Stub | 29 | 5% |
| Questionnaire Forms | ❌ Missing | 0 | 0% |
| Comparison View | ❌ Missing | 0 | 0% |
| Scenarios View | ❌ Missing | 0 | 0% |
| Create Session Dialog | ❌ Missing | 0 | 0% |

### Overall Progress: ~60% Complete

**Backend/Services:** 100% ✅  
**Frontend/Views:** 15% ❌

## Effort Estimate to Complete

### Phase 1: Connect HomeView (Easy)
**Time:** 2-3 hours  
**Tasks:**
- Replace MOCK_SESSIONS with listSessions()
- Add loading states
- Implement createSession handler
- Add error handling

### Phase 2: Build SessionView (Medium)
**Time:** 4-6 hours  
**Tasks:**
- Load session info via getSessionInfo()
- Display session metadata
- Person A/B selector
- Navigation to questionnaire
- Comparison trigger

### Phase 3: Questionnaire Forms (Hard)
**Time:** 8-12 hours  
**Tasks:**
- Create form components for each question type
- Implement response state management
- Auto-save with debouncing
- Progress tracking
- Form validation UI
- Navigation (next/previous/jump)

### Phase 4: Comparison View (Hard)
**Time:** 8-10 hours  
**Tasks:**
- Render comparison results
- Filter UI implementation
- Category breakdown display
- Conversation prompts rendering
- Interactive elements (edit links, toggles)

### Phase 5: Scenarios View (Medium)
**Time:** 4-6 hours  
**Tasks:**
- Card deck rendering
- Navigation controls
- Answer tracking
- Progress indicators

### Phase 6: Polish & Testing (Medium)
**Time:** 4-6 hours  
**Tasks:**
- Error handling across all views
- Loading states
- Empty states
- Mobile responsiveness testing
- Cross-browser testing

**Total Estimated Time:** 30-43 hours (4-5 full working days)

## Recommendation

### Current Situation
- ✅ **Android APK is now working** with the complete vanilla JS app
- ✅ **Backend infrastructure of web-new is complete**
- ❌ **Frontend UI of web-new needs 4-5 days of work**

### Options

#### Option A: Keep Using Vanilla JS App (Current Status) ✅
**Pros:**
- Already working in APK
- All features functional
- Proven and tested
- Zero additional work needed

**Cons:**
- Older code structure
- No modern framework benefits
- No Tailwind CSS v4

#### Option B: Complete web-new Implementation
**Pros:**
- Modern TypeScript + Preact architecture
- Tailwind CSS v4 (beautiful design already there)
- Type safety
- Better maintainability
- Component reusability

**Cons:**
- Requires 30-43 hours of development
- Needs thorough testing
- Risk of new bugs during migration

#### Option C: Hybrid Approach (Recommended)
1. **Short-term:** Continue using vanilla JS app in production APK ✅
2. **Medium-term:** Complete web-new in parallel over next 1-2 weeks
3. **Long-term:** Switch to web-new when fully tested and feature-complete

## Next Steps (If Completing web-new)

### Week 1
1. Day 1: Phase 1 (HomeView) + Phase 2 (SessionView) - 6-9 hours
2. Day 2-3: Phase 3 (Questionnaire Forms) - 8-12 hours

### Week 2
1. Day 4-5: Phase 4 (Comparison View) - 8-10 hours
2. Day 6: Phase 5 (Scenarios) - 4-6 hours
3. Day 7: Phase 6 (Polish & Testing) - 4-6 hours

Then:
- Update `capacitor.config.json` to `"webDir": "../web-new/dist"`
- Build web-new: `npm run build`
- Sync: `npx cap sync android`
- Build APK: `./gradlew assembleDebug`
- Test thoroughly

## Conclusion

The web-new app has **excellent backend infrastructure** already in place. The LocalAPI, comparison engine, storage, and type systems are production-ready. What's missing is the **UI layer** to connect users to these services.

Given that the immediate problem (broken APK) is now solved with the vanilla JS app, completing web-new should be treated as a **separate enhancement project** rather than urgent fix.

**Recommendation:** Mark the optional TODO as "deferred" and complete it in a future sprint when there's dedicated time for a 4-5 day UI development effort.

---

**Report Generated:** 2025-12-26  
**Status:** Backend Complete ✅ | Frontend Incomplete ❌ | Overall 60% Done

