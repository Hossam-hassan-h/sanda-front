# Implementation Plan

Refactor and simplify all user flows (admin panel, employer, worker) following best practices — reducing duplication, cleaning unused imports, improving navigation, and making the UI simpler and more intuitive.

## Scope
- **Admin Panel**: AdminUsers, AdminUserDetail, AdminJobDetail
- **Employer**: MyJobs
- **Worker**: WorkerJobs, ActiveJob
- **Components**: No new components needed; all changes are within existing pages.
- **Data Layer**: Minor fixes to mock data and API.

## [Types]
No new types needed. The existing `User` and `Job` types from `src/api/types.ts` are sufficient.

## [Files]

### Files to modify:
1. **src/pages/admin/AdminUserDetail.tsx** — Remove unused imports, fix type usage, add navigation from user cards to jobs
2. **src/pages/admin/AdminJobDetail.tsx** — Replace manual UserInfoCard `user` type with proper `User` type, add click-to-navigate on user cards to `/admin/users/:id`, simplify render logic
3. **src/pages/admin/AdminUsers.tsx** — Change mobile dropdown to also include "عرض الملف" option
4. **src/pages/worker/WorkerJobs.tsx** — Remove unused imports (`ArrowLeft`, `QrCode`), simplify job filtering logic
5. **src/pages/jobs/MyJobs.tsx** — Remove unused `useMyAssignments` and `_assignments` enrichment
6. **src/pages/jobs/ActiveJob.tsx** — Add back button, minor cleanup
7. **src/api/jobAssignments.ts** — Remove unused `getCurrentUserId()` helper (not needed elsewhere)
8. **src/api/jobs.ts** — Ensure `acceptApplicant` properly triggers query invalidation for employer jobs

## [Functions]

### Modified Functions:
1. **AdminUserDetail** — Remove unused `Tabs` import, replace `User` import usage with `const user` type inference from `useUserQuery`
2. **AdminJobDetail** — Add `navigate` to user cards so clicking employer/worker goes to `/admin/users/:id`
3. **WorkerJobs** — Simplify `acceptedJobs` memo to just filter `allJobs` by `workerId === user.id` (remove `assignments` dependency since accepted application already sets `workerId`)
4. **MyJobs** — Remove `useMyAssignments` hook call and `jobsWithInfo` enrichment since `_assignments` is never rendered

## [Classes]
No class modifications.

## [Dependencies]
No changes.

## [Testing]
No test changes. Manual testing flow:
1. Login as admin → Users → click user → see user details with jobs list
2. Admin → Jobs → click job → see employer + worker cards that link to user details
3. Login as employer → MyJobs → tabs filter correctly, buttons navigate correctly
4. Login as worker → WorkerJobs → shows accepted jobs with QR access
5. Worker → ActiveJob → QR scanner / attendance log

## [Implementation Order]
1. Clean up `AdminUserDetail.tsx` — remove unused imports, add navigation
2. Clean up `AdminJobDetail.tsx` — fix UserInfoCard type, add click-to-navigate on user names
3. Clean up `AdminUsers.tsx` — add "عرض الملف" to mobile dropdown
4. Clean up `WorkerJobs.tsx` — remove unused imports, simplify logic
5. Clean up `MyJobs.tsx` — remove unused `useMyAssignments`
6. Clean up `ActiveJob.tsx` — add back button
7. Clean up API files — remove unnecessary code
8. Build and verify