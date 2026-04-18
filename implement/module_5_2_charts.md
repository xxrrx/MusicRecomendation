# Module 5.2 — Charts

**Phase:** 5 — Search & Charts
**Status:** ✅ Implemented
**Date:** 2026-04-18

---

## Files Created / Modified

```
backend/src/
├── modules/charts/
│   ├── charts.service.js      — NEW: getChart, computeAndCacheChart, upsertSystemPlaylist
│   ├── charts.controller.js   — NEW: thin handler
│   └── charts.routes.js       — NEW: GET /api/charts/:type
├── shared/utils/
│   └── bull-queue.js          — UPDATED: chartQueue + 3 cron jobs
│   └── __mocks__/bull-queue.js — UPDATED: added chartQueue mock
├── shared/config/__mocks__/
│   └── database.js            — UPDATED: added playHistory.groupBy mock
├── app.js                     — UPDATED: mount /api/charts

frontend/src/
├── lib/
│   └── chartsApi.js           — NEW: fetchChart()
├── pages/
│   └── ChartsPage.jsx         — NEW: tab switcher + ranked song list
├── App.jsx                    — UPDATED: added /charts route

tests/unit/
└── charts.service.test.js     — NEW: 6 backend unit tests
frontend/src/tests/
└── search.test.jsx            — UPDATED: ChartsPage tests included (5 tests)
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/charts/daily | None | Top 50 songs for today |
| GET | /api/charts/weekly | None | Top 50 songs for last 7 days |
| GET | /api/charts/monthly | None | Top 50 songs for last 30 days |

**Response shape:**
```json
{
  "type": "daily",
  "title": "Daily Top 50",
  "songs": [ { "id": "...", "title": "...", ... } ],
  "computedAt": "2026-04-18T00:00:00.000Z"
}
```

---

## Key Design Decisions

- **`playHistory.groupBy`** — aggregates play counts per song within the time window to rank songs by actual listens (not all-time `playCount`).
- **Cold-start fallback** — if < 10 plays in the period, falls back to all-time `playCount` ranking so charts are never empty.
- **System playlists** — chart data is persisted to the `playlists` table with `isSystem=true` so the AI module can reference chart data.
- **Bull cron jobs** — daily (midnight), weekly (Monday midnight), monthly (1st of month). Jobs call `computeAndCacheChart` which invalidates Redis.
- **Redis cache 1 hour** — chart data is served from cache between cron runs; on first request the chart is computed on-demand.
- **Upsert is async** — `upsertSystemPlaylist` runs without blocking the HTTP response (fire-and-forget with error logging).

---

## Cron Schedule

| Chart | Cron | Description |
|-------|------|-------------|
| daily | `0 0 * * *` | Every day at midnight |
| weekly | `0 0 * * 1` | Every Monday at midnight |
| monthly | `0 0 1 * *` | 1st of every month at midnight |

---

## How to Test

```bash
# Backend
cd backend
npx jest tests/unit/charts.service.test.js

# Frontend
cd frontend
npx vitest run src/tests/search.test.jsx
```
