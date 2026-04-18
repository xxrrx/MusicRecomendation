# Module 5.1 — Search

**Phase:** 5 — Search & Charts
**Status:** ✅ Implemented
**Date:** 2026-04-18

---

## Files Created / Modified

```
backend/src/
├── modules/search/
│   ├── search.service.js      — NEW: search across songs, artists, albums
│   ├── search.controller.js   — NEW: thin handler
│   └── search.routes.js       — NEW: GET /api/search
├── app.js                     — UPDATED: mount /api/search

frontend/src/
├── lib/
│   └── searchApi.js           — NEW: searchAll()
├── pages/
│   └── SearchPage.jsx         — NEW: search input, type filters, results grid
├── App.jsx                    — UPDATED: added /search route

tests/unit/
└── search.service.test.js     — NEW: 8 backend unit tests
frontend/src/tests/
└── search.test.jsx            — NEW: 6 frontend tests (SearchPage)
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/search?q=&type=&limit= | Optional | Search songs, artists, albums |

**Query params:**
- `q` (required) — search keyword
- `type` — `all` (default) | `songs` | `artists` | `albums`
- `limit` — results per category, default 10, capped at 50

---

## Key Design Decisions

- **Prisma `contains` with `mode: 'insensitive'`** — works out-of-the-box without raw SQL; PostgreSQL uses `ILIKE` under the hood.
- **Parallel queries** — `Promise.all` on all three categories simultaneously.
- **Redis cache 30 min** — cache key includes `type`, lowercased `q`, and `limit`.
- **Type filter** — when `type` is not `all`, the unneeded queries are short-circuited with `Promise.resolve([])`.

---

## How to Test

```bash
# Backend
cd backend
npx jest tests/unit/search.service.test.js

# Frontend
cd frontend
npx vitest run src/tests/search.test.jsx
```
