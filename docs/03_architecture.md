# 03 — System Architecture
**Dự án:** Online Music Streaming System with AI Personalization
**Phiên bản tài liệu:** 1.0
**Ngày:** 2026-03-28

---

## 1. Kiểu Kiến Trúc

**Monolith + AI Sidecar**

- **Monolith**: Toàn bộ nghiệp vụ (auth, music, playlist, donation, search...) nằm trong 1 Node.js backend
- **AI Sidecar**: Python AI Service chạy như 1 service độc lập, chỉ expose API recommendation — không xử lý nghiệp vụ khác

**Lý do chọn Monolith:**
- Dự án cá nhân, ~100 users — microservices là over-engineering
- Đơn giản hóa deployment (Docker Compose 1 file)
- Dễ debug, không cần service discovery hay API gateway

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                   Browser (React.js)                        │
│              http://localhost:3000                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP REST API
                           │ (JSON over HTTP)
┌──────────────────────────▼──────────────────────────────────┐
│                   NODE.JS BACKEND                           │
│                Express.js — port 8080                       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │   Auth   │ │  Music   │ │ Playlist │ │   Donation    │  │
│  │ Module   │ │  Module  │ │  Module  │ │    Module     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Search  │ │  Charts  │ │  Social  │ │  Recommend.   │──┼──┐
│  │  Module  │ │  Module  │ │  Module  │ │    Module     │  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │  │
│                                                             │  │
└──────┬───────────────────┬────────────────────────────────-─┘  │
       │                   │                                      │
       │ SQL (Prisma)       │ AWS SDK                             │ HTTP
       │                   │                                      │
┌──────▼──────┐   ┌────────▼────────┐   ┌────────────────────────▼──┐
│ PostgreSQL  │   │    AWS S3       │   │   PYTHON AI SERVICE       │
│  port 5432  │   │  (audio, img,   │   │   FastAPI — port 8000     │
│             │   │   lyrics files) │   │                           │
│  ┌────────┐ │   └─────────────────┘   │  /recommend?user_id=X    │
│  │ Redis  │ │                         │  /radio?song_id=X         │
│  │  6379  │ │   ┌─────────────────┐   │                           │
│  │(cache/ │ │   │   AWS SES       │   │  Scikit-learn models      │
│  │ queue) │ │   │  (email SMTP)   │   │  (reads from PostgreSQL)  │
│  └────────┘ │   └─────────────────┘   └───────────────────────────┘
└─────────────┘
```

---

## 3. Luồng Dữ Liệu Theo Tính Năng

### 3.1 Streaming Nhạc

```
User nhấn Play
      │
      ▼
Frontend gọi: GET /api/player/stream/:songId
      │
      ▼
Backend xác thực request → tạo Presigned URL từ S3 (URL tồn tại 1 giờ)
      │
      ▼
Backend trả về: { streamUrl: "https://s3.amazonaws.com/..." }
      │
      ▼
Frontend truyền URL cho Howler.js → bắt đầu stream từ S3 trực tiếp
      │
      ▼
Backend ghi log: POST /api/player/log (song_id, started_at)
      │
      ▼
play_count++ trong bảng songs (cập nhật async qua Bull queue)
```

> **Lý do dùng Presigned URL:** Audio không stream qua Node.js backend (tránh bottleneck băng thông). S3 phục vụ file trực tiếp cho browser.

---

### 3.2 AI Personalization — Homepage

```
User truy cập trang Home (đã đăng nhập)
      │
      ▼
Frontend gọi: GET /api/recommendations
      │
      ▼
Node.js Recommendation Module gọi nội bộ:
  → GET http://ai_service:8000/recommend?user_id=X
      │
      ▼
Python AI Service:
  1. Đọc user_behaviors + play_history từ PostgreSQL
  2. Đọc user_preferences (onboarding data)
  3. Tính toán: Hybrid (Content-based + Collaborative Filtering)
  4. Trả về: [song_id_1, song_id_2, ..., song_id_20]
      │
      ▼
Node.js fetch metadata đầy đủ của các song_id từ PostgreSQL
      │
      ▼
Trả về Frontend: danh sách bài hát với metadata đầy đủ
```

---

### 3.3 AI Personalization — Radio Mode

```
User nhấn Radio từ bài "X"
      │
      ▼
Frontend gọi: GET /api/recommendations/radio?songId=X
      │
      ▼
Node.js gọi: GET http://ai_service:8000/radio?song_id=X&user_id=Y
      │
      ▼
Python AI Service:
  1. Đọc metadata bài X (genre, BPM, mood, key)
  2. Tính cosine similarity với toàn bộ thư viện nhạc
  3. Lọc theo sở thích user (user_preferences)
  4. Loại bỏ bài đã skip gần đây (user_behaviors)
  5. Trả về: [song_id_1, ..., song_id_10]
      │
      ▼
Node.js trả về Frontend → Howler.js tự phát lần lượt
```

---

### 3.4 Upload Nhạc (Artist)

```
Artist upload file nhạc + metadata + lyrics + ảnh bìa
      │
      ▼
Frontend gửi multipart/form-data → POST /api/artist/songs
      │
      ▼
Node.js:
  1. Multer nhận file
  2. Upload lên S3: audio/ lyrics/ covers/ (3 buckets riêng biệt)
  3. Lưu metadata + S3 URLs vào PostgreSQL
  4. status = 'pending'
  5. Queue Bull job: gửi email thông báo cho Admin
      │
      ▼
Admin nhận email → vào Admin Panel → Duyệt hoặc Từ chối
      │
      ▼
[Approved]                       [Rejected]
    │                                │
    ▼                                ▼
status = 'published'          status = 'rejected'
Hiển thị công khai            Gửi email lý do cho Artist
```

---

### 3.5 Donate / Tip

```
User nhấn Donate trên trang Artist
      │
      ▼
Frontend gọi: POST /api/donations/initiate
  { artistId, amount, paymentMethod: 'vnpay' | 'stripe' }
      │
      ▼
Node.js tạo Donation record (status: 'pending')
      │
      ├── [VNPay] → Tạo payment URL → redirect user
      │
      └── [Stripe] → Tạo PaymentIntent → trả về clientSecret
                         └── Frontend dùng Stripe.js checkout
      │
      ▼
Webhook từ VNPay / Stripe → POST /api/donations/webhook
      │
      ▼
Node.js:
  - Xác minh chữ ký webhook
  - Cập nhật Donation status: 'success' | 'failed'
  - Cộng vào artist.total_earnings
```

---

### 3.6 Auto Charts (BXH)

```
Bull Cron Job chạy định kỳ:
  - Daily: mỗi ngày 00:00
  - Weekly: mỗi thứ 2 00:00
  - Monthly: ngày 1 hàng tháng
      │
      ▼
Query PostgreSQL:
  SELECT song_id, SUM(1) as plays
  FROM play_history
  WHERE played_at >= [period_start]
  GROUP BY song_id
  ORDER BY plays DESC
  LIMIT 50
      │
      ▼
Upsert vào bảng charts (type, song_id, rank, period)
      │
      ▼
Invalidate Redis cache cho charts endpoint
```

---

## 4. Bảo Mật

| Lớp | Biện pháp |
|-----|-----------|
| **Authentication** | JWT (Access Token 15 phút + Refresh Token 7 ngày) |
| **Password** | Bcrypt hash (salt rounds = 12) |
| **API** | Helmet.js (security headers), CORS whitelist |
| **File Upload** | Validate MIME type + file size limit (audio ≤ 50MB, image ≤ 5MB) |
| **S3** | Files không public trực tiếp — chỉ truy cập qua Presigned URL |
| **Webhook** | Xác minh chữ ký từ Stripe / VNPay trước khi xử lý |
| **Input** | express-validator validate toàn bộ request body |

---

## 5. Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| BXH Charts (daily/weekly/monthly) | Redis | 1 giờ |
| Kết quả tìm kiếm phổ biến | Redis | 30 phút |
| AI Recommendations per user | Redis | 15 phút |
| Metadata bài hát (public) | Redis | 1 giờ |

---

## 6. Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@postgres:5432/musicdb
REDIS_URL=redis://redis:6379
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=music-streaming-files
AWS_SES_FROM=noreply@yourdomain.com

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...

# AI Service
AI_SERVICE_URL=http://ai_service:8000

# AI Service (Python)
DATABASE_URL=postgresql://user:pass@postgres:5432/musicdb
```

---

## 7. Deployment (Local)

```bash
# Khởi chạy toàn bộ stack
docker-compose up -d

# Services:
# - Frontend:    http://localhost:3000
# - Backend API: http://localhost:8080
# - AI Service:  http://localhost:8000
# - PostgreSQL:  localhost:5432
# - Redis:       localhost:6379
```
