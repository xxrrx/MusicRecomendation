# Module 0.1 — Docker + Database Setup

**Phase:** 0 — Infrastructure
**Status:** ✅ COMPLETED
**Date:** 2026-04-11

---

## Mục tiêu

Thiết lập môi trường dev hoàn chỉnh: Docker Compose orchestrate toàn bộ stack, Prisma schema đầy đủ 14 bảng, seed data cơ bản.

---

## Các file đã tạo

### Root

| File | Mô tả |
|------|-------|
| `docker-compose.yml` | Orchestrate 5 services: frontend, backend, ai_service, postgres, redis |
| `.gitignore` | Loại trừ node_modules, .env, dist, __pycache__ |

---

### Backend (`backend/`)

| File | Mô tả |
|------|-------|
| `package.json` | Dependencies: Express, Prisma, bcryptjs, Bull, Stripe, AWS SDK v3, jsonwebtoken, Helmet, CORS, Morgan, Nodemailer, Multer, ioredis. DevDeps: Jest, Nodemon, Supertest |
| `.env` | Biến môi trường cho môi trường dev (DATABASE_URL, REDIS_URL, JWT secrets, AWS, VNPay, Stripe, AI_SERVICE_URL) |
| `.env.example` | Template mẫu để tham khảo |
| `Dockerfile` | Node 20 Alpine, `prisma migrate deploy` trước khi start |
| `prisma/schema.prisma` | Toàn bộ 14 bảng + 6 enums (xem chi tiết bên dưới) |
| `prisma/seed.js` | Seed 10 genres + 1 admin account |
| `src/app.js` | Express app: Helmet, CORS, Morgan, body parsing, `GET /health`, 404 handler, global error handler |
| `src/shared/config/env.js` | Đọc và validate tất cả environment variables, ném lỗi rõ ràng nếu thiếu |
| `src/shared/config/database.js` | Prisma Client singleton |
| `src/shared/config/redis.js` | ioredis client singleton với event log |
| `src/shared/middleware/error.middleware.js` | Global error handler: chuẩn hoá response lỗi, log 5xx, ẩn stack trace trên production |
| `src/shared/utils/response.helper.js` | Helper: `success()`, `paginated()`, `createError()` |

---

### AI Service (`ai_service/`)

| File | Mô tả |
|------|-------|
| `main.py` | FastAPI app scaffold: CORS middleware, `GET /health`, placeholder cho routers |
| `requirements.txt` | FastAPI, Uvicorn, Pandas, NumPy, Scikit-learn, SQLAlchemy, psycopg2-binary, python-dotenv |
| `.env` | DATABASE_URL trỏ tới postgres container |
| `Dockerfile` | Python 3.11 slim, uvicorn với --reload |

---

### Frontend (`frontend/`)

| File | Mô tả |
|------|-------|
| `package.json` | Dependencies: React 18, Vite 5, TailwindCSS, Zustand, TanStack Query, React Router, Howler.js, Axios |
| `vite.config.js` | Plugin React, port 3000, host true (cho Docker) |
| `tailwind.config.js` | Content glob cho src/**/*.{js,jsx} |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `index.html` | HTML entry point, lang="vi" |
| `src/main.jsx` | ReactDOM.createRoot, mount App |
| `src/App.jsx` | QueryClientProvider + BrowserRouter, route "/" placeholder |
| `src/index.css` | @tailwind base/components/utilities |
| `.env` | VITE_API_URL=http://localhost:8080/api |
| `Dockerfile` | Node 20 Alpine, npm run dev |

---

## Prisma Schema — 14 bảng / 6 enums

### Enums

| Enum | Values |
|------|--------|
| `Role` | user, artist, admin |
| `SongStatus` | pending, published, rejected |
| `BehaviorAction` | like, dislike, skip |
| `PaymentMethod` | vnpay, stripe |
| `PaymentStatus` | pending, success, failed |
| `ChartType` | daily, weekly, monthly |

### Tables

| Bảng | Mô tả |
|------|-------|
| `User` | Tài khoản người dùng (user/artist/admin), bcrypt password hash, email verification, active flag |
| `Artist` | Profile nghệ sĩ 1:1 với User, bio, total_earnings |
| `Genre` | Thể loại nhạc (name + slug unique) |
| `Album` | Album của Artist, có cover_url và year |
| `Song` | Bảng trung tâm: metadata đầy đủ (title, bpm, mood, key, year), S3 URLs cho audio/lyrics/cover, play_count, status workflow |
| `SongApprovalLog` | Lịch sử duyệt bài: admin_id, action (approved/rejected), reason |
| `Playlist` | Playlist người dùng và system playlist (is_system=true, chart_type cho charts) |
| `PlaylistSong` | Bảng quan hệ playlist ↔ song, có position để sắp xếp thứ tự |
| `LikedSong` | Bài hát yêu thích của user (explicit intent, tách riêng khỏi behaviors) |
| `PlayHistory` | Lịch sử nghe: duration_played, completion_rate (dùng cho AI) |
| `UserBehavior` | Hành vi AI: like/dislike/skip (nguồn dữ liệu chính cho Collaborative Filtering) |
| `UserPreference` | Preference theo genre với weight (0.0→1.0), khởi tạo từ Onboarding |
| `FollowArtist` | Follow/unfollow nghệ sĩ (composite PK) |
| `Donation` | Giao dịch donate: VNPay/Stripe, status workflow, transaction_id |

---

## Docker Compose Services

| Service | Image / Build | Port | Health Check |
|---------|--------------|------|-------------|
| `postgres` | postgres:15-alpine | 5432 | pg_isready mỗi 5s |
| `redis` | redis:7-alpine | 6379 | redis-cli ping mỗi 5s |
| `backend` | ./backend | 8080 | depends_on postgres + redis healthy |
| `ai_service` | ./ai_service | 8000 | depends_on postgres healthy |
| `frontend` | ./frontend | 3000 | depends_on backend |

---

## Seed Data

| Data | Chi tiết |
|------|---------|
| **10 Genres** | V-Pop, Indie, Ballad, R&B, Hip Hop, Electronic, Rock, Jazz, Classical, Folk |
| **1 Admin** | email: `admin@musicapp.vn` / password: `Admin@123456` (bcrypt hash) |

---

## Test Acceptance

| Test | Lệnh | Kết quả mong đợi |
|------|------|-----------------|
| Docker stack khởi động | `docker-compose up -d` | Tất cả 5 services healthy |
| Migrate DB | `npx prisma migrate dev --name init` | 14 bảng được tạo không lỗi |
| Seed data | `node prisma/seed.js` | 10 genres + 1 admin được insert |
| Health check | `curl http://localhost:8080/health` | `{ "success": true, "data": { "status": "ok" } }` |
| Frontend render | Mở http://localhost:3000 | Trang render không lỗi |

---

## Lệnh khởi động (dev local, không cần Docker)

```bash
# 1. Chạy Postgres + Redis qua Docker
docker-compose up -d postgres redis

# 2. Cài dependencies backend
cd backend
npm install

# 3. Generate Prisma client và migrate
npx prisma generate
npx prisma migrate dev --name init

# 4. Seed data
node prisma/seed.js

# 5. Chạy backend
npm run dev
# → http://localhost:8080/health

# 6. Cài và chạy frontend (terminal mới)
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## Phụ thuộc / Unblocks

- Module 0.1 là nền tảng cho **tất cả** các module tiếp theo
- Module 0.2 (Express scaffolding) đã được tích hợp vào `src/app.js` trong module này
- Module 1.1 (Auth Backend) có thể bắt đầu ngay: schema đã có, middleware skeleton đã có
