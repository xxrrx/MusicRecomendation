# Module 4.1 — Playlists

**Phase:** 4 — Playlists & Social
**Status:** ✅ Implemented
**Date:** 2026-04-17

---

## Files Created / Modified

```
backend/src/
├── modules/playlist/
│   ├── playlist.service.js     — NEW: full CRUD + liked songs logic
│   ├── playlist.controller.js  — NEW: 11 thin handlers
│   └── playlist.routes.js      — NEW: routes with auth
├── app.js                      — UPDATED: mount /api/playlists
└── shared/config/__mocks__/
    └── database.js             — UPDATED: added playlist, playlistSong, likedSong mocks

frontend/src/
├── lib/
│   └── playlistApi.js          — NEW: all playlist + liked songs API calls
├── pages/
│   ├── PlaylistsPage.jsx       — NEW: list + create playlists
│   ├── PlaylistPage.jsx        — NEW: detail, edit title, remove songs
│   └── LikedSongsPage.jsx      — NEW: liked songs list
├── components/
│   └── LikeButton.jsx          — NEW: like/unlike toggle button
├── App.jsx                     — UPDATED: added /playlists, /playlists/:id, /liked routes
└── tests/
    └── playlist.test.jsx       — NEW: 17 tests (all passing)

tests/unit/
└── playlist.service.test.js    — NEW: 29 backend unit tests (all passing)
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/playlists | Bearer | List user's playlists |
| POST | /api/playlists | Bearer | Create playlist |
| GET | /api/playlists/:id | Bearer | Get playlist detail with songs |
| PATCH | /api/playlists/:id | Bearer | Update title / coverUrl |
| DELETE | /api/playlists/:id | Bearer | Delete playlist |
| POST | /api/playlists/:id/songs | Bearer | Add song to playlist |
| DELETE | /api/playlists/:id/songs/:songId | Bearer | Remove song from playlist |
| GET | /api/playlists/liked/songs | Bearer | Paginated liked songs |
| GET | /api/playlists/liked/songs/:songId | Bearer | Check if song is liked |
| POST | /api/playlists/liked/songs/:songId | Bearer | Like song |
| DELETE | /api/playlists/liked/songs/:songId | Bearer | Unlike song |

---

## Key Design Decisions

- **Ownership check** — all write operations verify `userId` matches before modifying.
- **isSystem=false filter** — system playlists (charts) are excluded from user playlist queries.
- **Position auto-increment** — `addSongToPlaylist` finds the max position and adds 1.
- **LikeButton** — standalone component using React Query; disabled when not authenticated.
- **Song already in playlist** — returns 409 CONFLICT, not silently ignored.

---

## How to Test

### Backend unit tests
```bash
cd backend
npx jest tests/unit/playlist.service.test.js
```

### Frontend component tests
```bash
cd frontend
npx vitest run src/tests/playlist.test.jsx
```
