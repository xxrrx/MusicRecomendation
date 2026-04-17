# Module 3.1 — Player Backend

**Phase:** 3 — Audio Player
**Status:** ✅ Implemented
**Date:** 2026-04-17

---

## Files Created / Modified

```
backend/src/
├── modules/player/
│   ├── player.service.js       — NEW: getStreamUrl, logPlay, logBehavior
│   ├── player.controller.js    — NEW: 3 thin handlers
│   └── player.routes.js        — NEW: 3 routes with auth
├── shared/utils/
│   ├── s3.helper.js            — NEW: getPresignedUrl (AWS SDK v3)
│   ├── bull-queue.js           — NEW: playCountQueue (Bull + processor)
│   ├── __mocks__/s3.helper.js  — NEW: jest mock
│   └── __mocks__/bull-queue.js — NEW: jest mock
├── app.js                      — UPDATED: mount /api/player
└── shared/config/__mocks__/
    └── database.js             — UPDATED: added playHistory.create, userBehavior.upsert mocks

tests/unit/
└── player.service.test.js      — NEW: 11 unit tests (all passing)
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/player/stream/:songId | optional | Generate presigned S3 URL (1hr expiry) |
| POST | /api/player/log | Bearer | Save play_history record + enqueue play_count increment |
| POST | /api/player/behavior | Bearer | Upsert user_behaviors (like/dislike/skip) |

---

## Request / Response

### GET /api/player/stream/:songId
```json
// Response 200
{
  "success": true,
  "data": {
    "songId": "uuid",
    "title": "Song Title",
    "url": "https://bucket.s3.amazonaws.com/audio/uuid.mp3?X-Amz-Signature=..."
  }
}
```

### POST /api/player/log
```json
// Request body
{ "songId": "uuid", "durationPlayed": 180, "completionRate": 0.9 }

// Response 200
{ "success": true, "data": { "logged": true } }
```

### POST /api/player/behavior
```json
// Request body — action: "like" | "dislike" | "skip"
{ "songId": "uuid", "action": "like" }

// Response 200
{ "success": true, "data": { "logged": true } }
```

---

## Key Design Decisions

- **audioUrl stored as S3 key** — not a full URL. `s3.helper.js` signs the key on-demand.
- **Dev fallback** — when `AWS_S3_BUCKET` is not set, `getPresignedUrl` returns `http://localhost:9000/<key>` so the app works without real AWS creds.
- **play_count is async** — incremented via Bull queue (`playCountQueue`) so POST /player/log returns immediately.
- **userBehavior is upserted** — one row per user+song pair; re-liking overwrites the previous action (e.g. dislike → like).
- **completionRate clamped** — forced to [0, 1] range before DB write.

---

## How to Test

### Unit tests (no DB / Redis / AWS needed)
```bash
cd backend
npx jest tests/unit/player.service.test.js
```

### Manual curl smoke tests (requires running stack)
```bash
docker-compose up -d postgres redis
cd backend && npm run dev

# 1. Get a stream URL (no auth required)
curl http://localhost:8080/api/player/stream/<song-uuid>

# 2. Login to get a token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}' \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data.accessToken))")

# 3. Log a play event
curl -X POST http://localhost:8080/api/player/log \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"songId":"<song-uuid>","durationPlayed":180,"completionRate":0.9}'

# 4. Log a behavior
curl -X POST http://localhost:8080/api/player/behavior \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"songId":"<song-uuid>","action":"like"}'
```

### Verify play_count incremented
```bash
# Check DB after logging a play
curl http://localhost:8080/api/music/songs/<song-uuid>
# → playCount should be incremented (after Bull job processes)
```
