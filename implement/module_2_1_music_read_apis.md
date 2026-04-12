# Module 2.1 — Music Read APIs

**Phase:** 2 — Music Catalog
**Status:** ✅ Implemented
**Date:** 2026-04-11

---

## Files Created / Modified

```
backend/src/
└── modules/music/
    ├── music.service.js     — NEW: business logic + Redis cache
    ├── music.controller.js  — UPDATED: 4 handlers (was stub with 1 broken handler)
    └── music.routes.js      — UPDATED: 4 routes (was 0 real routes)

backend/src/shared/config/__mocks__/
└── database.js              — UPDATED: added song, album, genre mock models

tests/unit/
└── music.service.test.js    — NEW: 11 unit tests
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/music/songs/:id | public | Song detail (published only) |
| GET | /api/music/songs | public | List songs with filters |
| GET | /api/music/albums/:id | public | Album detail with song list |
| GET | /api/music/artists/:id | public | Artist profile with songs + albums |

---

## Query Params — GET /api/music/songs

| Param | Type | Default | Constraint |
|-------|------|---------|------------|
| `page` | number | 1 | |
| `limit` | number | 20 | capped at 50 |
| `genreId` | string | — | UUID |
| `artistId` | string | — | UUID |

---

## Redis Cache

| Key | TTL | Cached on |
|-----|-----|-----------|
| `song:{id}` | 1h | getSongById |
| `album:{id}` | 1h | getAlbumById |
| `artist:{id}` | 1h | getArtistById |

Song list (`GET /songs`) is **not cached** — results vary by filter params.

---

## How to Test

### Unit tests (no DB/Redis needed)
```bash
cd backend
npx jest tests/unit/music.service.test.js
```

### Manual curl smoke tests (requires running stack)
```bash
# Start DB + Redis
docker-compose up -d postgres redis
cd backend && npm run dev

# List songs
curl http://localhost:8080/api/music/songs

# Filter by genre (use a genre UUID from seed)
curl "http://localhost:8080/api/music/songs?genreId=<genre-uuid>"

# Song detail
curl http://localhost:8080/api/music/songs/<song-uuid>

# Album detail
curl http://localhost:8080/api/music/albums/<album-uuid>

# Artist detail
curl http://localhost:8080/api/music/artists/<artist-uuid>
```

### Verify Redis cache hit/miss
```bash
# First call → DB hit (cache MISS)
curl http://localhost:8080/api/music/songs/<song-uuid>

# Second call → cache HIT (no DB query, same response)
curl http://localhost:8080/api/music/songs/<song-uuid>

# Check Redis directly
docker-compose exec redis redis-cli GET song:<song-uuid>
```

---

## Notes

- Only `published` songs are returned on all public endpoints.
- `GET /api/music/artists/:id` returns top 10 published songs by play count (matches API contract).
- `totalPlayCount` on artist is computed from the top-10 songs returned (sufficient for display; full aggregate requires a separate analytics query).
- Fixed a bug in the previous `music.controller.js` stub: `res.json(success(genres))` → `success(res, genres)`.
