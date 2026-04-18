# Module 6.1 — Artist Module

**Status:** ✅ COMPLETED (2026-04-18)

## Summary

Artist-facing endpoints and dashboard page. Artists can upload songs (audio + cover to S3), manage their catalog, create albums, and view dashboard stats.

---

## Backend

### Routes — `POST /api/artist/*` (auth: artist or admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/artist/dashboard` | Dashboard stats: plays, followers, earnings, songs by status |
| GET | `/artist/songs` | List own songs (all statuses), paginated, filterable by `status` |
| GET | `/artist/songs/:id` | Get one song (403 if not owner) |
| POST | `/artist/songs` | Upload audio + optional cover via multipart/form-data |
| PATCH | `/artist/songs/:id` | Update metadata fields |
| DELETE | `/artist/songs/:id` | Delete pending/rejected song + S3 cleanup |
| GET | `/artist/albums` | List own albums |
| POST | `/artist/albums` | Create album with optional cover |

### Files created/modified

- `backend/src/modules/artist/artist.service.js` — Business logic
- `backend/src/modules/artist/artist.controller.js` — HTTP handlers
- `backend/src/modules/artist/artist.routes.js` — Multer + routes
- `backend/src/shared/utils/s3.helper.js` — Added `uploadToS3`, `deleteFromS3`
- `backend/src/shared/utils/email.helper.js` — Added `sendSongPendingEmail`
- `backend/src/app.js` — Mounted `/api/artist`

### Key behaviors

- Song upload uses `multer.memoryStorage()` (50 MB limit), uploads buffer to S3 via `PutObjectCommand`
- S3 keys: `audio/{uuid}.mp3` for audio, `covers/{uuid}.{ext}` for images
- Song is always created with `status: 'pending'` — requires admin approval to publish
- Cannot delete a published song (400)
- Admin email notification is fire-and-forget (non-blocking)
- Ownership is verified on every song operation via `artistId` comparison

### Tests

`backend/tests/unit/artist.service.test.js` — 8 tests

- `getMyDashboard`: returns stats, throws 404
- `getMySongs`: paginated list, throws 404
- `getMySongById`: ownership check (403), 404
- `createSong`: creates with pending status, throws 400 missing audio
- `updateSong`: updates fields, throws 403
- `deleteSong`: deletes pending, throws 400 for published
- `createAlbum`: creates without cover

---

## Frontend

### Pages

- `ArtistDashboardPage` (`/artist/dashboard`) — Stats cards, song list with status badges, upload form (toggle)

### API lib

- `frontend/src/lib/artistApi.js` — getDashboard, getMySongs, uploadSong, updateSong, deleteSong, getMyAlbums, createAlbum

### Navigation

- Sidebar shows **My Dashboard** link for users with role `artist` or `admin`

### Tests

`frontend/src/tests/artist.test.jsx` — 5 tests

- Renders dashboard stats
- Shows empty state
- Renders songs list with status
- Shows upload form on toggle
- Shows status counts
