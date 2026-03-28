# 02 — Tech Stack
**Dự án:** Online Music Streaming System with AI Personalization
**Phiên bản tài liệu:** 1.0
**Ngày:** 2026-03-28

---

## Tổng Quan

Hệ thống sử dụng kiến trúc **Monolith + AI Sidecar**: Node.js backend xử lý toàn bộ nghiệp vụ, Python AI Service chạy độc lập phục vụ recommendation.

---

## 1. Frontend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| **React.js** | ^18 | UI framework chính |
| **Vite** | ^5 | Build tool — khởi động nhanh, HMR tốt |
| **TailwindCSS** | ^3 | Utility-first CSS — styling nhanh, nhất quán |
| **Zustand** | ^4 | State management — nhẹ hơn Redux, đủ dùng cho quy mô dự án |
| **TanStack Query (React Query)** | ^5 | Server state management, caching API responses |
| **React Router** | ^6 | Client-side routing |
| **Howler.js** | ^2 | Audio player library — hỗ trợ streaming, crossfade, event handling |
| **Axios** | ^1 | HTTP client |

### Lý do chọn Howler.js
- Hỗ trợ HTML5 Audio + Web Audio API
- Tích hợp crossfade dễ dàng
- Xử lý các edge case streaming (buffering, error) tốt hơn Audio API thuần

---

## 2. Backend

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| **Node.js** | ^20 LTS | Runtime |
| **Express.js** | ^4 | REST API framework |
| **Prisma ORM** | ^5 | Database access — type-safe, migration tự động |
| **jsonwebtoken** | ^9 | JWT authentication |
| **bcryptjs** | ^2 | Mã hoá password |
| **Multer** | ^1 | Xử lý file upload (multipart/form-data) |
| **AWS SDK v3** | ^3 | Upload file lên S3, tạo presigned URL |
| **Bull** | ^4 | Job queue — xử lý async: gửi email, cập nhật charts |
| **Nodemailer** | ^6 | Gửi email (kết hợp với AWS SES SMTP) |
| **Stripe** | ^14 | Tích hợp thanh toán thẻ quốc tế |
| **express-validator** | ^7 | Validate input từ request |
| **helmet** | ^7 | HTTP security headers |
| **cors** | ^2 | CORS configuration |
| **morgan** | ^1 | HTTP request logging |

### Lý do chọn Prisma thay vì Sequelize
- Schema định nghĩa rõ ràng, dễ đọc (`schema.prisma`)
- Auto-generated TypeScript types
- Migration workflow gọn hơn

---

## 3. Database

| Công nghệ | Mục đích |
|-----------|---------|
| **PostgreSQL 15** | Database chính — lưu toàn bộ dữ liệu quan hệ |
| **Redis 7** | Cache (BXH charts, kết quả search) + Job queue (Bull) |

### Lý do chọn PostgreSQL
- Full-text search tích hợp sẵn (`tsvector`) — không cần Elasticsearch cho quy mô nhỏ
- Hỗ trợ JSON columns cho dữ liệu linh hoạt
- Mature, stable, phù hợp với dữ liệu có quan hệ phức tạp (user, song, playlist, donation)

---

## 4. AI / ML Service

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| **Python** | ^3.11 | Runtime cho AI service |
| **FastAPI** | ^0.110 | REST API framework — tốc độ cao, auto docs (Swagger) |
| **Uvicorn** | ^0.29 | ASGI server |
| **Pandas** | ^2 | Xử lý, transform dữ liệu |
| **NumPy** | ^1.26 | Tính toán ma trận |
| **Scikit-learn** | ^1.4 | Content-based Filtering (cosine similarity), Collaborative Filtering (SVD) |
| **SQLAlchemy** | ^2 | Kết nối PostgreSQL từ Python |
| **psycopg2-binary** | ^2 | PostgreSQL adapter cho Python |

### AI Endpoints
| Endpoint | Mô tả |
|----------|-------|
| `GET /recommend?user_id=X` | Trả về danh sách song_id gợi ý cho user (Homepage) |
| `GET /radio?song_id=X&user_id=Y` | Trả về danh sách bài tương tự cho Radio mode |

---

## 5. Infrastructure

| Công nghệ | Mục đích |
|-----------|---------|
| **AWS S3** | Lưu audio files (.mp3), lyrics files (.lrc), cover images |
| **AWS SES** | SMTP server để gửi email xác nhận, thông báo |
| **Docker** | Container hoá từng service |
| **Docker Compose** | Orchestrate toàn bộ stack trên local |

### Cấu trúc Docker Compose (local)
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

| Công nghệ | Mục đích |
|-----------|---------|
| **ESLint** + **Prettier** | Code quality & formatting (JS/TS) |
| **Jest** | Unit testing cho Node.js backend |
| **Pytest** | Unit testing cho Python AI service |
| **Postman / Thunder Client** | Test API thủ công |
| **Prisma Studio** | GUI quản lý database khi develop |

---

## 7. Tích Hợp Thanh Toán

| Cổng | SDK | Thị trường |
|------|-----|-----------|
| **Stripe** | `stripe` npm package | Thẻ quốc tế (Visa/Mastercard) |
| **VNPay** | VNPay SDK / REST API | Ví điện tử & ngân hàng Việt Nam |

> **Lưu ý:** Thanh toán chỉ phục vụ tính năng Donate/Tip cho Artist. Không có gói subscription.

---

## 8. Bảng Tóm Tắt Theo Layer

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
