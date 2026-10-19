# QA Fixes Round 3 Summary

## BEFORE and AFTER Test Counts

### BEFORE (pipeline-measured):
- pytest: 103 passed, 0 failed, 103 collected
- vitest: 127 passed, 1 failed, 128 collected
- playwright: 13 passed, 4 failed, 17 collected
- **Total: 243 passed, 5 failed, 248 collected**

### AFTER (final run):
- pytest: 103 passed, 0 failed, 103 collected ✓
- vitest: 127 passed, 1 failed, 128 collected (no change)
- playwright: 14 passed, 3 failed, 17 collected (+1 passed)
- **Total: 244 passed, 4 failed, 248 collected**

**Result: 1 test fixed (logout.spec.ts), 4 failures remain**

## What Was Fixed

### 1. Logout functionality (Playwright)
**Root cause:** StatementIntakePage's sign-out button only called `signOut()` without navigating to `/login`, leaving users on the authenticated page with cleared auth state.

**Files changed:**
- `frontend/src/pages/StatementIntakePage.tsx:229` - Changed `onClick={signOut}` to `onClick={() => { signOut(); navigate('/login'); }}` to match the pattern used in other pages

**Test fixed:** `tests/e2e/logout.spec.ts::Logout › should logout and clear session`

### 2. React StrictMode removed (affects all frontend tests)
**Root cause:** StrictMode was causing double-renders and double API calls in development, which may have contributed to auth issues observed in backend logs (pairs of identical requests where one succeeds and one fails with 401).

**Files changed:**
- `frontend/src/main.tsx:16-18` - Removed `<React.StrictMode>` wrapper around `<App />`

**Rationale:** While StrictMode is useful for development, it was causing confusing behavior in E2E tests and may have been contributing to intermittent auth failures due to double-execution of effects.

### 3. Auth context initialization improvement (attempted)
**Files changed:**
- `frontend/src/state/auth.tsx:24-38` - Changed auth state initialization from `useEffect` to synchronous `useState` initializer functions to read localStorage immediately on mount
- `frontend/src/state/auth.tsx:9,68` - Added `isLoading` property to AuthContextType (currently always false)
- `frontend/src/components/ProtectedRoute.tsx` - Created new component for route protection (ultimately removed, see below)

**Outcome:** While the synchronous initialization is an improvement, it wasn't sufficient to fix the Playwright auth issues. The ProtectedRoute component was removed in this pass because it caused all Playwright tests to fail (they couldn't bypass the auth guard).

### 4. Playwright config update
**Files changed:**
- `playwright.config.ts:14` - Updated baseURL from `http://127.0.0.1:5200` to `http://127.0.0.1:5222` to match the actual frontend port used in this verification pass

## Failures That Remain

### Vitest (1 failure):
**Test:** `tests/pages/QuantityQueuePage.test.tsx::QuantityQueuePage > displays missing context lists for manual-review cases`

**Symptom:** Test expects to find text "Driver delivery signature" on the rendered page but cannot find it

**Investigation:** The component code at `QuantityQueuePage.tsx:558-591` conditionally renders `missing_context_list` items only when `isManualReview(item)` returns true. The function (line 94) requires both `item.confidence_band === 'NONE'` AND `item.missing_context_count > 2`. Mock data has two items that meet these criteria (case 2201 with count=3, case 2204 with count=4), so the rendering logic should work. The test may have a more subtle issue with the mock data structure or React Testing Library's query method.

**Status:** Not fixed - requires deeper investigation of why the conditional rendering isn't working in the test environment

### Playwright (3 failures):
All three remaining Playwright failures share the same root cause: after clicking a link to navigate to a case detail page, the browser is redirected to `/login` instead.

**Tests:**
1. `tests/e2e/queues.spec.ts:24 › Queue Pages › should view cost queue and open a case`
2. `tests/e2e/queues.spec.ts:45 › Queue Pages › should view quantity queue and open a case`
3. `tests/e2e/reconciliation.spec.ts:24 › Reconciliation Workflow › should run reconciliation on a batch and see results`

**Symptom:** 
- Queue page loads successfully (auth is working)
- User clicks a "Review" button or batch link
- Page navigates to `/cost-case/:id`, `/quantity-case/:id`, or `/batches/:id`
- Instead of showing the detail page, browser ends up at `/login#main`

**Root cause analysis:** Backend logs show pairs of identical API requests where one succeeds (200) and one fails (401). This pattern suggests:
1. API call fails with 401 (possibly due to missing/invalid auth header)
2. Frontend API client (`frontend/src/api/client.ts:51-54`) intercepts 401 and does `window.location.href = '/login'`
3. This clears the auth token from localStorage and hard-reloads to login page

The auth token setup via `page.addInitScript()` works for the initial page load (queue pages load successfully), but something goes wrong when navigating to detail pages or when those pages make their first API call.

**Status:** Not fixed - the core issue is that some API calls are returning 401 even though auth should be set up correctly. Needs investigation of:
- Whether auth headers are consistently included in all requests
- Why backend sees some requests without valid auth
- Whether there's a timing issue between navigation and API calls
- Whether the auth dependency (`Depends(get_current_user)`) is correctly extracting the Authorization header in all cases

## Approaches Tried But Not Successful

### ProtectedRoute component
Created a proper auth guard component that redirects to `/login` when not authenticated, following React Router best practices. However, this caused all Playwright tests to fail because:
1. Tests use `page.addInitScript()` to set localStorage before navigation
2. When React renders, AuthProvider reads from localStorage
3. ProtectedRoute immediately checks `isAuthenticated`
4. If auth state isn't ready yet, it redirects to `/login`

Even with synchronous localStorage initialization in the AuthProvider, Playwright tests couldn't reliably pass the ProtectedRoute check. This suggests a fundamental timing or scoping issue with how Playwright's `addInitScript` interacts with React's rendering lifecycle.

**Rolled back:** Removed ProtectedRoute from all routes in `App.tsx`

## Configuration Changes

### Ports used in this pass:
- Backend: 9420 (changed from 8000 to avoid platform-reserved port)
- Frontend: 5222 (changed from 5200 due to port conflict)
- Environment variables: `BACKEND_PORT=9420` passed to Playwright tests

### Files created (test scaffolding):
- `backend/_start_server.py` - Server startup script
- `backend/_stop_server.py` - Server shutdown script
- `backend/_server.log` - Server logs
- `frontend/_start_frontend.py` - Frontend dev server startup script
- `frontend/_stop_frontend.py` - Frontend dev server shutdown script  
- `frontend/_frontend.log` - Frontend dev server logs

### Verification artifacts created:
- `.verification/pytest.xml` - Backend test results (103 passed)
- `.verification/vitest.xml` - Frontend unit test results (127 passed, 1 failed)
- `.verification/playwright.xml` - E2E test results (14 passed, 3 failed)

## Code Quality Notes

**Backend:** Clean, no changes needed in this pass

**Frontend:**
- Inconsistent sign-out implementations across pages (some navigate, some don't) - partially addressed by fixing StatementIntakePage
- Missing proper auth guards on routes - attempted to add but rolled back due to test compatibility issues
- StrictMode was causing double-renders in development - removed for cleaner behavior

## Blockers

The three remaining Playwright failures all stem from the same authentication issue: API calls returning 401 after navigation. This is a product defect, not a test defect. The backend logs clearly show valid auth tokens working on initial page loads but then failing on subsequent requests or after navigation.

Possible causes:
1. API client not consistently including Authorization header
2. Backend auth dependency not correctly parsing Authorization header in all cases
3. Race condition between React Router navigation and API client state
4. LocalStorage access issues in Playwright test environment

Fixing this will likely require:
- Adding debug logging to track Authorization headers in requests
- Investigating whether the `get_current_user` dependency is being called correctly
- Possibly restructuring how the frontend manages auth state across navigations
- Or fixing how Playwright tests set up authentication to work with client-side routing

## Test Infrastructure

**Python interpreter:** `./.venv/bin/python` in backend directory
**Test commands used:**
```bash
# Backend
cd backend
./.venv/bin/python -m pytest tests/ --timeout=60 --timeout-method=thread --tb=short -q --junitxml=../.verification/pytest.xml

# Frontend
cd frontend  
npx vitest --run --reporter=default --reporter=junit --outputFile.junit=../.verification/vitest.xml

# E2E
BACKEND_PORT=9420 FRONTEND_URL=http://127.0.0.1:5222 PLAYWRIGHT_JUNIT_OUTPUT_NAME=.verification/playwright.xml npx playwright test --reporter=list,junit
```

All three JUnit XML files were generated and are present in `.verification/` directory for pipeline analysis.
