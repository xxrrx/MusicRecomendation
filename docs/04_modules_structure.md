# 04 — Modules Structure
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.1
**Date:** 2026-04-11

---

## 1. Overview

The system consists of 3 independent projects, each with its own directory structure:

| Project | Technology | Port |
|---------|------------|------|
| `frontend/` | React + Vite | 3000 |
| `backend/` | Node.js + Express | 8080 |
| `ai_service/` | Python + FastAPI | 8000 |

---

## 2. Backend — Node.js

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                          ✅ Implemented
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validator.js
│   │   │
│   │   ├── user/                          ✅ Implemented
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.validator.js
│   │   │
│   │   ├── music/                         ✅ Implemented
│   │   │   ├── music.routes.js
│   │   │   ├── music.controller.js
│   │   │   └── music.service.js
│   │   │
│   │   ├── artist/
│   │   │   ├── artist.routes.js
│   │   │   ├── artist.controller.js
│   │   │   └── artist.service.js
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.js
│   │   │   ├── admin.controller.js
│   │   │   └── admin.service.js
│   │   │
│   │   ├── player/
│   │   │   ├── player.routes.js
│   │   │   ├── player.controller.js
│   │   │   └── player.service.js
│   │   │
│   │   ├── playlist/
│   │   │   ├── playlist.routes.js
│   │   │   ├── playlist.controller.js
│   │   │   └── playlist.service.js
│   │   │
│   │   ├── search/
│   │   │   ├── search.routes.js
│   │   │   ├── search.controller.js
│   │   │   └── search.service.js
│   │   │
│   │   ├── charts/
│   │   │   ├── charts.routes.js
│   │   │   ├── charts.controller.js
│   │   │   ├── charts.service.js
│   │   │   └── charts.job.js          ← Bull cron job
│   │   │
│   │   ├── recommendation/
│   │   │   ├── recommendation.routes.js
│   │   │   ├── recommendation.controller.js
│   │   │   └── recommendation.service.js  ← calls Python AI Service
│   │   │
│   │   ├── social/
│   │   │   ├── social.routes.js
│   │   │   ├── social.controller.js
│   │   │   └── social.service.js
│   │   │
│   │   ├── donation/
│   │   │   ├── donation.routes.js
│   │   │   ├── donation.controller.js
│   │   │   ├── donation.service.js
│   │   │   ├── vnpay.provider.js
│   │   │   └── stripe.provider.js
│   │   │
│   │   └── analytics/
│   │       ├── analytics.routes.js
│   │       ├── analytics.controller.js
│   │       └── analytics.service.js
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      ← JWT authentication (authenticate, optionalAuthenticate, authorize) ✅
│   │   │   ├── role.middleware.js      ← role-based access (user/artist/admin)
│   │   │   ├── error.middleware.js     ← global error handler ✅
│   │   │   └── upload.middleware.js    ← Multer config
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.helper.js           ← signAccessToken/Refresh, verifyAccessToken/Refresh ✅
│   │   │   ├── email.helper.js         ← sendVerificationEmail (SES in prod, console in dev) ✅
│   │   │   ├── s3.helper.js            ← upload + presigned URL
│   │   │   ├── pagination.helper.js    ← standardized pagination
│   │   │   └── response.helper.js      ← success(), paginated(), createError() ✅
│   │   │
│   │   └── config/
│   │       ├── database.js             ← Prisma client singleton ✅
│   │       ├── redis.js                ← ioredis client singleton ✅
│   │       ├── s3.js                   ← AWS S3 client
│   │       └── env.js                  ← read and validate environment variables ✅
│   │
│   └── app.js                          ← initialize Express, register routes
│
├── prisma/
│   ├── schema.prisma                   ← database schema definition
│   └── migrations/                     ← migration history
│
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.js        ✅ (password hashing, JWT, register, verify, login)
│   │   ├── user.service.test.js        ✅
│   │   └── music.service.test.js       ✅ (11 unit tests)
│   └── integration/
│       └── auth.flow.test.js           ✅ (register→verify→login→refresh→logout)
│
├── .env
├── .env.example
├── package.json
└── Dockerfile
```

### Module Responsibilities

| Module | Main API Endpoints | Responsibility |
|--------|--------------------|----------------|
| **auth** | POST /register, POST /login, POST /verify-email, POST /refresh-token | Registration, login, email verification, JWT refresh |
| **user** | GET/PUT /profile, POST /onboarding, GET /history | Profile management, preference onboarding, play history |
| **artist** | POST /songs, GET/PUT/DELETE /songs/:id, GET /dashboard | Upload music, manage songs, view statistics |
| **admin** | GET /pending-songs, PUT /songs/:id/approve, GET /users, DELETE /songs/:id | Content moderation, user management, analytics |
| **music** | GET /songs, GET /songs/:id, GET /albums, GET /artists/:id | Retrieve song, album, artist information |
| **player** | GET /stream/:songId, POST /log | Generate stream presigned URL, log play events |
| **playlist** | CRUD /playlists, POST/DELETE /playlists/:id/songs, GET/POST /liked | Manage playlists, liked songs |
| **search** | GET /search?q=&type= | Full-text search |
| **charts** | GET /charts/:type (daily/weekly/monthly) | Retrieve charts, trigger cron job |
| **recommendation** | GET /recommendations, GET /recommendations/radio | Call Python AI Service, return recommendations |
| **social** | POST/DELETE /follow/:artistId, GET /following | Follow/unfollow artists |
| **donation** | POST /donate, POST /webhook/vnpay, POST /webhook/stripe | Process donations, receive payment webhooks |
| **analytics** | GET /admin/stats, GET /artist/stats | Statistics for Admin and Artist |

---

## 3. Frontend — React

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx               ✅ login form → setAuth → redirect
│   │   ├── RegisterPage.jsx            ✅ register form → success screen với email notice
│   │   ├── VerifyEmailPage.jsx         ✅ reads ?token from URL, calls /auth/verify-email
│   │   ├── OnboardingPage.jsx          ✅ fetch genres, pick preferences, call /users/onboarding
│   │   ├── ArtistPage.jsx              ✅ hero + bio + popular songs + albums grid
│   │   ├── AlbumPage.jsx               ✅ header + song list with rank
│   │   ├── HomePage.jsx                ← placeholder (chưa implement)
│   │   ├── SearchPage.jsx              ← chưa implement
│   │   ├── ChartsPage.jsx              ← chưa implement
│   │   ├── PlaylistPage.jsx            ← chưa implement
│   │   ├── LikedSongsPage.jsx          ← chưa implement
│   │   ├── DashboardPage.jsx           ← Artist dashboard (chưa implement)
│   │   └── AdminPage.jsx               ← Admin panel (chưa implement)
│   │
│   ├── components/                     ← shared components
│   │   ├── ProtectedRoute.jsx          ✅ redirect to /login if not authenticated
│   │   ├── SongCard.jsx                ✅ song row: cover, title, artist, duration (mm:ss)
│   │   ├── ArtistCard.jsx              ✅ artist tile: avatar, name, follower count
│   │   ├── Player/
│   │   │   ├── PlayerBar.jsx           ← fixed player bar at bottom (chưa implement)
│   │   │   ├── PlayerControls.jsx      ← chưa implement
│   │   │   ├── ProgressBar.jsx         ← chưa implement
│   │   │   ├── VolumeControl.jsx       ← chưa implement
│   │   │   └── SleepTimerButton.jsx    ← chưa implement
│   │   │
│   │   ├── Lyrics/
│   │   │   └── LyricsPanel.jsx         ← synced lyrics overlay (chưa implement)
│   │   │
│   │   └── Layout/
│   │       ├── MainLayout.jsx          ← Sidebar + PlayerBar + Content (chưa implement)
│   │       ├── Sidebar.jsx             ← chưa implement
│   │       └── Navbar.jsx              ← chưa implement
│   │
│   ├── stores/                         ← Zustand global state
│   │   ├── authStore.js                ✅ accessToken, refreshToken, user, isAuthenticated (persisted)
│   │   ├── playerStore.js              ← currentSong, queue, isPlaying (chưa implement)
│   │   └── uiStore.js                  ← chưa implement
│   │
│   ├── lib/                            ← Axios instances + API helpers
│   │   ├── api.js                      ✅ axios instance: auto attach Bearer token + 401 refresh interceptor
│   │   └── musicApi.js                 ✅ fetchSong, fetchSongs, fetchAlbum, fetchArtist
│   │
│   ├── hooks/                          ← custom React hooks (chưa implement)
│   │   ├── usePlayer.js                ← control Howler.js
│   │   ├── useLyrics.js                ← parse LRC + sync with playback
│   │   └── useDebounce.js              ← used for search input
│   │
│   ├── tests/
│   │   ├── setup.js                    ✅ vitest + testing-library setup
│   │   ├── auth.test.jsx               ✅ ProtectedRoute, LoginPage, authStore (6 tests)
│   │   └── music.test.jsx              ✅ SongCard, ArtistCard, ArtistPage, AlbumPage (15 tests)
│   │
│   ├── App.jsx                         ✅ routes: /login, /register, /verify-email, /onboarding, /artists/:id, /albums/:id
│   └── main.jsx                        ✅ ReactDOM.createRoot, QueryClientProvider + BrowserRouter
│
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── .env
└── Dockerfile
```

---

## 4. AI Service — Python

```
ai_service/
├── routers/
│   ├── recommend.py        ← GET /recommend?user_id=X
│   └── radio.py            ← GET /radio?song_id=X&user_id=Y
│
├── models/
│   ├── content_based.py    ← Cosine similarity on metadata (genre, BPM, mood, key)
│   ├── collaborative.py    ← Matrix Factorization (SVD) on user-item interactions
│   └── hybrid.py           ← Combines both models: weighted score
│
├── data/
│   ├── fetcher.py          ← SQLAlchemy queries to fetch data from PostgreSQL
│   └── preprocessor.py     ← Normalize data, encode features
│
├── utils/
│   └── cache.py            ← Cache computed results to avoid recomputation per request
│
├── main.py                 ← Initialize FastAPI app, register routers
├── requirements.txt
└── Dockerfile
```

### Hybrid Model Logic

```
When user has little data (< 10 plays):
  → Use 100% Content-based (based on onboarding preferences + metadata)

When user has moderate data (10-50 plays):
  → Use 40% Content-based + 60% Collaborative

When user has extensive data (> 50 plays):
  → Use 20% Content-based + 80% Collaborative
```

---

## 5. Root Project Structure

```
MusicRecomendation/
├── frontend/               ← React app
├── backend/                ← Node.js API
├── ai_service/             ← Python AI service (scaffold)
├── docs/                   ← Project documentation
│   ├── 01_requirements_specification.md
│   ├── 02_tech_stack.md
│   ├── 03_architecture.md
│   ├── 04_modules_structure.md
│   ├── 05_database_design.md
│   ├── 06_api_contract.md
│   ├── 07_ai_service_contract.md
│   └── 08_ai_layer_design.md
├── implement/              ← Implementation notes per module
│   ├── module_0_1_docker_database_setup.md
│   ├── module_1_1_auth_backend.md
│   ├── module_1_2_user_profile_backend.md
│   ├── module_1_3_auth_frontend.md
│   ├── module_2_1_music_read_apis.md
│   └── module_2_2_music_frontend.md
├── docker-compose.yml      ← Orchestrate 5 services: frontend, backend, ai_service, postgres, redis
├── .gitignore
└── plan.md
```
