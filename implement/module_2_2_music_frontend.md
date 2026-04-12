# Module 2.2 — Music Frontend

**Phase:** 2 — Music Catalog
**Status:** ✅ Implemented
**Date:** 2026-04-11

---

## Files Created / Modified

```
frontend/src/
├── lib/
│   └── musicApi.js                  — NEW: fetchSong, fetchSongs, fetchAlbum, fetchArtist
├── components/
│   ├── SongCard.jsx                 — NEW: song row with cover, title, artist, duration
│   └── ArtistCard.jsx               — NEW: artist tile with avatar, name, follower count
├── pages/
│   ├── ArtistPage.jsx               — NEW: artist profile with songs + albums
│   └── AlbumPage.jsx                — NEW: album detail with song list
├── App.jsx                          — UPDATED: added /artists/:id and /albums/:id routes
└── tests/
    └── music.test.jsx               — NEW: 15 tests (all passing)
```

---

## Routes Added

| Path | Component | Auth |
|------|-----------|------|
| `/artists/:id` | ArtistPage | public |
| `/albums/:id` | AlbumPage | public |

---

## Components

### SongCard
- Props: `song` (required), `rank` (optional number)
- Shows: cover art (fallback icon), title, artist name, duration (mm:ss)

### ArtistCard
- Props: `artist` (required)
- Shows: avatar (fallback icon), display name, follower count
- Wraps in `<Link to="/artists/:id">`

---

## Pages

### ArtistPage (`/artists/:id`)
- Fetches via `GET /api/music/artists/:id`
- Sections: hero (avatar + stats), bio, popular songs (top 10 with rank), albums grid
- Albums link to `/albums/:id`

### AlbumPage (`/albums/:id`)
- Fetches via `GET /api/music/albums/:id`
- Sections: header (cover + metadata), song list with rank
- Artist name links back to `/artists/:id`

---

## How to Test

### Unit / component tests
```bash
cd frontend
npx vitest run src/tests/music.test.jsx
```

### Manual smoke test (requires running backend + seed data)
```bash
# Start stack
docker-compose up -d postgres redis
cd backend && npm run dev
cd ../frontend && npm run dev

# Open in browser
http://localhost:3000/artists/<artist-uuid>
http://localhost:3000/albums/<album-uuid>
```

To get valid UUIDs, query the DB or use the API:
```bash
curl http://localhost:8080/api/music/songs   # → contains artist.id and album.id
```
