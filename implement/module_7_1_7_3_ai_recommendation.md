# Module 7.1–7.3 — AI Recommendation Service

**Status:** ✅ COMPLETED (2026-04-24)

---

## Tổng quan

AI Service chạy độc lập (Python/FastAPI), backend Node.js gọi qua HTTP. Hai chức năng chính:
- **Recommend** (`/recommend?user_id=X`): hybrid content + collaborative filtering
- **Radio** (`/radio?song_id=X`): content-based similar songs

---

## Files đã tạo

### AI Service

| File | Mô tả |
|------|-------|
| `ai_service/main.py` | FastAPI app, warmup models lúc startup |
| `ai_service/app/database.py` | SQLAlchemy engine, hàm `fetch_all()` |
| `ai_service/app/services/content_model.py` | Module 7.1 — cosine similarity |
| `ai_service/app/services/collaborative_model.py` | Module 7.2 — TruncatedSVD |
| `ai_service/app/services/hybrid_engine.py` | Module 7.2 — hybrid blending logic |
| `ai_service/app/routers/recommend.py` | Router `/recommend` |
| `ai_service/app/routers/radio.py` | Router `/radio` |

### Backend Node.js

| File | Mô tả |
|------|-------|
| `backend/src/modules/recommendation/recommendation.service.js` | Module 7.3 — gọi AI, enrich, cache, fallback |
| `backend/src/modules/recommendation/recommendation.controller.js` | Handler cho 2 routes |
| `backend/src/modules/recommendation/recommendation.routes.js` | Mount routes |

### Cấu hình cập nhật

| File | Thay đổi |
|------|---------|
| `backend/src/app.js` | Thêm `app.use('/api/recommendations', ...)` |
| `docker-compose.yml` | Backend thêm `AI_SERVICE_URL=http://ai_service:8000`, depends on `ai_service` |
| `ai_service/requirements.txt` | Thêm `httpx==0.27.0` |

---

## Kiến trúc

```
Frontend
   │
   ▼
Backend (Node.js :8080)
  GET /api/recommendations          → authenticate → gọi AI /recommend
  GET /api/recommendations/radio/:songId → gọi AI /radio
   │
   ├── Redis cache 15 phút
   ├── Enrich song metadata từ PostgreSQL
   └── Fallback → top charts nếu AI down
   │
   ▼
AI Service (Python :8000)
  GET /recommend?user_id=X
  GET /radio?song_id=X
   │
   └── Đọc trực tiếp từ PostgreSQL
```

---

## Logic AI

### Content-Based Model (Module 7.1)

**Input:** Bảng `Song` — id, genreId, bpm, mood, key, duration

**Feature engineering:**
- One-hot encode: `genreId`, `mood`, `key`
- Normalize (MinMaxScaler): `bpm`, `duration`
- NULL → fill bằng mean của column

**Output:** Cosine similarity matrix (n_songs × n_songs)

**Dùng cho:**
- `GET /radio` — trả top 20 bài tương tự
- Cold-start users (< 10 plays)

### Collaborative Model (Module 7.2 — SVD)

**Input:**
- `PlayHistory`: `completionRate * 2` → score (0..2)
- `UserBehavior`: like=+2, dislike=−2, skip=−1

**Process:**
1. Aggregate scores theo (userId, songId)
2. Build user-item matrix
3. TruncatedSVD 50 components
4. Predict: `user_factors[u] @ song_factors.T`

**Output:** Predicted scores cho tất cả user-song pairs

### Hybrid Engine

| Số plays | Content | Collaborative |
|----------|---------|---------------|
| < 10     | 100%    | 0%            |
| 10–50    | 40%     | 60%           |
| > 50     | 20%     | 80%           |

**Cold-start boost:** `UserPreference` genre weights được dùng làm content scores khi user chưa có nhiều lịch sử nghe.

**Exclude:** Bài đã nghe (có trong `PlayHistory`) bị loại khỏi kết quả.

---

## API Reference

### AI Service

#### `GET /recommend?user_id={uuid}`

```json
{
  "user_id": "abc-123",
  "song_ids": ["id1", "id2", "id3", "..."]
}
```

**Lỗi:**
- `400` — thiếu user_id
- `404` — user không tồn tại

#### `GET /radio?song_id={uuid}`

```json
{
  "song_id": "xyz-456",
  "song_ids": ["id1", "id2", "id3", "..."]
}
```

**Lỗi:**
- `400` — thiếu song_id
- `404` — song không tồn tại hoặc chưa published

#### `GET /health`

```json
{ "status": "ok" }
```

### Backend

#### `GET /api/recommendations` *(requires auth)*

```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "id": "...",
        "title": "Song Name",
        "duration": 210,
        "coverUrl": "https://...",
        "playCount": 1500,
        "artistName": "Artist Name",
        "genre": { "id": "...", "name": "Pop" }
      }
    ]
  }
}
```

**Fallback:** Nếu AI service down → trả top 20 bài theo `playCount`.

#### `GET /api/recommendations/radio/:songId`

Response format giống trên. Không cần auth.

---

## Hướng dẫn Test

### Yêu cầu trước khi test

1. **Module 7.0 phải đã chạy** — cần có dữ liệu seed trong DB:
   - Ít nhất 50 songs với status `published`
   - Ít nhất 10 users với play_history
   - Có users đủ 3 nhóm: cold (<10 plays), warm (10–50), hot (>50)

2. **Services đang chạy:**
   ```bash
   docker-compose up
   ```

---

### Test 1: AI Service Health

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{ "status": "ok" }
```

---

### Test 2: Radio endpoint (content-based)

**Lấy một song_id hợp lệ từ DB trước:**

```bash
# Lấy 1 song published
docker-compose exec postgres psql -U musicuser -d musicdb \
  -c "SELECT id, title FROM \"Song\" WHERE status='published' LIMIT 1;"
```

**Gọi radio:**
```bash
curl "http://localhost:8000/radio?song_id=<SONG_ID>"
```

**Expected:**
```json
{
  "song_id": "<SONG_ID>",
  "song_ids": ["id1", "id2", "...", "id20"]
}
```

**Kiểm tra:**
- Trả về mảng (có thể rỗng nếu DB chưa đủ dữ liệu)
- `song_id` gốc không có trong `song_ids`

---

### Test 3: Recommend endpoint (hybrid)

**Lấy user_id của cold-start user (< 10 plays):**

```bash
docker-compose exec postgres psql -U musicuser -d musicdb -c "
  SELECT u.id, u.email, COUNT(ph.id) as play_count
  FROM \"User\" u
  LEFT JOIN \"PlayHistory\" ph ON ph.\"userId\" = u.id
  WHERE u.role = 'user'
  GROUP BY u.id
  HAVING COUNT(ph.id) < 10
  LIMIT 1;
"
```

```bash
curl "http://localhost:8000/recommend?user_id=<USER_ID>"
```

**Expected:** Trả về song_ids dựa trên genre preferences.

---

### Test 4: Backend API — Recommendations (requires JWT)

**Bước 1 — Đăng nhập lấy token:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<user_email>","password":"<password>"}'
```

**Bước 2 — Gọi recommendations:**
```bash
curl http://localhost:8080/api/recommendations \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "id": "...",
        "title": "...",
        "artistName": "...",
        "genre": { "id": "...", "name": "..." }
      }
    ]
  }
}
```

---

### Test 5: Backend API — Radio

```bash
curl http://localhost:8080/api/recommendations/radio/<SONG_ID>
```

**Không cần auth.** Expected: cùng format với `/api/recommendations`.

---

### Test 6: Fallback khi AI Service down

**Tắt AI service:**
```bash
docker-compose stop ai_service
```

**Gọi lại:**
```bash
curl http://localhost:8080/api/recommendations \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**Expected:** Vẫn trả về 200 với top 20 bài theo playCount (không phải 500 error).

**Khởi động lại:**
```bash
docker-compose start ai_service
```

---

### Test 7: Redis Cache

**Gọi lần 1** — sẽ chạy AI model:
```bash
time curl http://localhost:8080/api/recommendations/radio/<SONG_ID>
```

**Gọi lần 2** — lấy từ cache (nhanh hơn đáng kể):
```bash
time curl http://localhost:8080/api/recommendations/radio/<SONG_ID>
```

**Kiểm tra cache trong Redis:**
```bash
docker-compose exec redis redis-cli KEYS "radio:*"
docker-compose exec redis redis-cli TTL "radio:<SONG_ID>"
```

**Expected:** TTL ≈ 900 giây (15 phút).

---

### Test 8: Model warmup logs

Khi `ai_service` khởi động, kiểm tra logs:
```bash
docker-compose logs ai_service | grep -E "(AI models|warmup|ERROR)"
```

**Expected:**
```
✅ AI models built successfully
```

Nếu DB chưa có dữ liệu:
```
⚠️  AI model warmup failed (will retry on first request): ...
```
→ Bình thường, model sẽ rebuild lúc có request đầu tiên.

---

### Test 9: Hybrid weights — Kiểm tra cold vs hot user

**So sánh kết quả 2 user khác nhau:**

```bash
# Cold user (< 10 plays)
curl "http://localhost:8000/recommend?user_id=<COLD_USER_ID>"

# Hot user (> 50 plays)
curl "http://localhost:8000/recommend?user_id=<HOT_USER_ID>"
```

**Expected:** Kết quả khác nhau — hot user nhận được recommendations dựa nhiều vào collaborative filtering (hành vi nghe thực tế), cold user dựa vào genre preferences.

---

### Test 10: Song không tồn tại

```bash
curl "http://localhost:8000/radio?song_id=00000000-0000-0000-0000-000000000000"
```

**Expected:**
```json
{ "detail": "Song not found" }
```
HTTP status: `404`

---

## Troubleshooting

| Triệu chứng | Nguyên nhân | Fix |
|-------------|-------------|-----|
| `song_ids: []` từ `/radio` | Song không có trong content model (chưa seed đủ) | Chạy module 7.0 seed trước |
| `song_ids: []` từ `/recommend` | User không có UserPreference + chưa có play history | Hoàn thành onboarding + nghe vài bài |
| AI service trả `500` | Database connection fail | Kiểm tra `DATABASE_URL` trong `ai_service/.env` |
| Backend trả fallback charts liên tục | AI service unreachable | `docker-compose logs ai_service`, kiểm tra port 8000 |
| Cache không hoạt động | Redis chưa chạy | `docker-compose up redis` |
| `warmup failed` | DB chưa migrate hoặc chưa seed | `docker-compose exec backend npx prisma migrate deploy` |
