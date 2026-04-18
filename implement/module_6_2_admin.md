# Module 6.2 — Admin Module

**Status:** ✅ COMPLETED (2026-04-18)

## Summary

Admin-only management endpoints and panel UI. Admins can review pending songs (approve/reject), manage user accounts (ban/unban), delete songs, and view platform statistics.

---

## Backend

### Routes — `POST /api/admin/*` (auth: admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Platform stats (users, songs, pending, artists) |
| GET | `/admin/pending-songs` | Paginated list of songs with `status=pending` |
| PATCH | `/admin/songs/:id/review` | Approve or reject a pending song |
| DELETE | `/admin/songs/:id` | Hard delete song + approval logs |
| GET | `/admin/users` | Paginated user list, filterable by `role` and `search` |
| PATCH | `/admin/users/:id/status` | Set `isActive` (ban/unban) |

### Files created

- `backend/src/modules/admin/admin.service.js`
- `backend/src/modules/admin/admin.controller.js`
- `backend/src/modules/admin/admin.routes.js`
- `backend/src/shared/utils/email.helper.js` — Added `sendSongReviewEmail`
- `backend/src/app.js` — Mounted `/api/admin`

### Key behaviors

**Song review:**
- `PATCH /admin/songs/:id/review` body: `{ action: "approved"|"rejected", reason?: string }`
- `reason` is required when action is `"rejected"`
- On approve: sets `status=published`, `publishedAt=now()`
- On reject: sets `status=rejected`, `rejectionReason=reason`
- Creates a `SongApprovalLog` record (wrapped in `$transaction`)
- Emails the artist's email (fire-and-forget)

**User management:**
- Cannot ban admin-role users (400)
- `isActive=false` effectively bans the user from the platform

**Stats:**
- Simple `count()` aggregations — no caching (admin-only, low traffic)

### Tests

`backend/tests/unit/admin.service.test.js` — 10 tests

- `getPendingSongs`: paginated results
- `reviewSong approve`: sets published, creates log
- `reviewSong reject`: sets rejected with reason
- `reviewSong reject without reason`: throws 400
- `reviewSong not pending`: throws 400
- `reviewSong not found`: throws 404
- `reviewSong invalid action`: throws 400
- `updateUserStatus ban/unban`: sets isActive
- `updateUserStatus admin`: throws 400
- `deleteSong`: runs transaction, throws 404

---

## Frontend

### Pages

- `AdminPanelPage` (`/admin`) — 3-tab UI: Pending Songs | Users | Stats

### Tabs

| Tab | Content |
|-----|---------|
| Pending Songs | Song cards with Approve button and collapsible Reject form with reason input |
| Users | Table with role, status, Ban/Unban toggle |
| Stats | 4 stat cards |

### API lib

- `frontend/src/lib/adminApi.js` — getPendingSongs, reviewSong, getUsers, updateUserStatus, adminDeleteSong, getStats

### Navigation

- Sidebar shows **Admin Panel** link for users with role `admin`

### Tests

`frontend/src/tests/admin.test.jsx` — 6 tests

- Renders admin panel with tabs
- Shows no-pending message
- Renders pending songs list
- Approve button calls reviewSong API
- Reject button shows reason input form
- Users tab renders table
- Stats tab renders stat cards
