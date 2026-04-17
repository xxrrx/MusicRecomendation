# Module 3.2 — Player Frontend

**Phase:** 3 — Audio Player
**Status:** ✅ Implemented
**Date:** 2026-04-17

---

## Files Created / Modified

```
frontend/src/
├── lib/
│   └── playerApi.js                     — NEW: getStreamUrl, logPlay, logBehavior
├── stores/
│   └── playerStore.js                   — NEW: Zustand store (currentSong, queue, isPlaying, volume)
├── components/player/
│   ├── PlayerBar.jsx                    — NEW: layout-level bar, manages Howler instance
│   ├── PlayerControls.jsx               — NEW: Play/Pause/Prev/Next buttons
│   ├── ProgressBar.jsx                  — NEW: seek bar + time display
│   └── VolumeControl.jsx                — NEW: volume slider + mute toggle
├── components/
│   └── SongCard.jsx                     — UPDATED: click to play, highlights active song
├── App.jsx                              — UPDATED: render <PlayerBar /> at layout level
└── tests/
    └── player.test.jsx                  — NEW: 22 tests (all passing)
```

---

## playerStore — State Shape

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currentSong` | Song \| null | null | Song đang phát |
| `queue` | Song[] | [] | Danh sách queue |
| `queueIndex` | number | 0 | Index bài hiện tại trong queue |
| `isPlaying` | bool | false | Đang phát hay không |
| `volume` | number | 0.8 | Volume 0–1 |

**Actions:** `playSong`, `playQueue`, `togglePlay`, `nextSong`, `prevSong`, `setVolume`, `setIsPlaying`

---

## PlayerBar — Howler Flow

```
currentSong thay đổi
  → gọi getStreamUrl(songId)   ← presigned S3 URL (1hr)
  → new Howl({ src: [url], html5: true })
  → howl.play() nếu isPlaying=true

isPlaying thay đổi
  → howl.play() hoặc howl.pause()

onpause / onend
  → logPlay(songId, durationPlayed, completionRate)

onend
  → nextSong() — tự động chuyển bài
```

---

## SongCard — Click Behavior

| Trạng thái | Hành động |
|---|---|
| Bài chưa phát | `playSong(song)` |
| Bài đang phát | `togglePlay()` — pause/resume |
| Có `queue` prop | `playQueue(queue, queueIndex)` |

---

## How to Test

### Unit / component tests
```bash
cd frontend
npx vitest run src/tests/player.test.jsx
```

### Manual smoke test
```bash
docker-compose up -d postgres redis
cd backend && npm run dev
cd ../frontend && npm run dev

# Mở http://localhost:3000
# Vào trang artist → click vào bài hát
# PlayerBar xuất hiện ở bottom, audio phát qua presigned S3 URL
```
