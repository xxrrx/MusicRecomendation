# 08 — AI Layer Design
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-04-05

> **Decision:** Pure ML only — Scikit-learn (SVD + cosine similarity). No LLM or Claude API calls.
> This document details the ML models, data pipeline, training schedule, and cold start strategy.

---

## 1. Architecture Overview

```
PostgreSQL (read-only)
    │
    │  SQLAlchemy queries
    ▼
data/fetcher.py ──────────────────────────────────────────────┐
    │                                                          │
    ▼                                                          ▼
data/preprocessor.py                               user_behaviors table
    │                                                 play_history table
    ├── encode song features (genre, bpm, mood, key)          │
    └── build user-item interaction matrix                     │
         │                                                     │
         ▼                                                     ▼
models/content_based.py                       models/collaborative.py
  Cosine Similarity                              SVD (TruncatedSVD)
  (song metadata vectors)                        (user-item matrix)
         │                                                     │
         └──────────────────┬──────────────────────────────────┘
                            │
                    models/hybrid.py
                  Weighted score blend
                            │
                            ▼
                routers/recommend.py       routers/radio.py
                GET /recommend             GET /radio
                            │
                    utils/cache.py  (in-memory, per process)
```

---

## 2. Content-Based Filtering Model

**File:** `ai_service/models/content_based.py`

### Purpose
Recommend songs based on similarity of song metadata features — does not require user history.

### Feature Vector

Each song is encoded into a numeric feature vector:

| Feature | Encoding | Notes |
|---------|---------|-------|
| `genre_id` | One-hot encoding | N genres → N binary columns |
| `bpm` | Min-max normalized | Range 0.0 → 1.0 |
| `mood` | One-hot encoding | Categories: happy, sad, energetic, calm, romantic, melancholic |
| `key` | One-hot encoding | 12 musical keys (C, C#, D, ... B) + major/minor = 24 columns |

Songs missing any feature (NULL) are assigned the mean value of that feature across the library.

### Algorithm

- **Cosine Similarity** via `sklearn.metrics.pairwise.cosine_similarity`
- Computes similarity between the target vector and all published song vectors
- Returns top-N most similar songs sorted by score descending

### When Used

- Cold start users (< 10 plays) — 100% weight
- Hybrid mode (10-50 plays) — 40% weight
- Hybrid mode (> 50 plays) — 20% weight
- Always used for `/radio` as the primary signal

### Preprocessing

- All song features loaded once at startup into a NumPy matrix (in memory)
- Matrix rebuilt on model reload (see Training Schedule section)
- Indexed by `song_id` for O(1) lookup

---

## 3. Collaborative Filtering Model

**File:** `ai_service/models/collaborative.py`

### Purpose
Recommend songs based on what similar users listened to and liked — captures taste patterns that metadata alone cannot.

### Algorithm

- **Matrix Factorization** via `sklearn.decomposition.TruncatedSVD`
- Decomposes the user-item interaction matrix into latent factors
- `n_components = 50` (tunable)

### User-Item Interaction Matrix

Rows = users, Columns = published songs, Values = interaction score

| User Action | Score |
|-------------|-------|
| `like` | +2.0 |
| Play > 80% completion | +1.5 |
| Play 30–80% completion | +1.0 |
| Play < 30% completion (not skipped) | +0.5 |
| `skip` (< 30 seconds) | -1.0 |
| `dislike` | -2.0 |

Scores are aggregated per (user, song) pair. Missing = 0 (implicit negative).

### Prediction

For a target user:
1. Retrieve the user's latent factor vector
2. Compute dot product with all song latent factor vectors
3. Sort by predicted score, exclude already-listened songs
4. Return top-N

### Cold Start Handling for Collaborative

If a user has fewer than 10 interactions, the SVD model lacks sufficient signal.
→ Fall back to Content-based entirely (weight = 100%)

---

## 4. Hybrid Model

**File:** `ai_service/models/hybrid.py`

### Weight Schedule

| User total plays | Content-based weight | Collaborative weight |
|-----------------|---------------------|---------------------|
| 0 – 9 | 1.00 | 0.00 |
| 10 – 50 | 0.40 | 0.60 |
| > 50 | 0.20 | 0.80 |

### Score Combination

```python
hybrid_score = (cb_weight * content_score) + (collab_weight * collab_score)
```

Both `content_score` and `collab_score` are normalized to [0, 1] before combining.

### Final Ranking

Songs are ranked by `hybrid_score` descending. Already-listened songs and `exclude_ids` are filtered out before returning.

---

## 5. Data Pipeline

**File:** `ai_service/data/fetcher.py`

### Data Fetched from PostgreSQL (read-only)

| Query | Purpose |
|-------|---------|
| All published songs with features | Build content-based matrix |
| All user behaviors (like/dislike/skip) | Build collaborative matrix |
| All play_history with completion_rate | Score interactions |
| user_preferences per user | Cold start genre weights |

**Connection:** SQLAlchemy + psycopg2, reads from same PostgreSQL instance as backend.

**File:** `ai_service/data/preprocessor.py`

Responsibilities:
- One-hot encode categorical features (genre, mood, key)
- Min-max normalize numeric features (bpm)
- Compute interaction scores from raw behavior + play_history
- Build the user-item matrix (sparse where possible)
- Fill NULL features with column means

---

## 6. Model Training Schedule

The SVD model requires periodic retraining as new user data accumulates.
The content-based matrix also needs rebuilding when new songs are published.

| Event | Action | Trigger |
|-------|--------|---------|
| New song published (admin approves) | Rebuild content-based matrix | Backend calls `POST /admin/rebuild-content-model` (internal) |
| Daily at 03:00 (cron) | Retrain SVD + rebuild all matrices | Bull cron job in backend triggers `POST /admin/retrain` (internal) |
| Service startup | Load all models into memory | FastAPI startup event |

### Internal Endpoints (not in public API contract)

| Endpoint | Purpose |
|----------|---------|
| `POST /admin/retrain` | Full retrain: fetch new data, rebuild both matrices, reload models |
| `POST /admin/rebuild-content-model` | Rebuild only the content-based song matrix (faster) |

These endpoints are called **only** by the Node.js backend, never by the frontend.

### Training Duration Estimate (at 100 users, 1000 songs)

| Step | Estimated time |
|------|---------------|
| Data fetch from PostgreSQL | < 1s |
| Content-based matrix build | < 1s |
| SVD fit (TruncatedSVD, 50 components) | 1–3s |
| Total | < 5s |

Models are swapped atomically (old model stays active until new one is ready).

---

## 7. Cold Start Strategy

Cold start = new user with no or few play events.

| Plays | Strategy |
|-------|---------|
| 0 (no onboarding) | Return globally popular songs (top charts) |
| 0 (onboarding completed) | Filter songs by onboarding genre weights using content-based similarity |
| 1–9 | 100% content-based — use onboarding genres + liked songs as seed |

**Onboarding data used:**
- `user_preferences` table: genre_id + weight pairs
- Build a synthetic "user taste vector" from weighted average of preferred genre feature vectors
- Run cosine similarity against all songs

---

## 8. Radio Mode Design

Radio uses only content-based similarity (no collaborative) because:
- The seed is a specific song, not a user profile
- User preferences are applied as a filter/boost, not a primary signal

### Radio Algorithm

```
1. Load seed song feature vector
2. Compute cosine_similarity(seed_vector, all_song_vectors)
3. Sort by similarity score DESC
4. Apply user preference boost:
     for each result song:
       if song.genre_id in user_preferences:
         score *= (1 + user_preferences[genre_id].weight * 0.2)
5. Remove songs with user_behaviors.action = "skip" (last 30 days)
6. Remove seed song itself
7. Remove exclude_ids
8. Return top N
```

---

## 9. Caching in AI Service

**File:** `ai_service/utils/cache.py`

The AI Service uses a simple **in-process Python dict cache** for computed recommendation results.
This is separate from the Redis cache managed by the Node.js backend.

| Cache | Key | TTL | Purpose |
|-------|-----|-----|---------|
| Content matrix | `"content_matrix"` | Until retrain | Pre-computed song feature matrix |
| SVD model | `"svd_model"` | Until retrain | Fitted TruncatedSVD object |
| User vectors | `"user_vec:{user_id}"` | 15 min | Per-user collaborative latent vector |

The Python dict cache is cleared on every retrain call.

---

## 10. File Structure

```
ai_service/
├── routers/
│   ├── recommend.py        ← GET /recommend endpoint handler
│   └── radio.py            ← GET /radio endpoint handler
│
├── models/
│   ├── content_based.py    ← CosineSimilarityModel class
│   ├── collaborative.py    ← SVDModel class (TruncatedSVD)
│   └── hybrid.py           ← HybridModel class — weight blending
│
├── data/
│   ├── fetcher.py          ← SQLAlchemy queries, returns DataFrames
│   └── preprocessor.py     ← Feature encoding, matrix construction
│
├── utils/
│   └── cache.py            ← Simple in-process dict cache with TTL
│
├── main.py                 ← FastAPI app init, startup model loading, router registration
├── requirements.txt
└── Dockerfile
```

---

## 11. requirements.txt (AI Service)

```
fastapi==0.110.0
uvicorn==0.29.0
pandas==2.2.0
numpy==1.26.4
scikit-learn==1.4.1
sqlalchemy==2.0.28
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

---

## 12. Key Design Decisions

| Decision | Reason |
|----------|--------|
| TruncatedSVD instead of full SVD | Sparse user-item matrix — TruncatedSVD is memory-efficient and faster |
| n_components = 50 | Sufficient latent factors for <1000 songs, <100 users; can be tuned up |
| Daily retraining schedule | User behavior accumulates slowly at this scale — hourly retraining is unnecessary |
| Content matrix rebuilt on publish | New songs must be discoverable immediately without waiting for daily cron |
| Read-only DB access | AI Service never writes; all state changes go through the Node.js backend |
| In-process cache (no Redis in AI Service) | Simpler architecture — Node.js handles Redis caching of the final enriched results |
