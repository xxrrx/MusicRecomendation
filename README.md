# Music Recommendation — Online Music Streaming System

An online music streaming platform with AI-powered personalization. Artists upload and manage their music; admins moderate content before publishing; users discover, listen, and receive personalized recommendations.

**Market:** Vietnam | **Scale:** ~100 concurrent users | **Deployment:** Local (Docker Compose)

---

## Architecture

```
┌─────────────────────┐
│  Browser (React)    │  :3000
└────────┬────────────┘
         │ REST API (JSON/HTTP)
┌────────▼────────────┐       ┌──────────────────────┐
│  Node.js Backend    │──────▶│  Python AI Service   │
│  Express  :8080     │  HTTP │  FastAPI  :8000       │
└────┬──────┬─────────┘       └──────────────────────┘
     │      │
     │ SQL  │ AWS SDK
     │      │
┌────▼──┐ ┌─▼──────┐ ┌───────────┐
│  PG   │ │  S3    │ │  SES      │
│ :5432 │ │(files) │ │  (email)  │
│       │ └────────┘ └───────────┘
│ Redis │
│ :6379 │
└───────┘
```

**Pattern:** Monolith + AI Sidecar
- All business logic in one Node.js service
- Python AI Service runs independently, only exposes `/recommend` and `/radio` endpoints

---

## Services & Ports

| Service | Technology | Port |
|---------|------------|------|
| Frontend | React 18 + Vite | 3000 |
| Backend API | Node.js 20 + Express | 8080 |
| AI Service | Python 3.11 + FastAPI | 8000 |
| PostgreSQL | v15 | 5432 |
| Redis | v7 | 6379 |

---

## Quick Start

```bash
# 1. Copy environment file and fill in values
cp backend/.env.example backend/.env

# 2. Start all services
docker-compose up -d

# 3. Run database migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# AI Service docs: http://localhost:8000/docs
```

---

## Tech Stack Summary

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, Vite, TailwindCSS, Zustand, TanStack Query, Howler.js |
| **Backend** | Node.js 20, Express, Prisma ORM, Bull, JWT, Multer |
| **AI Service** | Python 3.11, FastAPI, Scikit-learn (SVD + cosine similarity), Pandas |
| **Database** | PostgreSQL 15 (main), Redis 7 (cache + queue) |
| **Storage** | AWS S3 (audio, lyrics, images) |
| **Email** | AWS SES |
| **Payments** | Stripe (international), VNPay (Vietnam) |

---

## Documentation

| File | Description |
|------|-------------|
| [01_requirements_specification.md](docs/01_requirements_specification.md) | Functional & non-functional requirements, user roles, business flows |
| [02_tech_stack.md](docs/02_tech_stack.md) | Technology choices with rationale for each layer |
| [03_architecture.md](docs/03_architecture.md) | System diagram, data flows per feature, security, caching, env vars |
| [04_modules_structure.md](docs/04_modules_structure.md) | Directory structure for all 3 codebases, module responsibilities |
| [05_database_design.md](docs/05_database_design.md) | ERD, 14-table schema, full Prisma schema, design decisions |
| [06_api_contract.md](docs/06_api_contract.md) | Full REST API contract — all endpoints, request/response shapes, error codes |
| [07_ai_service_contract.md](docs/07_ai_service_contract.md) | Internal AI Service API contract (Backend ↔ Python) |
| [08_ai_layer_design.md](docs/08_ai_layer_design.md) | ML models design: SVD, cosine similarity, hybrid weights, training schedule |

---

## Key Features

- **Streaming** — 128kbps MP3 via AWS S3 presigned URLs (no bandwidth bottleneck)
- **AI Recommendations** — Hybrid: content-based (cosine similarity) + collaborative filtering (SVD)
- **Radio Mode** — Auto-queue similar songs based on current track metadata + user preferences
- **Artist Dashboard** — Upload songs, manage content, view stats, receive donations
- **Admin Panel** — Content moderation (approve/reject), user management, analytics
- **Payments** — VNPay (Vietnamese market) + Stripe (international) for artist tips/donations
- **Synced Lyrics** — LRC format with real-time line highlighting

---

## User Roles

| Role | Access |
|------|--------|
| **Guest** | Listen to public music, view artist/song pages |
| **User** | Full access: playlists, liked songs, AI recommendations, follow artists, donate |
| **Artist** | Upload music, manage songs, view statistics, receive donations |
| **Admin** | Approve/reject songs, manage users, view system analytics |
