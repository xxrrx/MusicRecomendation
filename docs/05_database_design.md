# 05 — Database Design
**Dự án:** Online Music Streaming System with AI Personalization
**Database:** PostgreSQL 15
**ORM:** Prisma
**Phiên bản tài liệu:** 1.0
**Ngày:** 2026-03-28

---

## 1. Tổng Quan

| Thống kê | Giá trị |
|----------|---------|
| Số bảng | 14 |
| Database chính | PostgreSQL |
| Cache / Queue | Redis (không lưu persistent data) |
| File storage | AWS S3 (URL được lưu trong DB) |

---

## 2. Sơ Đồ Quan Hệ (ERD — Dạng Text)

```
users ──────────────────── artists (1:1)
  │                            │
  ├── user_preferences          ├── songs ──────── song_approval_logs
  │   └── genres               │     │
  │                            │     ├── albums
  ├── playlists                 │     └── genres
  │   └── playlist_songs ──────┘
  │
  ├── liked_songs ──────── songs
  ├── play_history ─────── songs
  ├── user_behaviors ───── songs
  ├── follow_artists ───── artists
  └── donations ────────── artists
```

---

## 3. Chi Tiết Từng Bảng

---

### 3.1 `users` — Tài khoản người dùng

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `role` | ENUM | NOT NULL | `user` / `artist` / `admin` |
| `display_name` | VARCHAR(100) | NOT NULL | Tên hiển thị |
| `avatar_url` | TEXT | NULLABLE | S3 URL ảnh đại diện |
| `is_verified` | BOOLEAN | DEFAULT false | Email đã xác nhận chưa |
| `is_active` | BOOLEAN | DEFAULT true | Admin có thể khoá tài khoản |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

**Index:** `email` (UNIQUE), `role`

---

### 3.2 `artists` — Thông tin nghệ sĩ

> Quan hệ 1:1 với `users` (chỉ user có role = 'artist' mới có record này)

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, UNIQUE | |
| `bio` | TEXT | NULLABLE | Giới thiệu nghệ sĩ |
| `total_earnings` | DECIMAL(10,2) | DEFAULT 0 | Tổng tiền nhận từ donate |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.3 `genres` — Thể loại nhạc

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Ví dụ: V-Pop, Indie, Ballad |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | Ví dụ: v-pop, indie, ballad |

---

### 3.4 `albums` — Album

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `title` | VARCHAR(255) | NOT NULL | |
| `artist_id` | UUID | FK → artists.id | |
| `cover_url` | TEXT | NULLABLE | S3 URL ảnh bìa album |
| `year` | SMALLINT | NULLABLE | Năm phát hành |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.5 `songs` — Bài hát *(Core Table)*

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `title` | VARCHAR(255) | NOT NULL | |
| `artist_id` | UUID | FK → artists.id, NOT NULL | |
| `album_id` | UUID | FK → albums.id, NULLABLE | Bài đơn không có album |
| `genre_id` | UUID | FK → genres.id, NULLABLE | |
| `duration` | INTEGER | NOT NULL | Thời lượng (giây) |
| `bpm` | SMALLINT | NULLABLE | Nhịp bài hát (beats/phút) |
| `mood` | VARCHAR(50) | NULLABLE | Ví dụ: happy, sad, energetic, calm |
| `key` | VARCHAR(10) | NULLABLE | Ví dụ: C major, A minor |
| `year` | SMALLINT | NULLABLE | Năm phát hành |
| `file_url` | TEXT | NOT NULL | S3 URL file .mp3 |
| `lyrics_url` | TEXT | NULLABLE | S3 URL file .lrc |
| `cover_url` | TEXT | NULLABLE | S3 URL ảnh bìa bài hát |
| `play_count` | INTEGER | DEFAULT 0 | Tổng lượt nghe |
| `status` | ENUM | DEFAULT 'pending' | `pending` / `published` / `rejected` |
| `rejection_reason` | TEXT | NULLABLE | Lý do từ chối (nếu rejected) |
| `uploaded_at` | TIMESTAMP | DEFAULT NOW() | |
| `published_at` | TIMESTAMP | NULLABLE | Thời điểm được duyệt |

**Index:** `artist_id`, `genre_id`, `status`, `play_count DESC` (dùng cho charts)
**Full-text search:** tạo `tsvector` index trên (`title`, `mood`)

---

### 3.6 `song_approval_logs` — Lịch sử duyệt bài

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `song_id` | UUID | FK → songs.id | |
| `admin_id` | UUID | FK → users.id | Admin thực hiện hành động |
| `action` | ENUM | NOT NULL | `approved` / `rejected` |
| `reason` | TEXT | NULLABLE | Lý do từ chối |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.7 `playlists` — Playlist

> Dùng cho cả **playlist cá nhân** (user_id != null) và **playlist hệ thống** (user_id = null, is_system = true)

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NULLABLE | null = playlist hệ thống |
| `title` | VARCHAR(255) | NOT NULL | |
| `cover_url` | TEXT | NULLABLE | |
| `is_system` | BOOLEAN | DEFAULT false | true = BXH tự động |
| `chart_type` | ENUM | NULLABLE | `daily` / `weekly` / `monthly` — chỉ có khi is_system = true |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

---

### 3.8 `playlist_songs` — Bài hát trong playlist

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `playlist_id` | UUID | FK → playlists.id | |
| `song_id` | UUID | FK → songs.id | |
| `position` | SMALLINT | NOT NULL | Thứ tự trong playlist |
| `added_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`playlist_id`, `song_id`)

---

### 3.9 `liked_songs` — Thư viện yêu thích

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `user_id` | UUID | FK → users.id | |
| `song_id` | UUID | FK → songs.id | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`user_id`, `song_id`)

---

### 3.10 `play_history` — Lịch sử nghe

> Chỉ lưu **lịch sử nghe gần đây** (giữ lại 100 bản ghi mới nhất per user)

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NULLABLE | null = Guest |
| `song_id` | UUID | FK → songs.id | |
| `played_at` | TIMESTAMP | DEFAULT NOW() | |
| `duration_played` | INTEGER | NULLABLE | Giây đã nghe |
| `completion_rate` | FLOAT | NULLABLE | % bài đã nghe (0.0 → 1.0) |

**Index:** `user_id`, `played_at DESC`

---

### 3.11 `user_behaviors` — Hành vi người dùng (cho AI)

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | |
| `song_id` | UUID | FK → songs.id | |
| `action` | ENUM | NOT NULL | `like` / `dislike` / `skip` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**Index:** `user_id`, `song_id`, `action`

> **Ghi chú:** Bảng này là nguồn dữ liệu chính cho Python AI Service để tính toán recommendation. `skip` được ghi khi user skip bài trước 30 giây.

---

### 3.12 `user_preferences` — Sở thích âm nhạc

> Được khởi tạo từ Onboarding, cập nhật dần theo hành vi

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | |
| `genre_id` | UUID | FK → genres.id | |
| `weight` | FLOAT | DEFAULT 1.0 | Mức độ yêu thích (0.0 → 1.0) |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

**PK logic:** 1 user có nhiều genre preferences

---

### 3.13 `follow_artists` — Follow nghệ sĩ

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `user_id` | UUID | FK → users.id | |
| `artist_id` | UUID | FK → artists.id | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`user_id`, `artist_id`)

---

### 3.14 `donations` — Donate cho nghệ sĩ

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | Người donate |
| `artist_id` | UUID | FK → artists.id, NOT NULL | Người nhận |
| `amount` | DECIMAL(10,2) | NOT NULL | Số tiền |
| `currency` | VARCHAR(3) | DEFAULT 'VND' | `VND` / `USD` |
| `payment_method` | ENUM | NOT NULL | `vnpay` / `stripe` |
| `status` | ENUM | DEFAULT 'pending' | `pending` / `success` / `failed` |
| `transaction_id` | VARCHAR(255) | NULLABLE | ID từ VNPay hoặc Stripe |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `completed_at` | TIMESTAMP | NULLABLE | Thời điểm thanh toán hoàn tất |

**Index:** `user_id`, `artist_id`, `status`

---

## 4. Prisma Schema (Tham Khảo)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  user
  artist
  admin
}

enum SongStatus {
  pending
  published
  rejected
}

enum BehaviorAction {
  like
  dislike
  skip
}

enum PaymentMethod {
  vnpay
  stripe
}

enum PaymentStatus {
  pending
  success
  failed
}

enum ChartType {
  daily
  weekly
  monthly
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(user)
  displayName  String
  avatarUrl    String?
  isVerified   Boolean  @default(false)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  artist       Artist?
  playlists    Playlist[]
  likedSongs   LikedSong[]
  playHistory  PlayHistory[]
  behaviors    UserBehavior[]
  preferences  UserPreference[]
  followings   FollowArtist[]
  donations    Donation[]
}

model Artist {
  id            String   @id @default(uuid())
  userId        String   @unique
  bio           String?
  totalEarnings Decimal  @default(0) @db.Decimal(10, 2)
  createdAt     DateTime @default(now())

  user          User       @relation(fields: [userId], references: [id])
  songs         Song[]
  albums        Album[]
  followers     FollowArtist[]
  donations     Donation[]
}

model Genre {
  id          String  @id @default(uuid())
  name        String  @unique
  slug        String  @unique

  songs       Song[]
  preferences UserPreference[]
}

model Album {
  id        String   @id @default(uuid())
  title     String
  artistId  String
  coverUrl  String?
  year      Int?
  createdAt DateTime @default(now())

  artist    Artist   @relation(fields: [artistId], references: [id])
  songs     Song[]
}

model Song {
  id              String     @id @default(uuid())
  title           String
  artistId        String
  albumId         String?
  genreId         String?
  duration        Int
  bpm             Int?
  mood            String?
  key             String?
  year            Int?
  fileUrl         String
  lyricsUrl       String?
  coverUrl        String?
  playCount       Int        @default(0)
  status          SongStatus @default(pending)
  rejectionReason String?
  uploadedAt      DateTime   @default(now())
  publishedAt     DateTime?

  artist          Artist          @relation(fields: [artistId], references: [id])
  album           Album?          @relation(fields: [albumId], references: [id])
  genre           Genre?          @relation(fields: [genreId], references: [id])
  approvalLogs    SongApprovalLog[]
  playlistSongs   PlaylistSong[]
  likedBy         LikedSong[]
  playHistory     PlayHistory[]
  behaviors       UserBehavior[]
}

model SongApprovalLog {
  id        String   @id @default(uuid())
  songId    String
  adminId   String
  action    String   // 'approved' | 'rejected'
  reason    String?
  createdAt DateTime @default(now())

  song      Song     @relation(fields: [songId], references: [id])
}

model Playlist {
  id          String     @id @default(uuid())
  userId      String?
  title       String
  coverUrl    String?
  isSystem    Boolean    @default(false)
  chartType   ChartType?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  user        User?          @relation(fields: [userId], references: [id])
  songs       PlaylistSong[]
}

model PlaylistSong {
  playlistId String
  songId     String
  position   Int
  addedAt    DateTime @default(now())

  playlist   Playlist @relation(fields: [playlistId], references: [id])
  song       Song     @relation(fields: [songId], references: [id])

  @@id([playlistId, songId])
}

model LikedSong {
  userId    String
  songId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  song      Song     @relation(fields: [songId], references: [id])

  @@id([userId, songId])
}

model PlayHistory {
  id              String   @id @default(uuid())
  userId          String?
  songId          String
  playedAt        DateTime @default(now())
  durationPlayed  Int?
  completionRate  Float?

  user            User?    @relation(fields: [userId], references: [id])
  song            Song     @relation(fields: [songId], references: [id])
}

model UserBehavior {
  id        String         @id @default(uuid())
  userId    String
  songId    String
  action    BehaviorAction
  createdAt DateTime       @default(now())

  user      User           @relation(fields: [userId], references: [id])
  song      Song           @relation(fields: [songId], references: [id])
}

model UserPreference {
  id        String   @id @default(uuid())
  userId    String
  genreId   String
  weight    Float    @default(1.0)
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
  genre     Genre    @relation(fields: [genreId], references: [id])
}

model FollowArtist {
  userId    String
  artistId  String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
  artist    Artist   @relation(fields: [artistId], references: [id])

  @@id([userId, artistId])
}

model Donation {
  id            String        @id @default(uuid())
  userId        String
  artistId      String
  amount        Decimal       @db.Decimal(10, 2)
  currency      String        @default("VND")
  paymentMethod PaymentMethod
  status        PaymentStatus @default(pending)
  transactionId String?
  createdAt     DateTime      @default(now())
  completedAt   DateTime?

  user          User          @relation(fields: [userId], references: [id])
  artist        Artist        @relation(fields: [artistId], references: [id])
}
```

---

## 5. Ghi Chú Thiết Kế

| Quyết định | Lý do |
|------------|-------|
| Dùng UUID thay INT cho PK | Tránh enumerable IDs, dễ merge dữ liệu sau này |
| `play_history` không giữ toàn bộ | Chỉ lưu 100 records gần nhất per user — tránh bảng phình to |
| `user_behaviors` tách riêng khỏi `liked_songs` | liked_songs = ý định rõ ràng của user; behaviors = dữ liệu hành vi cho AI |
| `playlists.user_id` NULLABLE | Cho phép playlist hệ thống (BXH) không thuộc user nào |
| `songs.play_count` denormalized | Tránh COUNT query tốn kém mỗi lần load trang |
| Lyrics lưu trên S3 (.lrc) | File text nhỏ, S3 rẻ, tách biệt khỏi DB |
| `total_earnings` trên bảng artists | Denormalized để query nhanh — cập nhật mỗi khi donate success |
