# 07 — AI Service Contract
**Project:** Online Music Streaming System with AI Personalization
**Document Version:** 1.0
**Date:** 2026-04-05

> This document defines the internal HTTP API between the Node.js Backend and the Python AI Service.
> The AI Service is **not** exposed publicly — it is only called by the backend.
> Base URL (internal): `http://ai_service:8000`

---

## Overview

The AI Service has exactly 2 endpoints:

| Endpoint | Called by | Purpose |
|----------|-----------|---------|
| `GET /recommend` | `recommendation.service.js` | Homepage personalized recommendations |
| `GET /radio` | `recommendation.service.js` | Radio mode — songs similar to a seed song |

The Node.js backend:
1. Calls one of these endpoints
2. Receives a list of `song_id`s with scores
3. Fetches full song metadata from PostgreSQL via Prisma
4. Returns the enriched list to the frontend

---

## Authentication

No authentication between backend and AI Service — both run in the same Docker Compose network (`ai_service:8000` is not exposed on the host). The backend is the only caller.

---

## Conventions

### Standard Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "No user found with the given ID"
  }
}
```

---

## Endpoint 1 — GET /recommend

**Purpose:** Return a ranked list of song recommendations for a user's homepage.

**Called by:** `backend/src/modules/recommendation/recommendation.service.js`

---

### Request

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | string (UUID) | yes | The authenticated user's ID |
| `limit` | integer | no | Number of songs to return. Default: 20. Max: 50 |
| `exclude_ids` | string | no | Comma-separated song UUIDs to exclude (e.g. recently played) |

**Example:**
```
GET http://ai_service:8000/recommend?user_id=abc-123&limit=20&exclude_ids=song-1,song-2
```

---

### Response 200

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | `true` |
| `data` | object | See below |

`data` object:

| Field | Type | Description |
|-------|------|-------------|
| `recommendations` | array | Ranked list of song recommendations |
| `model_used` | string | Which model produced the results: `"content_based"` / `"collaborative"` / `"hybrid"` |
| `user_play_count` | integer | Total plays used to determine model weights |

Each item in `recommendations`:

| Field | Type | Description |
|-------|------|-------------|
| `song_id` | string (UUID) | Song identifier — backend fetches full metadata |
| `score` | float | Recommendation score (0.0 → 1.0, higher = more relevant) |
| `reason` | string | Why this was recommended: `"genre_match"` / `"similar_users"` / `"onboarding"` |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      { "song_id": "uuid-1", "score": 0.92, "reason": "similar_users" },
      { "song_id": "uuid-2", "score": 0.87, "reason": "genre_match" },
      { "song_id": "uuid-3", "score": 0.81, "reason": "onboarding" }
    ],
    "model_used": "hybrid",
    "user_play_count": 73
  }
}
```

---

### Model Selection Logic

| User play count | Model used | Content-based weight | Collaborative weight |
|-----------------|------------|---------------------|---------------------|
| < 10 | `content_based` | 100% | 0% |
| 10 – 50 | `hybrid` | 40% | 60% |
| > 50 | `hybrid` | 20% | 80% |

**Cold start (< 10 plays):**
- Uses `user_preferences` table (genre weights from onboarding)
- Falls back to globally popular songs if no preference data exists

---

### Errors

| Code | HTTP | Meaning |
|------|------|---------|
| `USER_NOT_FOUND` | 404 | No user found with `user_id` |
| `NO_DATA` | 200 | User has no behaviors or preferences — returns empty `recommendations` array with `model_used: "fallback"` |
| `INTERNAL_ERROR` | 500 | Model computation failed |

> `NO_DATA` returns HTTP 200 (not an error) — the backend should handle the empty list by falling back to popular songs.

---

## Endpoint 2 — GET /radio

**Purpose:** Return a list of songs similar to a given seed song for Radio mode auto-queue.

**Called by:** `backend/src/modules/recommendation/recommendation.service.js`

---

### Request

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `song_id` | string (UUID) | yes | The seed song to base similarity on |
| `user_id` | string (UUID) | yes | Used to filter by preferences and exclude recently skipped songs |
| `limit` | integer | no | Default: 10. Max: 20 |
| `exclude_ids` | string | no | Comma-separated song UUIDs to exclude (e.g. already queued) |

**Example:**
```
GET http://ai_service:8000/radio?song_id=abc&user_id=xyz&limit=10&exclude_ids=song-5,song-6
```

---

### Response 200

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | `true` |
| `data` | object | See below |

`data` object:

| Field | Type | Description |
|-------|------|-------------|
| `songs` | array | Ranked similar songs |
| `seed_song_id` | string | The original seed song UUID (echoed back) |

Each item in `songs`:

| Field | Type | Description |
|-------|------|-------------|
| `song_id` | string (UUID) | Song identifier |
| `similarity_score` | float | Cosine similarity score (0.0 → 1.0) |
| `matched_features` | string[] | Which features drove the match: `["genre", "bpm", "mood", "key"]` |

**Example Response:**
```json
{
  "success": true,
  "data": {
    "seed_song_id": "abc-seed-uuid",
    "songs": [
      { "song_id": "uuid-A", "similarity_score": 0.94, "matched_features": ["genre", "mood", "bpm"] },
      { "song_id": "uuid-B", "similarity_score": 0.88, "matched_features": ["genre", "key"] },
      { "song_id": "uuid-C", "similarity_score": 0.76, "matched_features": ["mood", "bpm"] }
    ]
  }
}
```

---

### Radio Similarity Computation Steps

1. Load seed song metadata: `genre_id`, `bpm`, `mood`, `key` from PostgreSQL
2. Build feature vector for seed song
3. Compute cosine similarity against all published songs in library
4. Apply user preference filter: boost songs matching user's genre weights
5. Exclude songs with `action = "skip"` from `user_behaviors` (recent 30 days)
6. Exclude songs in `exclude_ids`
7. Return top N by score

---

### Errors

| Code | HTTP | Meaning |
|------|------|---------|
| `SONG_NOT_FOUND` | 404 | Seed song not found or not published |
| `USER_NOT_FOUND` | 404 | No user found with `user_id` |
| `INSUFFICIENT_LIBRARY` | 200 | Library has fewer songs than `limit` — returns all available |
| `INTERNAL_ERROR` | 500 | Computation failed |

---

## Data Sources (PostgreSQL Tables Read by AI Service)

| Table | Purpose |
|-------|---------|
| `songs` | Song metadata: genre_id, bpm, mood, key, status (only reads `published` songs) |
| `genres` | Genre name/slug for feature encoding |
| `user_behaviors` | Like / dislike / skip actions — training data for collaborative model |
| `play_history` | Play events — used to count total plays per user |
| `user_preferences` | Genre weights from onboarding — used for cold start and radio filtering |

> The AI Service connects to PostgreSQL **read-only**. It never writes to any table.
> All writes (logging plays, recording behaviors) are done by the Node.js backend.

---

## Caching (Redis, managed by Node.js backend)

The **Node.js backend** caches AI Service responses in Redis before returning to the frontend. The AI Service itself has no Redis dependency.

| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| `/recommend` | `rec:{user_id}` | 15 minutes |
| `/radio` | `radio:{song_id}:{user_id}` | 15 minutes |

Cache is invalidated when:
- User records a new `like` / `dislike` / `skip` behavior
- User completes onboarding

---

## Timeouts & Retries (Backend behavior)

| Scenario | Behavior |
|----------|---------|
| AI Service response > 3s | Backend returns timeout error to frontend |
| AI Service returns 500 | Backend falls back to returning popular songs from charts |
| AI Service unreachable | Backend falls back to popular songs and logs a warning |

---

## FastAPI Auto-Documentation

When the AI Service is running, interactive docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
