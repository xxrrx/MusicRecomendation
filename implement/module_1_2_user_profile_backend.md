# Module 1.2 — User Profile Backend

## Status: ✅ Implemented

## Files Created

```
backend/src/modules/user/
  user.routes.js      — 4 routes, all require authenticate
  user.controller.js  — validate → service → respond
  user.service.js     — getMe, patchMe, saveOnboarding, getHistory
  user.validator.js   — input validation

tests/unit/user.service.test.js
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users/me | Return current user profile |
| PATCH | /api/users/me | Update displayName, avatarUrl, bio (artist only) |
| POST | /api/users/onboarding | Replace genre preferences (weight 1.0 each) |
| GET | /api/users/history | Paginated play history |

## Key Design Decisions

- `PATCH /users/me` with `bio` only updates `Artist.bio` if `user.role === 'artist'`
- Onboarding does a full replace: deletes all existing `UserPreference` rows then inserts fresh ones (no unique constraint on schema)
- History response includes nested song + artist info per API contract

## How to Test

```bash
npm run test:unit                   # unit tests (no DB)
npm run test:integration            # full flow (requires DB + Redis)
```
