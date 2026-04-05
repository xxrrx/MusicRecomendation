# 06 — API Contract
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-04-05

> This document is the single source of truth for all HTTP endpoints between the Frontend and the Node.js Backend.
> All request/response shapes use camelCase to match Prisma-generated types.
> Base URL: `http://localhost:8080/api`

---

## Conventions

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token is missing or invalid"
  }
}
```

### Auth Headers
- **Protected routes** require: `Authorization: Bearer <accessToken>`
- Auth levels: `public` (no token), `user`, `artist`, `admin`

---

## 1. Auth Module — `POST /auth/*`

---

### POST /auth/register
**Auth:** public

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Valid email address |
| `password` | string | yes | Min 8 characters |
| `displayName` | string | yes | Display name, max 100 chars |
| `role` | string | yes | `"user"` or `"artist"` |

**Response 201:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Verification email sent"` |
| `userId` | string (UUID) | Created user ID |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `EMAIL_TAKEN` | 409 | Email already registered |
| `VALIDATION_ERROR` | 422 | Invalid fields |

---

### POST /auth/login
**Auth:** public

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | |
| `password` | string | yes | |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT, expires in 15 min |
| `refreshToken` | string | JWT, expires in 7 days |
| `user` | object | See User object below |

**User object:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `email` | string | |
| `displayName` | string | |
| `role` | string | `user` / `artist` / `admin` |
| `avatarUrl` | string \| null | |
| `isVerified` | boolean | |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_LOCKED` | 403 | Account is deactivated by admin |
| `EMAIL_NOT_VERIFIED` | 403 | Email not yet confirmed |

---

### POST /auth/logout
**Auth:** user

**Request Body:** none (token read from Authorization header)

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Logged out successfully"` |

---

### POST /auth/refresh-token
**Auth:** public

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | yes | Valid refresh token |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | New JWT access token |
| `refreshToken` | string | New refresh token (rotated) |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_TOKEN` | 401 | Refresh token invalid or expired |

---

### POST /auth/verify-email
**Auth:** public

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | yes | Token from verification email link |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Email verified successfully"` |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_TOKEN` | 400 | Token expired or invalid |

---

## 2. User Module — `GET|PATCH /users/*`

---

### GET /users/me
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `email` | string | |
| `displayName` | string | |
| `role` | string | |
| `avatarUrl` | string \| null | |
| `isVerified` | boolean | |
| `createdAt` | string | ISO 8601 datetime |

---

### PATCH /users/me
**Auth:** user

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | string | Max 100 chars |
| `avatarUrl` | string | S3 URL (upload separately via `/upload/avatar`) |
| `bio` | string | For artists only |

**Response 200:** Updated user object (same shape as GET /users/me)

---

### POST /users/onboarding
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `genreIds` | string[] | yes | Array of genre UUIDs user likes |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Preferences saved"` |

---

### GET /users/history
**Auth:** user

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Results per page (max 100) |

**Response 200:** Paginated list of play history entries

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `playedAt` | string | ISO 8601 |
| `completionRate` | number \| null | 0.0 → 1.0 |
| `song` | object | Song summary (id, title, artist, coverUrl, duration) |

---

## 3. Music Module — `GET /music/*`

---

### GET /music/songs/:id
**Auth:** public

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `title` | string | |
| `duration` | number | Seconds |
| `bpm` | number \| null | |
| `mood` | string \| null | |
| `key` | string \| null | |
| `year` | number \| null | |
| `coverUrl` | string \| null | |
| `playCount` | number | |
| `status` | string | `published` (only published songs are public) |
| `artist` | object | `{ id, displayName, avatarUrl }` |
| `album` | object \| null | `{ id, title, coverUrl }` |
| `genre` | object \| null | `{ id, name, slug }` |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `NOT_FOUND` | 404 | Song not found or not published |

---

### GET /music/songs
**Auth:** public

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | |
| `limit` | number | 20 | Max 50 |
| `genreId` | string | — | Filter by genre |
| `artistId` | string | — | Filter by artist |

**Response 200:** Paginated list of songs (same shape as single song)

---

### GET /music/albums/:id
**Auth:** public

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `title` | string | |
| `coverUrl` | string \| null | |
| `year` | number \| null | |
| `artist` | object | `{ id, displayName, avatarUrl }` |
| `songs` | array | List of songs in album (full song shape) |

---

### GET /music/artists/:id
**Auth:** public

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID (artist profile ID) |
| `displayName` | string | From users table |
| `avatarUrl` | string \| null | |
| `bio` | string \| null | |
| `totalPlayCount` | number | Sum of all song play counts |
| `followerCount` | number | |
| `songs` | array | Published songs (paginated, limit 10) |
| `albums` | array | Albums list |

---

## 4. Player Module — `GET|POST /player/*`

---

### GET /player/stream/:songId
**Auth:** user (guests get limited access — no play logging)

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `streamUrl` | string | AWS S3 presigned URL, valid for 1 hour |
| `lyricsUrl` | string \| null | AWS S3 presigned URL for .lrc file |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `NOT_FOUND` | 404 | Song not found or not published |

---

### POST /player/log
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `songId` | string | yes | UUID of the song |
| `durationPlayed` | number | yes | Seconds listened |
| `completionRate` | number | yes | 0.0 → 1.0 |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Play logged"` |

---

### POST /player/behavior
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `songId` | string | yes | UUID |
| `action` | string | yes | `"like"` / `"dislike"` / `"skip"` |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Behavior recorded"` |

---

## 5. Playlist Module — `GET|POST|PATCH|DELETE /playlists/*`

---

### GET /playlists
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `playlists` | array | List of user's personal playlists |

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `title` | string | |
| `coverUrl` | string \| null | |
| `songCount` | number | |
| `createdAt` | string | ISO 8601 |

---

### POST /playlists
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Max 255 chars |
| `coverUrl` | string | no | S3 URL |

**Response 201:** Created playlist object

---

### GET /playlists/:id
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | |
| `title` | string | |
| `coverUrl` | string \| null | |
| `isSystem` | boolean | |
| `songs` | array | Ordered list of songs with `position` |

---

### PATCH /playlists/:id
**Auth:** user (must own the playlist)

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | |
| `coverUrl` | string | |

**Response 200:** Updated playlist object

---

### DELETE /playlists/:id
**Auth:** user (must own the playlist)

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Playlist deleted"` |

---

### POST /playlists/:id/songs
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `songId` | string | yes | UUID of song to add |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song added to playlist"` |
| `position` | number | Position assigned |

---

### DELETE /playlists/:id/songs/:songId
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song removed from playlist"` |

---

### GET /playlists/liked
**Auth:** user

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | |
| `limit` | number | 20 | |

**Response 200:** Paginated list of liked songs

---

### POST /playlists/liked
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `songId` | string | yes | UUID |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song liked"` |

---

### DELETE /playlists/liked/:songId
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song unliked"` |

---

## 6. Search Module — `GET /search`

---

### GET /search
**Auth:** public

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Search query, min 1 char |
| `type` | string | no | Filter: `songs`, `artists`, `albums` (default: all) |
| `page` | number | no | Default 1 |
| `limit` | number | no | Default 10 per type |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `songs` | array | Matching songs (if type=songs or all) |
| `artists` | array | Matching artist profiles |
| `albums` | array | Matching albums |

Each songs item: id, title, artist `{ id, displayName }`, coverUrl, duration, playCount

Each artists item: id, displayName, avatarUrl, followerCount

Each albums item: id, title, coverUrl, year, artist `{ id, displayName }`

---

## 7. Charts Module — `GET /charts`

---

### GET /charts
**Auth:** public

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | yes | `daily` / `weekly` / `monthly` |
| `limit` | number | no | Default 50, max 50 |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `period` | string | |
| `generatedAt` | string | ISO 8601 — when chart was last computed |
| `songs` | array | Ranked list of songs |

Each songs item:

| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | 1-based |
| `playCount` | number | Plays in the period |
| `song` | object | Full song object |

---

## 8. Recommendation Module — `GET /recommendations/*`

---

### GET /recommendations
**Auth:** user

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max 50 |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `songs` | array | Recommended songs with full metadata |
| `source` | string | `"content_based"` / `"collaborative"` / `"hybrid"` — which model was used |

---

### GET /recommendations/radio
**Auth:** user

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `songId` | string | yes | UUID of the seed song |
| `limit` | number | no | Default 10, max 20 |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `songs` | array | Similar songs with full metadata |
| `seedSong` | object | The seed song summary |

---

## 9. Artist Module — `GET|POST|PATCH|DELETE /artist/*`

---

### POST /artist/songs
**Auth:** artist
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Max 255 chars |
| `albumId` | string | no | UUID of existing album |
| `genreId` | string | no | UUID |
| `duration` | number | yes | Duration in seconds |
| `bpm` | number | no | Beats per minute |
| `mood` | string | no | e.g. happy, sad, energetic, calm |
| `key` | string | no | e.g. C major, A minor |
| `year` | number | no | Release year |
| `audioFile` | file | yes | MP3, max 50MB |
| `lyricsFile` | file | no | .lrc file |
| `coverImage` | file | no | Image, max 5MB |

**Response 201:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of created song |
| `status` | string | `"pending"` |
| `message` | string | `"Song submitted for review"` |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_FILE_TYPE` | 422 | Wrong MIME type |
| `FILE_TOO_LARGE` | 413 | Exceeds size limit |

---

### GET /artist/songs
**Auth:** artist

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | Filter: `pending` / `published` / `rejected` |
| `page` | number | 1 | |
| `limit` | number | 20 | |

**Response 200:** Paginated list of artist's own songs (all statuses)

---

### PATCH /artist/songs/:id
**Auth:** artist (must own the song, only pending/rejected songs can be edited)

**Request Body (all optional):**

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | |
| `genreId` | string | UUID |
| `bpm` | number | |
| `mood` | string | |
| `key` | string | |
| `year` | number | |

**Response 200:** Updated song object

---

### DELETE /artist/songs/:id
**Auth:** artist (must own the song)

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song removed"` |

---

### GET /artist/dashboard
**Auth:** artist

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `totalSongs` | number | Total songs uploaded |
| `publishedSongs` | number | |
| `pendingSongs` | number | |
| `totalPlayCount` | number | Sum across all songs |
| `totalEarnings` | number | Total donations received (VND) |
| `recentDonations` | array | Last 5 donations `{ amount, currency, createdAt }` |

---

### POST /artist/albums
**Auth:** artist

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | |
| `year` | number | no | |
| `coverUrl` | string | no | S3 URL |

**Response 201:** Created album object (id, title, year, coverUrl)

---

## 10. Admin Module — `GET|PATCH|DELETE /admin/*`

---

### GET /admin/pending-songs
**Auth:** admin

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | |
| `limit` | number | 20 | |

**Response 200:** Paginated list of pending songs

Each item: full song object + `artist { id, displayName, email }`

---

### PATCH /admin/songs/:id/review
**Auth:** admin

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | yes | `"approve"` or `"reject"` |
| `reason` | string | if reject | Rejection reason sent to artist |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song approved"` or `"Song rejected"` |
| `songId` | string | UUID |
| `status` | string | `"published"` or `"rejected"` |

---

### GET /admin/users
**Auth:** admin

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `role` | string | all | Filter: `user` / `artist` / `admin` |
| `page` | number | 1 | |
| `limit` | number | 20 | |

**Response 200:** Paginated list of users (id, email, displayName, role, isActive, createdAt)

---

### PATCH /admin/users/:id/status
**Auth:** admin

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | boolean | yes | `true` = unlock, `false` = lock |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Account updated"` |

---

### DELETE /admin/songs/:id
**Auth:** admin

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Song deleted"` |

---

### GET /admin/stats
**Auth:** admin

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `totalUsers` | number | |
| `totalArtists` | number | |
| `totalSongs` | number | Published only |
| `totalPlayCount` | number | All-time |
| `topSongs` | array | Top 5 songs by play count |
| `topArtists` | array | Top 5 artists by play count |
| `pendingSongsCount` | number | Awaiting review |

---

## 11. Social Module — `POST|DELETE|GET /social/*`

---

### POST /social/follow/:artistId
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Following artist"` |

**Errors:**

| Code | HTTP | Meaning |
|------|------|---------|
| `ALREADY_FOLLOWING` | 409 | Already following this artist |
| `NOT_FOUND` | 404 | Artist not found |

---

### DELETE /social/follow/:artistId
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | `"Unfollowed artist"` |

---

### GET /social/following
**Auth:** user

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `artists` | array | List of followed artists |

Each item: id, displayName, avatarUrl, followerCount

---

## 12. Donation Module — `POST /donations/*`

---

### POST /donations/initiate
**Auth:** user

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artistId` | string | yes | UUID of recipient artist |
| `amount` | number | yes | Amount in smallest currency unit (VND or USD cents) |
| `currency` | string | yes | `"VND"` or `"USD"` |
| `paymentMethod` | string | yes | `"vnpay"` or `"stripe"` |

**Response 200 (VNPay):**

| Field | Type | Description |
|-------|------|-------------|
| `donationId` | string | UUID of created donation record |
| `paymentUrl` | string | VNPay redirect URL |

**Response 200 (Stripe):**

| Field | Type | Description |
|-------|------|-------------|
| `donationId` | string | UUID |
| `clientSecret` | string | Stripe PaymentIntent client secret for frontend |

---

### POST /donations/webhook/vnpay
**Auth:** public (verified by VNPay signature)

**Request Body:** VNPay IPN payload (see VNPay docs)

**Response 200:** `{ RspCode: "00", Message: "Confirm Success" }`

---

### POST /donations/webhook/stripe
**Auth:** public (verified by Stripe webhook signature)

**Request Body:** Stripe webhook event payload

**Response 200:** `{ received: true }`

---

### GET /donations/history
**Auth:** user

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | |
| `limit` | number | 20 | |

**Response 200:** Paginated list of user's donations

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `amount` | number | |
| `currency` | string | |
| `paymentMethod` | string | |
| `status` | string | `pending` / `success` / `failed` |
| `createdAt` | string | ISO 8601 |
| `artist` | object | `{ id, displayName, avatarUrl }` |

---

## 13. Analytics Module — `GET /analytics/*`

---

### GET /analytics/artist
**Auth:** artist

**Query Params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `7d` | `7d` / `30d` / `90d` |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `totalPlayCount` | number | Total plays in period |
| `totalEarnings` | number | Total donations in period |
| `topSongs` | array | Top 5 songs by play count (id, title, playCount) |
| `playsByDay` | array | `[{ date, plays }]` — daily breakdown |

---

## 14. File Upload — `POST /upload/*`

---

### POST /upload/avatar
**Auth:** user
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | Image, max 5MB, JPEG/PNG/WebP |

**Response 200:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | S3 URL of uploaded avatar |

---

## HTTP Status Code Reference

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict |
| 413 | Payload Too Large |
| 422 | Validation Error |
| 500 | Internal Server Error |
