# سندة — Agent Guide

## Stack
- Vite 5 + React 18 + TypeScript + Tailwind CSS 3 + shadcn/ui
- SWC via `@vitejs/plugin-react-swc` (fast refresh, no Babel)
- react-router-dom v6, @tanstack/react-query v5, axios, recharts
- **Unit tests**: Vitest + @testing-library/react + jsdom
- **E2E tests**: Playwright via `lovable-agent-playwright-config`

## Key commands
| Command | Action |
|---|---|
| `npm run dev` | Dev server on port **8080** (HMR overlay disabled) |
| `npm run build` | Production build |
| `npm run build:dev` | Dev-mode build (includes `componentTagger`) |
| `npm run lint` | ESLint (unused-vars rule **off**) |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch |
| `npm run preview` | Vite preview |

## Architecture

```
src/
├── api/           ← Axios instance + mock data toggle
│   ├── client.ts  ← axios.create(), JWT interceptor, USE_MOCKS flag
│   └── {auth,jobs,wallet,...}.ts  ← API functions
├── hooks/         ← React Query hooks (useJobs, useWallet, etc.)
├── context/       ← AuthContext (user + token in localStorage)
├── pages/         ← Page components (jobs/, admin/, auth/, ...)
├── components/    ← shadcn/ui + custom components
├── layouts/       ← AdminLayout, AuthLayout, UserLayout, SettingsLayout
├── lib/           ← utilities, MockSocket, mock data
└── services/api/  ← Admin-specific API (users, reports, jobs, wallet, chat)
```

## Data layer quirks

- **`USE_MOCKS = false`** in `src/api/client.ts:58` — flip to `true` to use mock data instead of real backend calls.
- **Auth**: Uses `localStorage` keys `sanda_token` and `sanda_user`. No real JWT validation yet.
- **Socket**: `src/lib/socket.ts` exports a `MockSocket` class (no socket.io dependency). Replace with real `io()` when backend is ready.
- **React Query**: Default `staleTime: 30_000`, `refetchOnWindowFocus: false` (set in `src/App.tsx:42-44`).
- **Path alias**: `@/*` → `./src/*` (configured in vite.config.ts and vitest.config.ts).
- **Axios interceptor** (`client.ts:27-42`): Unwraps `{ status, data, ...rest }` responses. For array `data` → `res.data = { ...rest, data }`. For non-array `data` with empty `rest` → `res.data = data`. **Consequence**: frontend API functions must NOT double-access `.data`. E.g., for `POST /job-assignments/:id/check-in-qr` returning `{ status: "success", data: { qrToken, type, expiresAt } }`, the interceptor makes the response body = `{ qrToken, type, expiresAt }`, so frontend returns `body` not `body.data`. For paginated list endpoints with `rest = { pagination }`, the structure becomes `{ pagination, data: [...] }` and `body.data` is correct. See the interceptor logic in `client.ts:30-38`.

## RTL & Arabic

- `<html lang="ar" dir="rtl">` in `index.html`
- **Cairo** font via Google Fonts (`index.css:1`)
- Use Tailwind **logical properties** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) instead of `ml/mr/pl/pr/left/right`
- All UI text is Arabic

## TypeScript & linting relaxed

- `tsconfig.json`: `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, `strictNullChecks: false`
- `eslint.config.js`: `@typescript-eslint/no-unused-vars` **off**
- `tsconfig.app.json` includes `vitest/globals` types (no explicit vitest imports needed in tests)

## Tests

- Unit test pattern: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `src/test/setup.ts` (mocks `matchMedia`)
- Test wrapper pattern: wrap components in `QueryClientProvider` (see `src/test/qr.test.tsx:51-65`)
- E2E config in `playwright.config.ts` uses `lovable-agent-playwright-config` (Lovable-specific)
- CI (`test.yml`): `npm ci || npm install` then `npm test` on push/PR to main/master
- Don't use `npm test -- --run` — just `npm test` is enough (vitest run)

## Project origins

- Built with **Lovable** (lovable.dev); `src/api/client.ts` and `src/lib/socket.ts` have inline comments showing the real backend code to uncomment
- `.lovable/plan.md` has the original project blueprint
- `components.json` confirms shadcn/ui config (non-RSC, default style, slate base, CSS variables)

## Session Summary — Bug Fixes (QR, Admin Reports, Worker Assignments)

### Done
- **`jobAssignments.ts`**: Fixed `generateCheckInQR`, `generateCheckOutQR` — removed double `.data` access caused by axios interceptor unwrapping. Same fix for `checkInWithQR`, `checkOutWithQR`.
- **`jobAssignments.ts`**: Fixed `mapAssignment` to handle unpopulated worker/employer fields (when backend returns ObjectId string instead of populated object).
- **Admin `reports.ts` endpoints**: Fixed `fetchReportById` — removed double `.data` access (same interceptor issue).
- **`AGENTS.md`**: Added interceptor quirk documentation; updated USE_MOCKS value to `false`.

### Root Cause
The axios interceptor at `client.ts:27-42` unwraps `{ status, data, ...rest }` responses:
- Non-array `data` with empty `rest` → response becomes the `data` value directly
- Array `data` → response becomes `{ ...rest, data }` (preserving pagination alongside data)
- Frontend API functions were incorrectly accessing `body.data` on already-unwrapped responses, causing silent `undefined` returns → toast errors for QR and "not found" for admin report detail.

### Remaining
- Test QR generation + scanning end-to-end
- Verify admin report detail page loads correctly
- Verify worker's active job page scanner works post-fix

## Session Summary — Document Verification Flow

### Done
- **Backend `users.model.js`**: Added `is_verified` (Boolean) and `verification_status` (enum: none/pending/approved/rejected) fields.
- **Backend `notification.model.js`**: Added `"verification_request"` to NOTIFICATION_TYPES and `"user"` to entity_type enum.
- **Backend `user.service.js`**: `uploadDocuments` now sets `verification_status = "pending"` and creates `verification_request` notifications for all active admins (with deduplication).
- **Backend `admin.service.js`**: Fixed `verifyUser` to set `is_verified: true, verification_status: "approved"` (was incorrectly setting `is_active`). Added `unverifyUser` (sets `is_verified: false, verification_status: "rejected"`).
- **Backend `admin.controller.js`**: Added `verifyUser` and `unverifyUser` controllers.
- **Backend `admin.routes.js`**: Added `PATCH /admin/users/:id/verify` and `PATCH /admin/users/:id/unverify` routes.
- **Frontend `types.ts`**: Added `is_verified`, `verification_status`, `nationalId`, `profile_image` to User interface.
- **Frontend `NotificationDropdown.tsx`**: Added `verification_request` type with shield icon; click navigates to `/admin/users/:userId`.
- **Frontend `NotificationsPage.tsx`**: Added `verification_request` type config, filter, and navigation handler.
- **Frontend `AdminUserDetail.tsx`**: Removed all localStorage-based verification request tracking (`VERIFICATION_REQUESTS_KEY`, `persistReview`). Now derives `verificationRequest` from API fields (`verification_status`, `nationalId`, `profile_image`). Removed unused `useAuth` import.

### Key Decisions
- Verification documents are served from Cloudinary URLs stored in `nationalId.front.url`, `nationalId.back.url`, `profile_image.url` — no base64 localStorage abuse.
- The "إعادة فتح للمراجعة" button was removed since it only worked with localStorage. Admins can ask users to re-upload.
- "Rejection reason" display kept in UI but backend doesn't store it yet; will show if present.
- Deduplication key for verification notifications prevents spam on repeated uploads.

### Bug Fix — Notification Click Routing (Reports & Verification)

**Problem**: Clicking report notifications went nowhere because the code checked `notification.metadata?.reportId`, but the backend stores the report ID in `entity_id` (mapped to `entityId` by `mapNotification`). Additionally, report notifications with an associated `job` field would incorrectly navigate to the job page (jobId check came before report check). Verification request navigation also failed when `actor` was an Object (populated user) rather than a string.

**Fix** (`NotificationDropdown.tsx`, `NotificationsPage.tsx`):
- Added `entityType === "report"` check before the jobId check — navigates to `/admin/reports/:entityId`
- Fixed verification_request to extract the target ID from `entityId` first, then fall back to `actor.id` / `actor._id` when `actor` is a populated object
- Removed the dead `metadata?.reportId` fallback (backend never sets `metadata`)
