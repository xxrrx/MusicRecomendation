# 04 — Modules Structure
**Dự án:** Online Music Streaming System with AI Personalization
**Phiên bản tài liệu:** 1.0
**Ngày:** 2026-03-28

---

## 1. Tổng Quan

Hệ thống gồm 3 project độc lập, mỗi project có cấu trúc thư mục riêng:

| Project | Công nghệ | Cổng |
|---------|-----------|------|
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
│   │   │   └── recommendation.service.js  ← gọi Python AI Service
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
│   │   │   ├── auth.middleware.js      ← xác thực JWT
│   │   │   ├── role.middleware.js      ← phân quyền (user/artist/admin)
│   │   │   ├── error.middleware.js     ← global error handler
│   │   │   └── upload.middleware.js    ← Multer config
│   │   │
│   │   ├── utils/
│   │   │   ├── s3.helper.js            ← upload + presigned URL
│   │   │   ├── email.helper.js         ← gửi email qua SES
│   │   │   ├── pagination.helper.js    ← chuẩn hóa phân trang
│   │   │   └── response.helper.js      ← chuẩn hóa response format
│   │   │
│   │   └── config/
│   │       ├── database.js             ← Prisma client
│   │       ├── redis.js                ← Redis client + Bull queue
│   │       ├── s3.js                   ← AWS S3 client
│   │       └── env.js                  ← đọc và validate biến môi trường
│   │
│   └── app.js                          ← khởi tạo Express, đăng ký routes
│
├── prisma/
│   ├── schema.prisma                   ← định nghĩa schema database
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

### Trách Nhiệm Từng Module

| Module | API Endpoints chính | Trách nhiệm |
|--------|--------------------|----|
| **auth** | POST /register, POST /login, POST /verify-email, POST /refresh-token | Đăng ký, đăng nhập, xác thực email, JWT refresh |
| **user** | GET/PUT /profile, POST /onboarding, GET /history | Quản lý hồ sơ, onboarding sở thích, lịch sử nghe |
| **artist** | POST /songs, GET/PUT/DELETE /songs/:id, GET /dashboard | Upload nhạc, quản lý bài hát, xem thống kê |
| **admin** | GET /pending-songs, PUT /songs/:id/approve, GET /users, DELETE /songs/:id | Duyệt nội dung, quản lý user, analytics |
| **music** | GET /songs, GET /songs/:id, GET /albums, GET /artists/:id | Lấy thông tin bài hát, album, nghệ sĩ |
| **player** | GET /stream/:songId, POST /log | Tạo presigned URL stream, ghi log play |
| **playlist** | CRUD /playlists, POST/DELETE /playlists/:id/songs, GET/POST /liked | Quản lý playlist, liked songs |
| **search** | GET /search?q=&type= | Tìm kiếm full-text |
| **charts** | GET /charts/:type (daily/weekly/monthly) | Lấy BXH, trigger cron job |
| **recommendation** | GET /recommendations, GET /recommendations/radio | Gọi Python AI Service, trả về gợi ý |
| **social** | POST/DELETE /follow/:artistId, GET /following | Follow/unfollow nghệ sĩ |
| **donation** | POST /donate, POST /webhook/vnpay, POST /webhook/stripe | Xử lý donate, nhận webhook thanh toán |
| **analytics** | GET /admin/stats, GET /artist/stats | Thống kê cho Admin và Artist |

---

## 3. Frontend — React

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home/
│   │   │   ├── HomePage.jsx            ← layout trang chủ
│   │   │   └── components/
│   │   │       ├── RecommendedSection.jsx   ← "Gợi ý cho bạn"
│   │   │       ├── RecentlyPlayed.jsx
│   │   │       └── FeaturedArtists.jsx
│   │   │
│   │   ├── Search/
│   │   │   ├── SearchPage.jsx
│   │   │   └── components/
│   │   │       ├── SearchBar.jsx
│   │   │       └── SearchResults.jsx    ← phân nhóm: bài/album/nghệ sĩ
│   │   │
│   │   ├── Charts/
│   │   │   └── ChartsPage.jsx           ← tab: daily / weekly / monthly
│   │   │
│   │   ├── Artist/
│   │   │   ├── ArtistPage.jsx           ← profile, danh sách bài
│   │   │   └── components/
│   │   │       └── DonateModal.jsx
│   │   │
│   │   ├── Album/
│   │   │   └── AlbumPage.jsx
│   │   │
│   │   ├── Playlist/
│   │   │   ├── PlaylistPage.jsx         ← xem playlist của user
│   │   │   └── LikedSongsPage.jsx
│   │   │
│   │   ├── Auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VerifyEmailPage.jsx
│   │   │   └── OnboardingPage.jsx       ← chọn sở thích sau đăng ký
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
│   │   │   ├── PlayerBar.jsx            ← thanh nhạc cố định ở bottom
│   │   │   ├── PlayerControls.jsx       ← play/pause/skip/shuffle/repeat
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── VolumeControl.jsx
│   │   │   └── SleepTimerButton.jsx
│   │   │
│   │   ├── Lyrics/
│   │   │   └── LyricsPanel.jsx          ← synced lyrics overlay
│   │   │
│   │   ├── SongCard/
│   │   │   └── SongCard.jsx             ← card hiển thị bài hát
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
│   │       └── ProtectedRoute.jsx       ← redirect nếu chưa đăng nhập
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
│   │   ├── usePlayer.js                 ← điều khiển Howler.js
│   │   ├── useLyrics.js                 ← parse LRC + sync theo tiến trình
│   │   └── useDebounce.js               ← dùng cho search input
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
│   ├── content_based.py    ← Cosine similarity trên metadata (genre, BPM, mood, key)
│   ├── collaborative.py    ← Matrix Factorization (SVD) trên user-item interactions
│   └── hybrid.py           ← Kết hợp 2 model: weighted score
│
├── data/
│   ├── fetcher.py          ← SQLAlchemy queries để lấy dữ liệu từ PostgreSQL
│   └── preprocessor.py     ← Chuẩn hóa dữ liệu, encode features
│
├── utils/
│   └── cache.py            ← Cache kết quả tính toán tránh tính lại mỗi request
│
├── main.py                 ← Khởi tạo FastAPI app, đăng ký routers
├── requirements.txt
└── Dockerfile
```

### Logic Hybrid Model

```
Khi user có ít dữ liệu (< 10 lần nghe):
  → Dùng 100% Content-based (dựa trên onboarding preferences + metadata)

Khi user có dữ liệu trung bình (10-50 lần nghe):
  → Dùng 40% Content-based + 60% Collaborative

Khi user có nhiều dữ liệu (> 50 lần nghe):
  → Dùng 20% Content-based + 80% Collaborative
```

---

## 5. Cấu Trúc Root Project

```
MusicRecomendation/
├── frontend/               ← React app
├── backend/                ← Node.js API
├── ai_service/             ← Python AI service
├── docs/                   ← Tài liệu dự án
│   ├── 01_requirements_specification.md
│   ├── 02_tech_stack.md
│   ├── 03_architecture.md
│   ├── 04_modules_structure.md
│   └── 05_database_design.md
├── docker-compose.yml      ← Orchestrate toàn bộ stack
└── README.md
```
