# 04 — Modules Structure
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-03-28

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
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validator.js
│   │   │
│   │   ├── user/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   └── user.service.js
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
│   │   ├── music/
│   │   │   ├── music.routes.js
│   │   │   ├── music.controller.js
│   │   │   └── music.service.js
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
│   │   │   ├── auth.middleware.js      ← JWT authentication
│   │   │   ├── role.middleware.js      ← role-based access (user/artist/admin)
│   │   │   ├── error.middleware.js     ← global error handler
│   │   │   └── upload.middleware.js    ← Multer config
│   │   │
│   │   ├── utils/
│   │   │   ├── s3.helper.js            ← upload + presigned URL
│   │   │   ├── email.helper.js         ← send email via SES
│   │   │   ├── pagination.helper.js    ← standardized pagination
│   │   │   └── response.helper.js      ← standardized response format
│   │   │
│   │   └── config/
│   │       ├── database.js             ← Prisma client
│   │       ├── redis.js                ← Redis client + Bull queue
│   │       ├── s3.js                   ← AWS S3 client
│   │       └── env.js                  ← read and validate environment variables
│   │
│   └── app.js                          ← initialize Express, register routes
│
├── prisma/
│   ├── schema.prisma                   ← database schema definition
│   └── migrations/                     ← migration history
│
├── tests/
│   ├── auth.test.js
│   ├── music.test.js
│   └── donation.test.js
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
│   │   ├── Home/
│   │   │   ├── HomePage.jsx            ← homepage layout
│   │   │   └── components/
│   │   │       ├── RecommendedSection.jsx   ← "Recommended for you"
│   │   │       ├── RecentlyPlayed.jsx
│   │   │       └── FeaturedArtists.jsx
│   │   │
│   │   ├── Search/
│   │   │   ├── SearchPage.jsx
│   │   │   └── components/
│   │   │       ├── SearchBar.jsx
│   │   │       └── SearchResults.jsx    ← grouped: songs / albums / artists
│   │   │
│   │   ├── Charts/
│   │   │   └── ChartsPage.jsx           ← tabs: daily / weekly / monthly
│   │   │
│   │   ├── Artist/
│   │   │   ├── ArtistPage.jsx           ← profile, song list
│   │   │   └── components/
│   │   │       └── DonateModal.jsx
│   │   │
│   │   ├── Album/
│   │   │   └── AlbumPage.jsx
│   │   │
│   │   ├── Playlist/
│   │   │   ├── PlaylistPage.jsx         ← view user's playlist
│   │   │   └── LikedSongsPage.jsx
│   │   │
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   └── OnboardingPage.jsx       ← select preferences after registration
│   │   │
│   │   ├── Dashboard/                   ← Artist dashboard
│   │   │   ├── DashboardPage.jsx
│   │   │   └── components/
│   │   │       ├── UploadSongForm.jsx
│   │   │       ├── SongManageTable.jsx
│   │   │       └── StatsCards.jsx
│   │   │
│   │   └── Admin/                       ← Admin panel
│   │       ├── AdminPage.jsx
│   │       └── components/
│   │           ├── PendingSongsTable.jsx
│   │           ├── UserManageTable.jsx
│   │           └── AnalyticsDashboard.jsx
│   │
│   ├── components/                      ← shared components
│   │   ├── Player/
│   │   │   ├── PlayerBar.jsx            ← fixed player bar at bottom
│   │   │   ├── PlayerControls.jsx       ← play/pause/skip/shuffle/repeat
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── VolumeControl.jsx
│   │   │   └── SleepTimerButton.jsx
│   │   │
│   │   ├── Lyrics/
│   │   │   └── LyricsPanel.jsx          ← synced lyrics overlay
│   │   │
│   │   ├── SongCard/
│   │   │   └── SongCard.jsx             ← song display card
│   │   │
│   │   ├── ArtistCard/
│   │   │   └── ArtistCard.jsx
│   │   │
│   │   ├── Layout/
│   │   │   ├── MainLayout.jsx           ← Sidebar + PlayerBar + Content
│   │   │   ├── Sidebar.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   └── Common/
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       ├── Spinner.jsx
│   │       └── ProtectedRoute.jsx       ← redirect if not authenticated
│   │
│   ├── stores/                          ← Zustand global state
│   │   ├── playerStore.js               ← currentSong, queue, isPlaying
│   │   ├── authStore.js                 ← user, token, isAuthenticated
│   │   └── uiStore.js                   ← sidebar open, lyrics panel open
│   │
│   ├── services/                        ← Axios API call functions
│   │   ├── api.js                       ← Axios instance + interceptors
│   │   ├── auth.service.js
│   │   ├── music.service.js
│   │   ├── playlist.service.js
│   │   ├── recommendation.service.js
│   │   ├── donation.service.js
│   │   └── artist.service.js
│   │
│   ├── hooks/                           ← custom React hooks
│   │   ├── usePlayer.js                 ← control Howler.js
│   │   ├── useLyrics.js                 ← parse LRC + sync with playback
│   │   └── useDebounce.js               ← used for search input
│   │
│   ├── App.jsx
│   └── main.jsx
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
├── ai_service/             ← Python AI service
├── docs/                   ← Project documentation
│   ├── 01_requirements_specification.md
│   ├── 02_tech_stack.md
│   ├── 03_architecture.md
│   ├── 04_modules_structure.md
│   └── 05_database_design.md
├── docker-compose.yml      ← Orchestrate the full stack
└── README.md
```
