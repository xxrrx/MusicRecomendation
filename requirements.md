# Music Recommendation Website - Requirements Document

## 1. Tong quan du an

### 1.1 Mo ta
Website nghe nhac truc tuyen co tinh nang ca nhan hoa de xuat bai hat cho tung nguoi dung, ket hop nhieu phuong phap Machine Learning de mang lai trai nghiem nghe nhac toi uu.

### 1.2 Muc tieu
- Xay dung nen tang streaming nhac chat luong cao
- Ca nhan hoa de xuat bai hat dua tren hanh vi nguoi dung
- Dam bao trai nghiem muot ma, real-time
- Ho tro cold start cho nguoi dung moi

### 1.3 Doi tuong su dung
- Nguoi dung ca nhan muon nghe nhac truc tuyen
- Quan tri vien he thong (admin)

---

## 2. Kien truc he thong

```
Frontend (Next.js 14 + TypeScript)
         |
Backend API (FastAPI - Python)
         |
+--------+--------+----------+
|        |        |          |
PostgreSQL  Redis   S3/R2   Celery
(DB)     (Cache) (Storage) (Queue)
         |
Recommendation Engine (Python ML)
+--------+--------+
|                 |
Content-Based  Collaborative
Filtering      Filtering
         |
    Hybrid Model
```

### 2.1 Mo ta cac thanh phan

| Thanh phan | Cong nghe | Vai tro |
|---|---|---|
| Frontend | Next.js 14 + TypeScript | Giao dien, SSR, SEO |
| Audio Player | Howler.js | Streaming, playlist, visualizer |
| Backend | FastAPI (Python) | REST API, xu ly logic |
| Database chinh | PostgreSQL | Luu tru user, songs, playlists |
| Cache | Redis | Session, recommendation cache |
| ML Engine | scikit-learn + LightFM | Mo hinh de xuat |
| File Storage | Cloudflare R2 / AWS S3 | Luu file audio, anh bia |
| Task Queue | Celery + Redis | Train model async, batch jobs |
| Auth | NextAuth.js / Clerk | Dang nhap OAuth |
| Streaming | HLS (HTTP Live Streaming) | Phat nhac hieu qua |

---

## 3. Tinh nang chuc nang

### 3.1 Phase 1 - MVP (Nen tang co ban)

#### 3.1.1 Xac thuc nguoi dung
- Dang ky tai khoan bang email + mat khau
- Dang nhap qua OAuth (Google, Facebook)
- Quan ly phien dang nhap (JWT + Refresh Token)
- Quen mat khau / doi mat khau

#### 3.1.2 Quan ly Nhac
- Upload nhac (admin): MP3, FLAC, WAV
- Metadata: ten bai, nghe si, album, the loai, nam phat hanh
- Anh bia album
- Phat nhac truc tuyen (HLS streaming)
- Tua bai, tang/giam am luong
- Hien thi loi bai (lyrics)

#### 3.1.3 Tim kiem & Kham pha
- Tim kiem theo ten bai, nghe si, album
- Loc theo the loai (genre)
- Duyet theo album, nghe si
- Bang xep hang nhac hot (trending)

#### 3.1.4 Playlist ca nhan
- Tao / sua / xoa playlist
- Them / xoa bai khoi playlist
- Playlist cong khai / rieng tu
- Phat ngau nhien (shuffle)
- Phat lai (repeat: tat / mot bai / tat ca)

#### 3.1.5 Thu vien ca nhan
- Luu bai yeu thich (Like)
- Theo doi nghe si
- Lich su nghe gan day

#### 3.1.6 Log hanh vi nguoi dung
- Ghi nhan: phat, dung, skip, like, replay, tim kiem
- Timestamp, thoi gian nghe, ty le hoan thanh
- Thiet bi, khu vuc (phuc vu de xuat)

### 3.2 Phase 2 - Ca nhan hoa

#### 3.2.1 "De xuat cho ban" (Collaborative Filtering)
- Phan tich hanh vi cua nhom user tuong tu
- Cap nhat theo lo moi 6 tieng (batch)
- Hien thi tren trang chu

#### 3.2.2 "Bai tuong tu" (Content-Based Filtering)
- Phan tich dac trung am thanh: tempo, energy, valence, danceability
- Goi y ngay sau khi nghe xong mot bai
- Ap dung cho user moi (cold start)

#### 3.2.3 Hybrid Recommendation
```
score = (0.4 x content_score) + (0.4 x collab_score) + (0.2 x trending_score)
```
- Ket hop ca hai phuong phap de tang do chinh xac
- Tu dong dieu chinh trong so theo do chinh xac A/B test

#### 3.2.4 Mood-Based Playlist
- Phan loai cam xuc: Vui, Buon, Nang dong, Thu gian, Tap trung
- De xuat playlist theo trang thai tam ly
- Tinh nang "Chon tam trang" tren giao dien

#### 3.2.5 Daily Mix
- Tao tu dong playlist moi moi ngay
- Ket hop nhac yeu thich + kham pha moi
- Phan loai theo gio trong ngay (sang/trua/toi)

#### 3.2.6 Giai quyet Cold Start (User moi)
```
Neu listen_count < 10:
  1. Hoi the loai yeu thich khi dang ky (onboarding)
  2. Trending theo khu vuc (IP -> quoc gia)
  3. Content-based tu bai dau tien nghe
Neu listen_count >= 10:
  Chuyen sang Collaborative Filtering day du
```

### 3.3 Phase 3 - Nang cao

#### 3.3.1 Real-time Queue (Websocket)
- Hang doi phat nhac chia se nhom
- Dong bo trang thai giua nhieu thiet bi

#### 3.3.2 Audio Visualizer
- Hieu ung hinh anh theo nhip nhac (Web Audio API)
- Nhieu kieu hien thi: song am, bar, waveform

#### 3.3.3 Radio / Auto-play
- Tiep tuc de xuat khong gioi han sau khi het playlist
- Che do radio theo the loai, nghe si

#### 3.3.4 Podcast (tuy chon)
- Upload va phat podcast
- Theo doi kenh podcast
- De xuat podcast theo so thich

---

## 4. Luong de xuat ca nhan hoa

```
[User hanh dong]
 Phat / Skip / Like / Tim kiem / Replay
        |
[Event Queue - Redis]
        |
[Feature Engineering]
  - Lich su nghe (listening history vector)
  - Pattern theo gio trong ngay
  - Trong so the loai (genre weights)
  - Ti le skip theo nghe si
        |
[Recommendation Engine]
  |----------------------|
  Real-time (<100ms)   Batch (moi 6h)
  Content-Based        Collaborative
  Filtering            Filtering
  |----------------------|
        |
  [Hybrid Score]
        |
  [Ranked Results] --> [User]
```

---

## 5. Database Schema

### 5.1 Users
```sql
users (
  id            UUID PRIMARY KEY,
  email         VARCHAR UNIQUE NOT NULL,
  display_name  VARCHAR,
  avatar_url    VARCHAR,
  country       VARCHAR(2),
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
)
```

### 5.2 Songs
```sql
songs (
  id            UUID PRIMARY KEY,
  title         VARCHAR NOT NULL,
  artist_id     UUID REFERENCES artists(id),
  album_id      UUID REFERENCES albums(id),
  duration_sec  INTEGER,
  audio_url     VARCHAR NOT NULL,
  cover_url     VARCHAR,
  genre         VARCHAR[],
  release_year  INTEGER,
  -- Audio features (tu Spotify API hoac Librosa)
  tempo         FLOAT,
  energy        FLOAT,
  valence       FLOAT,
  danceability  FLOAT,
  acousticness  FLOAT,
  created_at    TIMESTAMP
)
```

### 5.3 Play Events (Loi song song nhat)
```sql
play_events (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  song_id         UUID REFERENCES songs(id),
  played_at       TIMESTAMP,
  duration_played INTEGER,   -- so giay da nghe
  completed       BOOLEAN,   -- nghe het khong
  skipped         BOOLEAN,
  source          VARCHAR    -- 'search', 'recommendation', 'playlist'
)
```

### 5.4 User Preferences
```sql
user_preferences (
  user_id       UUID REFERENCES users(id),
  genre         VARCHAR,
  weight        FLOAT,       -- 0.0 - 1.0
  updated_at    TIMESTAMP,
  PRIMARY KEY (user_id, genre)
)
```

### 5.5 Playlists
```sql
playlists (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  name        VARCHAR NOT NULL,
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMP
)

playlist_songs (
  playlist_id UUID REFERENCES playlists(id),
  song_id     UUID REFERENCES songs(id),
  position    INTEGER,
  added_at    TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id)
)
```

---

## 6. API Endpoints

### 6.1 Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### 6.2 Songs & Streaming
```
GET  /api/songs                   # Danh sach bai hat
GET  /api/songs/{id}              # Chi tiet bai hat
GET  /api/songs/{id}/stream       # Stream audio (HLS)
GET  /api/songs/{id}/similar      # Bai tuong tu (content-based)
POST /api/songs/{id}/play-event   # Log hanh vi nghe
```

### 6.3 Recommendations
```
GET  /api/recommendations/for-you       # De xuat ca nhan
GET  /api/recommendations/daily-mix     # Daily mix
GET  /api/recommendations/trending      # Xu huong
GET  /api/recommendations/mood/{mood}   # Theo tam trang
```

### 6.4 Playlists
```
GET    /api/playlists
POST   /api/playlists
GET    /api/playlists/{id}
PUT    /api/playlists/{id}
DELETE /api/playlists/{id}
POST   /api/playlists/{id}/songs
DELETE /api/playlists/{id}/songs/{song_id}
```

### 6.5 Library
```
GET    /api/library/liked-songs
POST   /api/library/liked-songs/{song_id}
DELETE /api/library/liked-songs/{song_id}
GET    /api/library/history
GET    /api/library/followed-artists
POST   /api/library/followed-artists/{artist_id}
```

---

## 7. Mo hinh Machine Learning

### 7.1 Content-Based Filtering
- **Input:** Audio features (tempo, energy, valence, danceability, acousticness, genre vector)
- **Algorithm:** Cosine Similarity tren feature vector
- **Library:** scikit-learn
- **Hieu nang:** < 100ms / request (tien tinh toan, luu vao Redis)

### 7.2 Collaborative Filtering
- **Input:** Ma tran User x Song (implicit feedback: play, skip, like)
- **Algorithm:** ALS (Alternating Least Squares) hoac SVD
- **Library:** LightFM hoac implicit
- **Training:** Batch moi 6 tieng qua Celery
- **Output:** Top-N bai hat cho moi user

### 7.3 Hybrid Scoring
```python
def hybrid_score(user_id, song_id):
    content  = content_based_score(user_id, song_id)   # 0.0 - 1.0
    collab   = collaborative_score(user_id, song_id)   # 0.0 - 1.0
    trending = trending_score(song_id)                 # 0.0 - 1.0
    return (0.4 * content) + (0.4 * collab) + (0.2 * trending)
```

### 7.4 Audio Feature Extraction
- Dung **Librosa** (Python) de trich xuat dac trung tu file audio
- Hoac goi **Spotify Audio Features API** neu bai hat co tren Spotify
- Luu vao cot audio features trong bang songs

---

## 8. Non-Functional Requirements

### 8.1 Hieu nang
- API response time: < 200ms (p95)
- Recommendation response: < 100ms (tu cache Redis)
- Audio streaming: khoi dong trong < 2 giay

### 8.2 Kha nang mo rong
- Horizontal scaling cho Backend (stateless FastAPI)
- Redis Cluster cho cache
- CDN cho file audio (Cloudflare)

### 8.3 Bao mat
- HTTPS bat buoc
- JWT voi thoi han ngan (15 phut) + Refresh Token (7 ngay)
- Rate limiting tren API
- Khong luu mat khau ro rang (bcrypt)
- Validate upload file: chi chap nhan dinh dang am thanh

### 8.4 Do tin cay
- Uptime muc tieu: 99.5%
- Backup database hang ngay
- Luu log loi (Sentry hoac tuong duong)

---

## 9. Lo trinh phat trien

### Sprint 1-2: Nen tang
- Cai dat moi truong (Docker Compose)
- Database schema + migration
- Auth API (dang ky, dang nhap, JWT)
- Upload + serve audio co ban

### Sprint 3-4: Player & Library
- Frontend Next.js co ban
- Audio player (Howler.js)
- Tim kiem bai hat
- Quan ly playlist ca nhan

### Sprint 5-6: Log & Content-Based
- He thong log hanh vi nguoi dung
- Trich xuat audio features (Librosa)
- Content-based recommendation API
- Hien thi "Bai tuong tu"

### Sprint 7-8: Collaborative Filtering
- Xay dung pipeline train mo hinh (Celery)
- Collaborative filtering voi LightFM
- Hybrid scoring
- Trang "De xuat cho ban"

### Sprint 9-10: UX & Nang cao
- Mood-based playlist
- Daily Mix
- Audio visualizer
- Toi uu hieu nang, A/B testing
- Deploy len production

---

## 10. Cong cu & Moi truong

### 10.1 Development
- Docker + Docker Compose (local dev)
- Pre-commit hooks (black, isort, eslint)
- Pytest (backend) + Jest (frontend)

### 10.2 CI/CD
- GitHub Actions
- Tu dong test khi push
- Deploy len staging khi merge vao main

### 10.3 Monitoring
- Prometheus + Grafana (metrics)
- Sentry (error tracking)
- Flower (Celery task monitor)

---

## 11. Uoc tinh tai nguyen ban dau

| Thanh phan | Tuy chon re | Tuy chon tot |
|---|---|---|
| Backend (VPS) | Hetzner CX21 (~$5/thang) | AWS t3.medium (~$30/thang) |
| Database | PostgreSQL tu host | Supabase Free / RDS |
| Storage | Cloudflare R2 (10GB mien phi) | AWS S3 |
| Cache | Redis tu host | Upstash Redis |
| CDN | Cloudflare Free | Cloudflare Pro |

**Tong chi phi khoi diem uoc tinh: $10 - $50 / thang**
