# Module 7.0 — Data Seeding (Jamendo API)
**Phase:** 7 — AI Service Prerequisites
**Date:** 2026-04-23

> Seed 300 bài hát thực từ Jamendo API vào database để có đủ dữ liệu train AI model ở Phase 7.
> Không cần upload file audio lên S3 — dùng trực tiếp URL từ Jamendo.
> Không seed lyrics — xử lý ở Phase 9.

---

## 1. Tại sao cần seed trước Phase 7

AI Service ở Phase 7 cần:
- **Content-based model:** songs với `genre`, `bpm`, `mood`, `key` — để tính cosine similarity
- **Collaborative model:** `play_history` + `user_behaviors` — để train SVD matrix
- **Cold-start test:** users với <10 plays
- **Warm-user test:** users với 10–50 plays
- **Hot-user test:** users với >50 plays

Không có dữ liệu thực → không thể test AI hoạt động đúng.

---

## 2. Nguồn dữ liệu — Jamendo API

**Website:** developer.jamendo.com
**License:** Creative Commons — được phép dùng trong app
**API key:** `client_id` (miễn phí, đăng ký ~5 phút)

### Jamendo cung cấp gì

| Field trong DB | Jamendo field | Ghi chú |
|---|---|---|
| `Song.title` | `name` | |
| `Song.duration` | `duration` | seconds (Int) |
| `Song.bpm` | `musicinfo.bpm` | Có sẵn |
| `Song.fileUrl` | `audiodownload` | Direct MP3 URL, không cần S3 |
| `Song.coverUrl` | `album.image` | Direct image URL |
| `Song.mood` | `musicinfo.tags.vartags` | Lấy tag đầu tiên |
| `Song.key` | ❌ Không có | Generate ngẫu nhiên |
| `Song.lyricsUrl` | ❌ Bỏ qua | Xử lý ở Phase 9 |
| `Artist` (User + Artist) | `artist.name` | Tạo user account giả |
| `Album.title` | `album.name` | |
| `Album.coverUrl` | `album.image` | |
| `Album.year` | `album.releasedate` | Parse year từ date string |
| `Genre` | `musicinfo.tags.genres` | Map sang genres table |

### Endpoint sử dụng

```
GET https://api.jamendo.com/v3.0/tracks/
  ?client_id=YOUR_CLIENT_ID
  &format=json
  &limit=200          # max per request
  &offset=0
  &audioformat=mp32   # MP3 320kbps URL
  &include=musicinfo+artist+album
  &order=popularity_total
```

Gọi 2 lần (offset=0 và offset=200) → tổng 400 tracks → lấy 300 tracks đầu.

---

## 3. Dữ liệu được seed

### 3.1 Genres (map từ Jamendo tags)

Jamendo genres được map sang genres có sẵn trong DB:

| Jamendo genre | Tên trong DB |
|---|---|
| pop | Pop |
| rock | Rock |
| electronic / electronica | Electronic |
| jazz | Jazz |
| classical | Classical |
| hiphop / hip-hop | Hip-Hop |
| folk | Folk |
| ambient | Ambient |
| Không match | để `genreId = null` |

### 3.2 Artists (~30 artists)

Mỗi artist Jamendo → tạo 1 bản ghi:
- `User`: email = `{slug}@jamendo.seed`, passwordHash = bcrypt("Seed@123456"), role = `artist`, isVerified = true, isActive = true
- `Artist`: bio = tên artist, totalEarnings = 0

### 3.3 Albums (~50 albums)

Mỗi album Jamendo → 1 bản ghi `Album` với coverUrl từ Jamendo.

### 3.4 Songs (300 bài)

| Field | Giá trị |
|---|---|
| `status` | `published` |
| `publishedAt` | Random trong 2 năm gần đây |
| `fileUrl` | Jamendo MP3 URL trực tiếp |
| `coverUrl` | Jamendo image URL trực tiếp |
| `bpm` | Từ Jamendo API (null nếu không có) |
| `mood` | Từ Jamendo vartags (null nếu không có) |
| `key` | Random từ: `C, C#, D, D#, E, F, F#, G, G#, A, A#, B` |
| `lyricsUrl` | null |
| `playCount` | Tính từ play_history được seed |

### 3.5 Users (~20 users thường)

Tạo 20 user accounts để simulate hành vi:

| Nhóm | Số lượng | Tổng plays | Mục đích test AI |
|---|---|---|---|
| Cold users | 5 users | < 10 plays mỗi người | Test cold-start (100% content-based) |
| Warm users | 10 users | 10–50 plays mỗi người | Test hybrid (40/60) |
| Hot users | 5 users | > 50 plays mỗi người | Test hybrid (20/80) |

### 3.6 PlayHistory (~1500 records)

- Cold users: 3–9 records mỗi người
- Warm users: 10–50 records mỗi người
- Hot users: 51–100 records mỗi người
- `durationPlayed` và `completionRate` random (0.1 → 1.0)
- `playedAt` random trong 90 ngày gần đây

### 3.7 UserBehaviors (~800 records)

- Mix like / dislike / skip theo tỷ lệ: 50% like, 20% dislike, 30% skip
- Chỉ tạo cho songs mà user đã play

### 3.8 UserPreferences (~20 records)

- Mỗi user có 2–4 genre preferences
- weight = 1.0 (mặc định từ onboarding)

---

## 4. Script

**File:** `backend/prisma/seed-jamendo.js`

### Cách chạy

```bash
# Cài dependencies nếu chưa có
npm install axios bcryptjs

# Đặt client_id vào .env hoặc truyền trực tiếp
JAMENDO_CLIENT_ID=your_client_id node prisma/seed-jamendo.js
```

### Thứ tự thực thi

```
1. Fetch 300 tracks từ Jamendo API (2 requests)
2. Upsert Genres (chỉ genres có trong DB, không tạo mới)
3. Tạo Users + Artists (1 user/artist per unique Jamendo artist)
4. Tạo Albums
5. Tạo Songs (status=published)
6. Tạo 20 seed Users (thường)
7. Tạo UserPreferences cho seed users
8. Tạo PlayHistory
9. Tạo UserBehaviors
10. Update Song.playCount từ play_history count
```

---

## 5. Lưu ý quan trọng

### Về fileUrl và coverUrl

Jamendo URL có thể hết hạn hoặc rate-limit. Đây là môi trường **dev/demo**, không phải production. Nếu cần production thì download và upload lên S3 của bạn.

### Về `key` field

Jamendo không cung cấp musical key. Field này được generate ngẫu nhiên. Điều này ổn vì:
- Phase 7 AI model vẫn hoạt động với random key (feature có trong vector)
- Key thực tế có thể được phân tích bằng audio analysis tools (librosa) sau này

### Về lyrics

`lyricsUrl = null` cho toàn bộ seeded songs. Xử lý ở Phase 9 với synced lyrics panel.

### Chạy lại script

Script dùng `upsert` cho Genres và Artists (dựa trên email/slug unique). Songs được tạo mới mỗi lần chạy — nên chỉ chạy 1 lần hoặc xóa data trước khi chạy lại.

---

## 6. Kiểm tra sau khi seed

```sql
-- Kiểm tra số lượng
SELECT COUNT(*) FROM "Song" WHERE status = 'published';    -- ~300
SELECT COUNT(*) FROM "Artist";                              -- ~30
SELECT COUNT(*) FROM "PlayHistory";                         -- ~1500
SELECT COUNT(*) FROM "UserBehavior";                        -- ~800

-- Kiểm tra cold/warm/hot users
SELECT u."displayName", COUNT(ph.id) as plays
FROM "User" u
LEFT JOIN "PlayHistory" ph ON ph."userId" = u.id
WHERE u.role = 'user'
GROUP BY u.id, u."displayName"
ORDER BY plays;

-- Kiểm tra songs có đủ features cho AI
SELECT
  COUNT(*) FILTER (WHERE bpm IS NOT NULL) as has_bpm,
  COUNT(*) FILTER (WHERE mood IS NOT NULL) as has_mood,
  COUNT(*) FILTER (WHERE key IS NOT NULL) as has_key,
  COUNT(*) FILTER (WHERE "genreId" IS NOT NULL) as has_genre
FROM "Song" WHERE status = 'published';
```
