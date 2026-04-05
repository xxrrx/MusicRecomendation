# 02 — Tech Stack
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-03-28

---

## Overview

The system uses a **Monolith + AI Sidecar** architecture: the Node.js backend handles all business logic, while the Python AI Service runs independently to serve recommendations.

---

## 1. Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React.js** | ^18 | Main UI framework |
| **Vite** | ^5 | Build tool — fast startup, excellent HMR |
| **TailwindCSS** | ^3 | Utility-first CSS — fast, consistent styling |
| **Zustand** | ^4 | State management — lighter than Redux, sufficient for this project scale |
| **TanStack Query (React Query)** | ^5 | Server state management, API response caching |
| **React Router** | ^6 | Client-side routing |
| **Howler.js** | ^2 | Audio player library — supports streaming, crossfade, event handling |
| **Axios** | ^1 | HTTP client |

### Why Howler.js
- Supports HTML5 Audio + Web Audio API
- Easy crossfade integration
- Handles streaming edge cases (buffering, errors) better than the raw Audio API

---

## 2. Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ^20 LTS | Runtime |
| **Express.js** | ^4 | REST API framework |
| **Prisma ORM** | ^5 | Database access — type-safe, automatic migrations |
| **jsonwebtoken** | ^9 | JWT authentication |
| **bcryptjs** | ^2 | Password hashing |
| **Multer** | ^1 | File upload handling (multipart/form-data) |
| **AWS SDK v3** | ^3 | Upload files to S3, generate presigned URLs |
| **Bull** | ^4 | Job queue — async processing: send emails, update charts |
| **Nodemailer** | ^6 | Send emails (via AWS SES SMTP) |
| **Stripe** | ^14 | International card payment integration |
| **express-validator** | ^7 | Validate request input |
| **helmet** | ^7 | HTTP security headers |
| **cors** | ^2 | CORS configuration |
| **morgan** | ^1 | HTTP request logging |

### Why Prisma over Sequelize
- Schema defined clearly and readably (`schema.prisma`)
- Auto-generated TypeScript types
- Cleaner migration workflow

---

## 3. Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL 15** | Main database — stores all relational data |
| **Redis 7** | Cache (charts, search results) + Job queue (Bull) |

### Why PostgreSQL
- Built-in full-text search (`tsvector`) — no need for Elasticsearch at this scale
- Supports JSON columns for flexible data
- Mature, stable, suitable for complex relational data (users, songs, playlists, donations)

---

## 4. AI / ML Service

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | ^3.11 | AI service runtime |
| **FastAPI** | ^0.110 | REST API framework — high speed, auto docs (Swagger) |
| **Uvicorn** | ^0.29 | ASGI server |
| **Pandas** | ^2 | Data processing and transformation |
| **NumPy** | ^1.26 | Matrix computation |
| **Scikit-learn** | ^1.4 | Content-based Filtering (cosine similarity), Collaborative Filtering (SVD) |
| **SQLAlchemy** | ^2 | Connect to PostgreSQL from Python |
| **psycopg2-binary** | ^2 | PostgreSQL adapter for Python |

### AI Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /recommend?user_id=X` | Returns list of recommended song_ids for a user (Homepage) |
| `GET /radio?song_id=X&user_id=Y` | Returns list of similar songs for Radio mode |

---

## 5. Infrastructure

| Technology | Purpose |
|------------|---------|
| **AWS S3** | Store audio files (.mp3), lyrics files (.lrc), cover images |
| **AWS SES** | SMTP server for sending confirmation and notification emails |
| **Docker** | Containerize each service |
| **Docker Compose** | Orchestrate the full stack locally |

### Docker Compose Structure (local)
```yaml
services:
  frontend:    # React (Vite dev server) — port 3000
  backend:     # Node.js Express        — port 8080
  ai_service:  # Python FastAPI         — port 8000
  postgres:    # PostgreSQL 15          — port 5432
  redis:       # Redis 7                — port 6379
```

---

## 6. Dev Tools & Testing

| Technology | Purpose |
|------------|---------|
| **ESLint** + **Prettier** | Code quality & formatting (JS/TS) |
| **Jest** | Unit testing for Node.js backend |
| **Pytest** | Unit testing for Python AI service |
| **Postman / Thunder Client** | Manual API testing |
| **Prisma Studio** | Database GUI for development |

---

## 7. Payment Integration

| Gateway | SDK | Market |
|---------|-----|--------|
| **Stripe** | `stripe` npm package | International cards (Visa/Mastercard) |
| **VNPay** | VNPay SDK / REST API | Vietnamese e-wallets & banks |

> **Note:** Payments only serve the Donate/Tip feature for Artists. No subscription plans.

---

## 8. Summary by Layer

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND           React + Vite + Tailwind          │
│                     Zustand + React Query            │
│                     Howler.js (audio)                │
├─────────────────────────────────────────────────────┤
│  BACKEND            Node.js + Express                │
│                     Prisma + PostgreSQL              │
│                     Bull + Redis                     │
│                     AWS SDK + Multer                 │
│                     Stripe + VNPay                   │
├─────────────────────────────────────────────────────┤
│  AI SERVICE         Python + FastAPI                 │
│                     Scikit-learn (CF + Content-based)│
│                     Pandas + NumPy                   │
├─────────────────────────────────────────────────────┤
│  DATABASE           PostgreSQL (main)                │
│                     Redis (cache + queue)            │
├─────────────────────────────────────────────────────┤
│  CLOUD              AWS S3 (files)                   │
│                     AWS SES (email)                  │
├─────────────────────────────────────────────────────┤
│  DEVOPS             Docker + Docker Compose          │
└─────────────────────────────────────────────────────┘
```
