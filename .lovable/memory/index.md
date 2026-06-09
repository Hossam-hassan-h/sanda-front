# Project Memory

## Core
Project: Sanda (سندة) — منصة وظائف بارت-تايم RTL عربي. Font: Cairo. Tokens: Indigo primary, Amber accent (HSL in index.css).
Frontend-only with mock data في src/lib/mock/data.ts. للربط بالـ Node backend غيّر USE_MOCKS=false في src/api/client.ts.
كل API calls عبر طبقة src/api/* + React Query hooks في src/hooks/*.
Roles: worker | employer | admin. AuthContext في src/context/AuthContext.tsx، token محفوظ في localStorage باسم sanda_token.
كل الـ layouts (Main/Auth/Admin) في src/layouts/. ProtectedRoute في src/components/.

## Memories
- Pages: Landing, auth/(Login,Register), jobs/(Feed,Details,Post,My,Applicants,Active), wallet/Wallet, chat/Chat, profile/Profile, admin/(Dashboard,Users,Reports), NotFound
- VITE_API_URL env var للـ backend base URL (default http://localhost:5000/api)
