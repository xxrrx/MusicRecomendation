# Music Recommendation Platform — Implementation Plan

## Context

A Vietnamese-market music streaming platform with AI-powered personalization. Architecture: Monolith + AI Sidecar with three main components — React Frontend, Node.js/Express Backend, Python/FastAPI AI Service. Goal: modular, independently testable, incrementally deployable.

---

## System Analysis

### Core Entities (14 tables)
- **Auth/User:** users, artists, user_preferences
- **Music:** songs, genres, albums, song_approval_logs
- **Interaction:** play_history, liked_songs, user_behaviors, follow_artists
- **Playlist:** playlists, playlist_songs
- **Payment:** donations

### Main User Flows
1. Register → Verify Email → Onboarding (select genres) → Personalized homepage
2. Artist Upload → Admin Review → Approve/Reject → Published publicly
3. Play → Log behavior → AI learns → Better recommendations over time
4. Donate → VNPay/Stripe → Webhook → Update artist earnings

---

## Directory Structure

### Backend (Node.js/Express)
```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js
│   │   ├── user/
│   │   ├── music/
│   │   ├── player/
│   │   ├── playlist/
│   │   ├── search/
│   │   ├── charts/
│   │   ├── recommendation/
│   │   ├── social/
│   │   ├── donation/
│   │   ├── artist/
│   │   └── admin/
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── upload.middleware.js
│   │   └── role.middleware.js
│   ├── shared/
│   │   ├── redis.js
│   │   ├── s3.js
│   │   ├── bull-queue.js
│   │   └── email.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.js
├── tests/
│   ├── unit/
│   └── integration/
├── docker-compose.yml
└── package.json
```

### AI Service (Python/FastAPI)
```
ai_service/
├── app/
│   ├── main.py
│   ├── routers/
│   │   ├── recommend.py
│   │   └── radio.py
│   ├── services/
│   │   ├── content_model.py
│   │   ├── collaborative_model.py
│   │   └── hybrid_engine.py
│   ├── schemas/
│   └── database.py
├── tests/
└── requirements.txt
```

### Frontend (React/Vite)
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Search/
│   │   ├── Charts/
│   │   ├── Auth/           (Login, Register, Verify, Onboarding)
│   │   ├── Artist/
│   │   ├── Album/
│   │   ├── Playlist/
│   │   ├── ArtistDashboard/
│   │   └── AdminPanel/
│   ├── components/
│   │   ├── player/         (PlayerBar, Controls, Progress, Volume, Lyrics)
│   │   ├── shared/         (SongCard, ArtistCard, Button, Modal, Spinner)
│   │   └── layout/         (Sidebar, Navbar, ProtectedRoute)
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── playerStore.js
│   │   └── uiStore.js
│   ├── services/
│   │   └── api.js          (Axios instance + all API calls)
│   └── App.jsx
└── package.json
```

---

## Implementation Phases

### PHASE 0 — Infrastructure (Week 1)
**Goal:** Working dev environment with DB schema ready.

#### Module 0.1: Docker + Database Setup ✅ COMPLETED (2026-04-11)
- `docker-compose.yml` with 5 services: frontend, backend, ai_service, postgres, redis
- Full Prisma schema (14 tables, 6 enums)
- Seed data: 10 genres, 1 admin account (`admin@musicapp.vn` / `Admin@123456`)
- **Test:** `docker-compose up` succeeds, `prisma migrate dev` runs clean
- **See:** `implement/module_0_1_docker_database_setup.md`

#### Module 0.2: Project Scaffolding ✅ COMPLETED (2026-04-11)
- Express app với Helmet, CORS, Morgan — tích hợp vào `src/app.js`
- Global error middleware, `GET /health` endpoint
- React + Vite 5 + TailwindCSS + React Router, Zustand, TanStack Query, Howler.js
- **Test:** `/health` returns `{ success: true, data: { status: "ok" } }`; frontend renders
- **See:** `implement/module_0_1_docker_database_setup.md`

---

### PHASE 1 — Auth & User (Week 2)
**Goal:** Register, login, email verification, and onboarding work end-to-end.

#### Module 1.1: Auth Backend ✅ COMPLETED (2026-04-11)
- `POST /auth/register` — bcrypt hash, create user, send verification email
- `POST /auth/verify-email` — validate token
- `POST /auth/login` — return access + refresh tokens
- `POST /auth/logout` — blacklist refresh token in Redis
- `POST /auth/refresh-token`
- JWT middleware (`authenticate`, `optionalAuthenticate`)
- Role middleware (`authorize(...roles)`)
- **Tables:** users (full 14-table Prisma schema created)
- **Unit tests:** password hashing, token generation/validation, register/verify/login flows
- **Integration test:** register → verify → login → logout full flow
- **See:** `implement/module_1_1_auth_backend.md`

#### Module 1.2: User Profile Backend ✅ COMPLETED (2026-04-11)
- `GET /users/me`, `PATCH /users/me`
- `POST /users/onboarding` — full replace genre preferences (weight 1.0 each)
- `GET /users/history` — paginated play history with nested song + artist info
- `PATCH /users/me` với `bio` chỉ update `Artist.bio` nếu `role === 'artist'`
- **Tables:** users, user_preferences, play_history
- **Unit tests:** getMe, patchMe, saveOnboarding, getHistory
- **See:** `implement/module_1_2_user_profile_backend.md`

#### Module 1.3: Auth Frontend ✅ COMPLETED (2026-04-11)
- LoginPage, RegisterPage, VerifyEmailPage, OnboardingPage
- `authStore` (Zustand, persisted): accessToken, refreshToken, user, isAuthenticated
- `ProtectedRoute` — preserves `from` location cho post-login redirect
- `lib/api.js` — axios instance: auto attach Bearer + 401 refresh interceptor
- Login redirect: `/onboarding` nếu `isOnboarded === false`, ngược lại về trang intended
- **Tests:** 6 tests — ProtectedRoute, LoginPage, authStore (setAuth/clearAuth)
- **See:** `implement/module_1_3_auth_frontend.md`

---

### PHASE 2 — Music Catalog (Week 3)
**Goal:** Music data browsable without needing real uploads.

#### Module 2.1: Music Read APIs ✅ COMPLETED (2026-04-11)
- `GET /music/songs/:id` — song detail (published only)
- `GET /music/songs` — list with filters: genreId, artistId (page/limit, capped at 50)
- `GET /music/albums/:id` — album detail with full song list
- `GET /music/artists/:id` — artist profile, top 10 songs by play_count, albums
- Redis cache 1h: `song:{id}`, `album:{id}`, `artist:{id}` — song list không cache
- **Unit tests:** 11 tests
- **See:** `implement/module_2_1_music_read_apis.md`

#### Module 2.2: Music Frontend ✅ COMPLETED (2026-04-11)
- `SongCard` — cover, title, artist name, duration (mm:ss), optional rank
- `ArtistCard` — avatar, display name, follower count, link to `/artists/:id`
- `ArtistPage` (`/artists/:id`) — hero + bio + top 10 songs + albums grid
- `AlbumPage` (`/albums/:id`) — header + ranked song list, link back to artist
- `lib/musicApi.js` — fetchSong, fetchSongs, fetchAlbum, fetchArtist
- **Tests:** 15 tests (SongCard, ArtistCard, ArtistPage, AlbumPage)
- **See:** `implement/module_2_2_music_frontend.md`

---

### PHASE 3 — Audio Player (Week 4)
**Goal:** Fully working audio playback with play event logging.

#### Module 3.1: Player Backend
- `GET /player/stream/:songId` — generate presigned S3 URL (1hr expiry)
- `POST /player/log` — save play_history (duration_played, completion_rate)
- `POST /player/behavior` — save like/dislike/skip to user_behaviors
- Bull queue: async increment play_count
- **Tables:** play_history, user_behaviors, songs (play_count)
- **Tests:** presigned URL is valid, behavior logged to correct table, play_count incremented

#### Module 3.2: Player Frontend
- Howler.js integration
- `PlayerBar`, `PlayerControls`, `ProgressBar`, `VolumeControl`
- `playerStore`: currentSong, queue, isPlaying
- Call `/player/log` on pause/end
- **Tests:** play/pause, seek, volume control, auto-next in queue

---

### PHASE 4 — Playlists & Social (Week 5)

#### Module 4.1: Playlists ✅ COMPLETED (2026-04-17)
- `GET/POST /playlists`, `PATCH/DELETE /playlists/:id`
- `POST/DELETE /playlists/:id/songs`
- `GET /playlists/liked/songs`, `POST/DELETE /playlists/liked/songs/:songId`, `GET /playlists/liked/songs/:songId`
- Frontend: PlaylistsPage, PlaylistPage, LikedSongsPage, LikeButton component
- **Tables:** playlists, playlist_songs, liked_songs
- **Tests:** 29 backend unit tests + 17 frontend component tests
- **See:** `implement/module_4_1_playlists.md`

#### Module 4.2: Social — Follow Artist ✅ COMPLETED (2026-04-17)
- `POST/DELETE /social/follow/:artistId`
- `GET /social/following`, `GET /social/follow/:artistId`
- Frontend: FollowingPage, FollowButton component, ArtistPage integrated
- **Tables:** follow_artists
- **Tests:** 8 backend unit tests + 4 frontend component tests
- **See:** `implement/module_4_2_social.md`

---

### PHASE 5 — Search & Charts (Week 6)

#### Module 5.1: Search ✅ COMPLETED (2026-04-18)
- `GET /search?q=&type=` — search across songs, artists, albums
- Prisma `contains` with `mode: 'insensitive'` (PostgreSQL ILIKE)
- Parallel queries per category; type filter short-circuits unused queries
- Redis cache 30 minutes (`search:{type}:{q}:{limit}`)
- Frontend: SearchPage with input, type filter tabs, results grid
- **Tests:** 8 backend unit tests + 6 frontend component tests
- **See:** `implement/module_5_1_search.md`

#### Module 5.2: Charts ✅ COMPLETED (2026-04-18)
- `GET /charts/daily`, `/charts/weekly`, `/charts/monthly`
- Aggregate `play_history` with `groupBy` to rank top 50 by actual listens
- Cold-start fallback to all-time `playCount` when < 10 plays in period
- Bull cron jobs: daily (midnight), weekly (Monday), monthly (1st of month)
- Upsert results into `playlists` table (`isSystem=true`)
- Redis cache 1 hour
- Frontend: ChartsPage with tab switcher, ranked song list
- **Tests:** 6 backend unit tests + 5 frontend component tests
- **See:** `implement/module_5_2_charts.md`

---

### PHASE 6 — Artist & Admin (Week 7)

#### Module 6.1: Artist Module ✅ COMPLETED (2026-04-18)
- `GET /artist/dashboard` — play stats, follower count, total earnings, songsByStatus
- `GET /artist/songs` — list artist's own songs (all statuses, paginated)
- `GET /artist/songs/:id` — get one song (must own it)
- `POST /artist/songs` — Multer memoryStorage → S3 upload (audio + cover), create pending song
- `PATCH /artist/songs/:id` — update song metadata (title, albumId, genreId, bpm, mood, key, year, lyricsUrl)
- `DELETE /artist/songs/:id` — delete pending/rejected song + S3 cleanup
- `GET /artist/albums` — list own albums
- `POST /artist/albums` — create album with optional cover
- Email notification to all admins on new song (fire-and-forget)
- **Tables:** songs, albums
- **Tests:** 8 backend unit tests (dashboard, songs CRUD, album)
- **See:** `implement/module_6_1_artist.md`

#### Module 6.2: Admin Module ✅ COMPLETED (2026-04-18)
- `GET /admin/stats` — userCount, songCount, pendingCount, artistCount
- `GET /admin/pending-songs` — paginated list of pending songs with artist info
- `PATCH /admin/songs/:id/review` — approve/reject + SongApprovalLog + email artist
- `DELETE /admin/songs/:id` — hard delete with approval log cleanup
- `GET /admin/users` — paginated user list with role/search filter
- `PATCH /admin/users/:id/status` — ban/unban (admin role protected)
- Role middleware: admin only
- **Tables:** songs, song_approval_logs, users
- **Tests:** 10 backend unit tests (review approve/reject, ban/unban, stats, delete)
- **See:** `implement/module_6_2_admin.md`

---

### PHASE 7 — AI Service (Week 8)

#### Module 7.0: Data Seeding (Prerequisites — phải làm trước)
- **Nguồn dữ liệu:** Jamendo API (CC licensed, miễn phí, không cần upload S3)
- **Mục tiêu:** 300 bài hát với đầy đủ metadata cho AI training
- **Không seed:** lyrics (bỏ qua, xử lý ở Phase 9)
- **Script:** `backend/prisma/seed-jamendo.js`
- **Dữ liệu được seed:**
  - ~30 Artists (User account + Artist profile, role = 'artist', isVerified = true)
  - ~30 Albums (cover từ Jamendo URL trực tiếp)
  - ~10 Genres (map sang genres có sẵn trong DB)
  - ~300 Songs (status = 'published', fileUrl = Jamendo MP3 URL, coverUrl = Jamendo image URL, bpm từ API, mood + key generate ngẫu nhiên)
  - ~20 Users thường (để test AI)
  - ~1500 PlayHistory records (simulate cold/warm/hot users)
  - ~800 UserBehavior records (like/dislike/skip)
  - ~20 UserPreference records (genre weights từ onboarding)
- **API cần:** Jamendo `client_id` (đăng ký miễn phí tại developer.jamendo.com)
- **Không cần:** Musixmatch, S3 upload, file audio local
- **Lưu ý về `key` field:** Generate ngẫu nhiên từ 12 keys (C, C#, D, ... B) — Jamendo không cung cấp field này
- **See:** `implement/module_7_0_data_seeding.md`

#### Module 7.1: Content-Based Model
- Load published songs từ PostgreSQL
- Feature engineering: one-hot encode genre/mood/key + normalize BPM
- NULL fields → fill bằng mean của column
- Cosine similarity matrix
- `GET /radio?song_id=X` — return top N similar songs
- **Tests:** similarity scores are reasonable, response matches expected schema

#### Module 7.2: Collaborative Filtering (SVD)
- Build user-item interaction matrix từ user_behaviors + play_history
- TruncatedSVD với 50 components
- Interaction scores: like=+2, dislike=−2, skip=−1, partial plays=+0.5 to +1.5
- Hybrid engine với cold-start logic:
  - <10 plays → 100% content-based
  - 10–50 plays → 40% content + 60% collaborative
  - \>50 plays → 20% content + 80% collaborative
- `GET /recommend?user_id=X`
- **Tests:** cold-start uses content-only, warm users use hybrid correctly

#### Module 7.3: Recommendation Backend Integration
- `GET /recommendations` — call AI `/recommend`, enrich với song metadata
- `GET /recommendations/radio` — call AI `/radio`, enrich với metadata
- Fallback to top charts nếu AI service unavailable
- Redis cache 15 minutes, invalidated on new behavior event
- **Tests:** fallback works when AI is down, cache invalidation triggers correctly

---

### PHASE 8 — Donation (Week 9) ✅ COMPLETED (2026-04-24)

#### Module 8.1: Donation
- `POST /donations/initiate` — create Stripe PaymentIntent (clientSecret) hoặc VNPay redirect URL
- `POST /donations/confirm` — verify Stripe PaymentIntent sau khi frontend confirm
- `GET /donations/vnpay-return` — VNPay redirect về, verify HMAC-SHA512 & cập nhật DB
- `GET /donations/history` — lịch sử donate của user
- Update `artists.totalEarnings` on successful payment (prisma transaction)
- **Tables:** donations, artists
- **Frontend:** DonatePage, DonationResultPage, nút Donate trên ArtistPage
- **Dependencies:** stripe (backend), @stripe/react-stripe-js + @stripe/stripe-js (frontend)

---

### PHASE 9 — Polish & Integration (Week 10)

- Synced lyrics panel (`.lrc` files from S3)
- Sleep timer feature
- Full end-to-end testing (Playwright)
- Performance: Redis cache audit, PostgreSQL index review
- Security: rate limiting, input validation hardening, CORS review
- Docker production build

---

## Dependency Graph

```
Phase 0: Infrastructure        (no dependencies)
Phase 1: Auth & User           (depends on: Phase 0)
Phase 2: Music Catalog         (depends on: Phase 1)
Phase 3: Audio Player          (depends on: Phase 2 + S3)
Phase 4: Playlists & Social    (depends on: Phase 1, 3)
Phase 5: Search & Charts       (depends on: Phase 2)
Phase 6: Artist & Admin        (depends on: Phase 2, 3)
Phase 7: AI Service            (depends on: Phase 3, 6)
Phase 8: Donation              (depends on: Phase 1)
Phase 9: Integration           (depends on: all phases)
```

---

## Test Strategy

| Phase | Unit Tests | Integration Tests | Manual Tests |
|-------|------------|-------------------|--------------|
| 0 | — | DB migrate, health check | `docker-compose up` |
| 1 | JWT, bcrypt, email template | Register → Verify → Login | Login UI flow |
| 2 | Cache key, query builder | GET songs with filters | Browse catalog |
| 3 | Presigned URL, play_count job | Stream → Log → DB | Listen to real audio |
| 4 | Playlist CRUD logic | Like → appears in liked list | Playlist UI |
| 5 | Search tokenizer, cron schedule | Search results, chart generation | Search UI |
| 6 | Upload validation, role guard | Upload → pending → approve | Artist upload UI |
| 7 | Similarity scores, hybrid weights | `/recommend` endpoint | Homepage recommendations |
| 8 | Webhook signature | VNPay/Stripe sandbox flow | Donate UI flow |
| 9 | — | Full E2E (Playwright) | Full demo |

---

## Critical Files to Create

### Phase 0–1 (Foundation)
- `backend/prisma/schema.prisma` — all 14 tables
- `backend/src/app.js` — Express app setup
- `backend/src/modules/auth/` — controller, service, routes, validation
- `backend/src/middlewares/auth.middleware.js`
- `docker-compose.yml`
- `frontend/src/stores/authStore.js`
- `frontend/src/pages/Auth/`

### Shared Utilities (reused across all modules)
- `backend/src/shared/redis.js` — Redis client singleton
- `backend/src/shared/s3.js` — presign + upload helpers
- `backend/src/shared/bull-queue.js` — queue definitions
- `backend/src/shared/email.js` — Nodemailer + email templates
- `backend/src/middlewares/error.middleware.js`
- `frontend/src/services/api.js` — Axios instance with request/response interceptors
