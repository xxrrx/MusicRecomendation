# Module 4.2 — Social (Follow Artist)

**Phase:** 4 — Playlists & Social
**Status:** ✅ Implemented
**Date:** 2026-04-17

---

## Files Created / Modified

```
backend/src/
├── modules/social/
│   ├── social.service.js      — NEW: followArtist, unfollowArtist, isFollowing, getFollowing
│   ├── social.controller.js   — NEW: 4 thin handlers
│   └── social.routes.js       — NEW: routes with auth
├── app.js                     — UPDATED: mount /api/social
└── shared/config/__mocks__/
    └── database.js            — UPDATED: added followArtist mock

frontend/src/
├── lib/
│   └── socialApi.js           — NEW: getFollowing, checkFollowing, followArtist, unfollowArtist
├── pages/
│   └── FollowingPage.jsx      — NEW: list of followed artists
├── components/
│   └── FollowButton.jsx       — NEW: follow/unfollow toggle button
├── pages/
│   └── ArtistPage.jsx         — UPDATED: FollowButton added to hero section
├── App.jsx                    — UPDATED: added /following route
└── tests/
    └── playlist.test.jsx      — UPDATED: FollowButton + FollowingPage tests included

tests/unit/
└── social.service.test.js     — NEW: 8 backend unit tests (all passing)
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/social/following | Bearer | Paginated list of followed artists |
| GET | /api/social/follow/:artistId | Bearer | Check follow status |
| POST | /api/social/follow/:artistId | Bearer | Follow artist |
| DELETE | /api/social/follow/:artistId | Bearer | Unfollow artist |

---

## Key Design Decisions

- **409 on duplicate follow** — explicit error instead of silent upsert, so UI knows the state clearly.
- **FollowButton** — uses React Query to check status on mount; invalidates artist query on change so follower count updates.
- **ArtistPage integration** — FollowButton appears in the hero section below artist stats.
- **getFollowing** — includes full artist info (followerCount, bio) for rich display without extra round-trips.

---

## How to Test

### Backend unit tests
```bash
cd backend
npx jest tests/unit/social.service.test.js
```

### Frontend component tests
```bash
cd frontend
npx vitest run src/tests/playlist.test.jsx
```
