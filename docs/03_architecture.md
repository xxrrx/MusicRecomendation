# 03 — System Architecture
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-03-28

---

## 1. Architecture Type

**Monolith + AI Sidecar**

- **Monolith**: All business logic (auth, music, playlist, donation, search...) lives in a single Node.js backend
- **AI Sidecar**: Python AI Service runs as an independent service, only exposes a recommendation API — does not handle other business logic

**Why Monolith:**
- Personal project, ~100 users — microservices would be over-engineering
- Simplifies deployment (single Docker Compose file)
- Easier to debug, no need for service discovery or an API gateway

---

## 2. High-Level Architecture Diagram

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

## 3. Data Flows by Feature

### 3.1 Music Streaming

```
User clicks Play
      │
      ▼
Frontend calls: GET /api/player/stream/:songId
      │
      ▼
Backend validates request → generates Presigned URL from S3 (URL valid for 1 hour)
      │
      ▼
Backend returns: { streamUrl: "https://s3.amazonaws.com/..." }
      │
      ▼
Frontend passes URL to Howler.js → begins streaming directly from S3
      │
      ▼
Backend logs play event: POST /api/player/log (song_id, started_at)
      │
      ▼
play_count++ in songs table (updated asynchronously via Bull queue)
```

> **Why Presigned URLs:** Audio does not stream through the Node.js backend (avoids bandwidth bottleneck). S3 serves the file directly to the browser.

---

### 3.2 AI Personalization — Homepage

```
User visits Home page (logged in)
      │
      ▼
Frontend calls: GET /api/recommendations
      │
      ▼
Node.js Recommendation Module calls internally:
  → GET http://ai_service:8000/recommend?user_id=X
      │
      ▼
Python AI Service:
  1. Reads user_behaviors + play_history from PostgreSQL
  2. Reads user_preferences (onboarding data)
  3. Computes: Hybrid (Content-based + Collaborative Filtering)
  4. Returns: [song_id_1, song_id_2, ..., song_id_20]
      │
      ▼
Node.js fetches full metadata for song_ids from PostgreSQL
      │
      ▼
Returns to Frontend: list of songs with full metadata
```

---

### 3.3 AI Personalization — Radio Mode

```
User clicks Radio from song "X"
      │
      ▼
Frontend calls: GET /api/recommendations/radio?songId=X
      │
      ▼
Node.js calls: GET http://ai_service:8000/radio?song_id=X&user_id=Y
      │
      ▼
Python AI Service:
  1. Reads metadata of song X (genre, BPM, mood, key)
  2. Computes cosine similarity against the entire music library
  3. Filters by user preferences (user_preferences)
  4. Excludes recently skipped songs (user_behaviors)
  5. Returns: [song_id_1, ..., song_id_10]
      │
      ▼
Node.js returns to Frontend → Howler.js plays tracks sequentially
```

---

### 3.4 Music Upload (Artist)

```
Artist uploads audio file + metadata + lyrics + cover image
      │
      ▼
Frontend sends multipart/form-data → POST /api/artist/songs
      │
      ▼
Node.js:
  1. Multer receives files
  2. Uploads to S3: audio/ lyrics/ covers/ (separate paths)
  3. Saves metadata + S3 URLs to PostgreSQL
  4. status = 'pending'
  5. Queues Bull job: sends notification email to Admin
      │
      ▼
Admin receives email → opens Admin Panel → Approves or Rejects
      │
      ▼
[Approved]                       [Rejected]
    │                                │
    ▼                                ▼
status = 'published'          status = 'rejected'
Publicly visible              Sends reason email to Artist
```

---

### 3.5 Donate / Tip

```
User clicks Donate on Artist page
      │
      ▼
Frontend calls: POST /api/donations/initiate
  { artistId, amount, paymentMethod: 'vnpay' | 'stripe' }
      │
      ▼
Node.js creates Donation record (status: 'pending')
      │
      ├── [VNPay] → Creates payment URL → redirects user
      │
      └── [Stripe] → Creates PaymentIntent → returns clientSecret
                         └── Frontend uses Stripe.js checkout
      │
      ▼
Webhook from VNPay / Stripe → POST /api/donations/webhook
      │
      ▼
Node.js:
  - Verifies webhook signature
  - Updates Donation status: 'success' | 'failed'
  - Adds to artist.total_earnings
```

---

### 3.6 Auto Charts

```
Bull Cron Job runs on schedule:
  - Daily:   every day at 00:00
  - Weekly:  every Monday at 00:00
  - Monthly: 1st of each month
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
Upsert into charts table (type, song_id, rank, period)
      │
      ▼
Invalidate Redis cache for charts endpoint
```

---

## 4. Security

| Layer | Measure |
|-------|---------|
| **Authentication** | JWT (Access Token 15 min + Refresh Token 7 days) |
| **Password** | Bcrypt hash (salt rounds = 12) |
| **API** | Helmet.js (security headers), CORS whitelist |
| **File Upload** | Validate MIME type + file size limit (audio ≤ 50MB, image ≤ 5MB) |
| **S3** | Files are not publicly accessible — only via Presigned URLs |
| **Webhook** | Verify signature from Stripe / VNPay before processing |
| **Input** | express-validator validates all request bodies |

---

## 5. Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| Charts (daily/weekly/monthly) | Redis | 1 hour |
| Popular search results | Redis | 30 minutes |
| AI Recommendations per user | Redis | 15 minutes |
| Song metadata (public) | Redis | 1 hour |

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
# Start the full stack
docker-compose up -d

# Services:
# - Frontend:    http://localhost:3000
# - Backend API: http://localhost:8080
# - AI Service:  http://localhost:8000
# - PostgreSQL:  localhost:5432
# - Redis:       localhost:6379
```
