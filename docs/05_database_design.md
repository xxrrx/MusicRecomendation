# 05 — Database Design
**Project:** Online Music Streaming System with AI Personalization
**Database:** PostgreSQL 15
**ORM:** Prisma
**Document Version:** 1.0
**Date:** 2026-03-28

---

## 1. Overview

| Stat | Value |
|------|-------|
| Number of tables | 14 |
| Main database | PostgreSQL |
| Cache / Queue | Redis (no persistent data stored) |
| File storage | AWS S3 (URLs stored in DB) |

---

## 2. Entity Relationship Diagram (Text Format)

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

## 3. Table Details

---

### 3.1 `users` — User accounts

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `role` | ENUM | NOT NULL | `user` / `artist` / `admin` |
| `display_name` | VARCHAR(100) | NOT NULL | Display name |
| `avatar_url` | TEXT | NULLABLE | S3 URL of profile picture |
| `is_verified` | BOOLEAN | DEFAULT false | Whether email is confirmed |
| `is_active` | BOOLEAN | DEFAULT true | Admin can lock accounts |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

**Index:** `email` (UNIQUE), `role`

---

### 3.2 `artists` — Artist profiles

> 1:1 relationship with `users` (only users with role = 'artist' have a record here)

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, UNIQUE | |
| `bio` | TEXT | NULLABLE | Artist bio |
| `total_earnings` | DECIMAL(10,2) | DEFAULT 0 | Total donations received |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.3 `genres` — Music genres

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | e.g. V-Pop, Indie, Ballad |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | e.g. v-pop, indie, ballad |

---

### 3.4 `albums` — Albums

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `title` | VARCHAR(255) | NOT NULL | |
| `artist_id` | UUID | FK → artists.id | |
| `cover_url` | TEXT | NULLABLE | S3 URL of album cover |
| `year` | SMALLINT | NULLABLE | Release year |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.5 `songs` — Songs *(Core Table)*

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `title` | VARCHAR(255) | NOT NULL | |
| `artist_id` | UUID | FK → artists.id, NOT NULL | |
| `album_id` | UUID | FK → albums.id, NULLABLE | Singles have no album |
| `genre_id` | UUID | FK → genres.id, NULLABLE | |
| `duration` | INTEGER | NOT NULL | Duration (seconds) |
| `bpm` | SMALLINT | NULLABLE | Beats per minute |
| `mood` | VARCHAR(50) | NULLABLE | e.g. happy, sad, energetic, calm |
| `key` | VARCHAR(10) | NULLABLE | e.g. C major, A minor |
| `year` | SMALLINT | NULLABLE | Release year |
| `file_url` | TEXT | NOT NULL | S3 URL of .mp3 file |
| `lyrics_url` | TEXT | NULLABLE | S3 URL of .lrc file |
| `cover_url` | TEXT | NULLABLE | S3 URL of song cover art |
| `play_count` | INTEGER | DEFAULT 0 | Total play count |
| `status` | ENUM | DEFAULT 'pending' | `pending` / `published` / `rejected` |
| `rejection_reason` | TEXT | NULLABLE | Rejection reason (if rejected) |
| `uploaded_at` | TIMESTAMP | DEFAULT NOW() | |
| `published_at` | TIMESTAMP | NULLABLE | Timestamp of approval |

**Index:** `artist_id`, `genre_id`, `status`, `play_count DESC` (used for charts)
**Full-text search:** `tsvector` index on (`title`, `mood`)

---

### 3.6 `song_approval_logs` — Song approval history

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `song_id` | UUID | FK → songs.id | |
| `admin_id` | UUID | FK → users.id | Admin who performed the action |
| `action` | ENUM | NOT NULL | `approved` / `rejected` |
| `reason` | TEXT | NULLABLE | Rejection reason |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3.7 `playlists` — Playlists

> Used for both **personal playlists** (user_id != null) and **system playlists** (user_id = null, is_system = true)

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NULLABLE | null = system playlist |
| `title` | VARCHAR(255) | NOT NULL | |
| `cover_url` | TEXT | NULLABLE | |
| `is_system` | BOOLEAN | DEFAULT false | true = auto-generated chart |
| `chart_type` | ENUM | NULLABLE | `daily` / `weekly` / `monthly` — only set when is_system = true |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

---

### 3.8 `playlist_songs` — Songs in a playlist

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `playlist_id` | UUID | FK → playlists.id | |
| `song_id` | UUID | FK → songs.id | |
| `position` | SMALLINT | NOT NULL | Order within the playlist |
| `added_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`playlist_id`, `song_id`)

---

### 3.9 `liked_songs` — Favorites library

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `user_id` | UUID | FK → users.id | |
| `song_id` | UUID | FK → songs.id | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`user_id`, `song_id`)

---

### 3.10 `play_history` — Play history

> Only stores **recent play history** (keeps 100 most recent records per user)

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NULLABLE | null = Guest |
| `song_id` | UUID | FK → songs.id | |
| `played_at` | TIMESTAMP | DEFAULT NOW() | |
| `duration_played` | INTEGER | NULLABLE | Seconds listened |
| `completion_rate` | FLOAT | NULLABLE | Percentage listened (0.0 → 1.0) |

**Index:** `user_id`, `played_at DESC`

---

### 3.11 `user_behaviors` — User behavior data (for AI)

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | |
| `song_id` | UUID | FK → songs.id | |
| `action` | ENUM | NOT NULL | `like` / `dislike` / `skip` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**Index:** `user_id`, `song_id`, `action`

> **Note:** This table is the primary data source for the Python AI Service to compute recommendations. `skip` is recorded when a user skips a song before 30 seconds.

---

### 3.12 `user_preferences` — Music preferences

> Initialized from Onboarding, updated gradually based on behavior

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id | |
| `genre_id` | UUID | FK → genres.id | |
| `weight` | FLOAT | DEFAULT 1.0 | Preference strength (0.0 → 1.0) |
| `updated_at` | TIMESTAMP | AUTO UPDATE | |

**PK logic:** 1 user can have multiple genre preferences

---

### 3.13 `follow_artists` — Follow artists

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `user_id` | UUID | FK → users.id | |
| `artist_id` | UUID | FK → artists.id | |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

**PK:** (`user_id`, `artist_id`)

---

### 3.14 `donations` — Artist donations

| Column | Type | Constraint | Description |
|--------|------|------------|-------------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → users.id, NOT NULL | The donor |
| `artist_id` | UUID | FK → artists.id, NOT NULL | The recipient |
| `amount` | DECIMAL(10,2) | NOT NULL | Amount |
| `currency` | VARCHAR(3) | DEFAULT 'VND' | `VND` / `USD` |
| `payment_method` | ENUM | NOT NULL | `vnpay` / `stripe` |
| `status` | ENUM | DEFAULT 'pending' | `pending` / `success` / `failed` |
| `transaction_id` | VARCHAR(255) | NULLABLE | ID from VNPay or Stripe |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |
| `completed_at` | TIMESTAMP | NULLABLE | Timestamp of payment completion |

**Index:** `user_id`, `artist_id`, `status`

---

## 4. Prisma Schema (Reference)

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

## 5. Design Decisions

| Decision | Reason |
|----------|--------|
| Use UUID instead of INT for PKs | Avoids enumerable IDs, easier data merging in the future |
| `play_history` does not store all records | Only keeps 100 most recent records per user — prevents table bloat |
| `user_behaviors` separated from `liked_songs` | liked_songs = explicit user intent; behaviors = behavioral data for AI |
| `playlists.user_id` NULLABLE | Allows system playlists (charts) that belong to no user |
| `songs.play_count` denormalized | Avoids expensive COUNT queries on every page load |
| Lyrics stored on S3 (.lrc) | Small text files, S3 is cheap, keeps DB lean |
| `total_earnings` on artists table | Denormalized for fast queries — updated on each successful donation |
