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

- **`USE_MOCKS = true`** in `src/api/client.ts:28` — flip to `false` when the Node backend is ready. Every API function checks this flag and returns mock data or real axios calls.
- **Auth**: Uses `localStorage` keys `sanda_token` and `sanda_user`. No real JWT validation yet.
- **Socket**: `src/lib/socket.ts` exports a `MockSocket` class (no socket.io dependency). Replace with real `io()` when backend is ready.
- **React Query**: Default `staleTime: 30_000`, `refetchOnWindowFocus: false` (set in `src/App.tsx:42-44`).
- **Path alias**: `@/*` → `./src/*` (configured in vite.config.ts and vitest.config.ts).

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

## Session Summary — Phase 2 (Profile Editing)

### Done
- `authApi.updateProfile(id, data)` in `src/api/auth.ts` calls `PUT /users/profile/:id`
- `Profile.tsx` `handleProfileUpdate` now calls the API (was local-only), shows error toast on failure
- Blob avatar URLs are stripped from the API call (backend can't store blob URLs)
- Backend had `city`/`skills` fields added, password min length aligned to 8
- Login + registration verified end-to-end

### Remaining
- Avatar upload needs multipart upload via `PATCH /users/documents/:id` (separate feature)
- Wallet, chat, notifications, reports, admin remain mock-only (no backend endpoints)
