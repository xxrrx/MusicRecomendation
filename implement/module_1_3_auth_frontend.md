# Module 1.3 — Auth Frontend

## Status: ✅ Implemented

## Files Created

```
frontend/src/
  lib/api.js                    — axios instance with auto token attach + 401 refresh interceptor
  stores/authStore.js           — Zustand store (persisted): accessToken, refreshToken, user, isAuthenticated
  components/ProtectedRoute.jsx — redirects to /login if not authenticated
  pages/LoginPage.jsx           — login form → setAuth → redirect to / or /onboarding
  pages/RegisterPage.jsx        — register form → success screen with email notice
  pages/VerifyEmailPage.jsx     — reads ?token from URL, calls /auth/verify-email
  pages/OnboardingPage.jsx      — fetches genres, lets user pick, calls /users/onboarding
  tests/setup.js                — vitest + testing-library setup
  tests/auth.test.jsx           — ProtectedRoute, LoginPage, authStore tests
App.jsx                         — updated with all routes
```

## Routes

| Path | Auth | Component |
|------|------|-----------|
| /login | public | LoginPage |
| /register | public | RegisterPage |
| /verify-email?token=... | public | VerifyEmailPage |
| /onboarding | protected | OnboardingPage |
| / | protected | Home placeholder |

## Key Design Decisions

- `authStore` is persisted to localStorage via zustand/middleware `persist`
- api.js interceptor auto-attaches `Authorization: Bearer` and auto-refreshes on 401
- `ProtectedRoute` preserves `from` location for post-login redirect
- Login redirects to `/onboarding` if `user.isOnboarded === false`, otherwise to intended page

## How to Test

```bash
cd frontend
npm install          # installs vitest + testing-library
npm test             # run all tests
```

Tests cover:
- Unauthenticated user redirected to /login
- Authenticated user sees protected content
- Login error shown on bad credentials
- Login redirects to / for returning users
- Login redirects to /onboarding for new users
- authStore setAuth / clearAuth
