# 01 — Requirements & Specification
**Project:** Online Music Streaming System with AI Personalization
**Market:** Vietnam
**Scope:** Web Application (Local Deployment)
**Document Version:** 1.0
**Date:** 2026-03-28

---

## 1. System Overview

An online music streaming platform that allows users to listen to music, discover content, and receive AI-personalized music recommendations. Artists can upload and manage their own content. Admins moderate content before it is published.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated user. Can listen to music and view public information, but no personalization features |
| **User** | Registered user. Full feature access: playlists, liked songs, AI recommendations, follow artists, donate |
| **Artist** | Artist account. Can upload music, manage their songs, view play statistics, receive donations |
| **Admin** | System administrator. Approves content, manages users, views system-wide analytics |

---

## 3. Functional Requirements

### 3.1 Authentication & User Account

| ID | Requirement | Role |
|----|-------------|------|
| AUTH-01 | Register a User account with email + password | Guest |
| AUTH-02 | Register an Artist account (separate flow) | Guest |
| AUTH-03 | Login / Logout | User, Artist, Admin |
| AUTH-04 | Send account confirmation email after registration | System |
| AUTH-05 | Manage personal profile (avatar, display name, bio) | User, Artist |
| AUTH-06 | Onboarding — select music preferences on first registration | New User |

> **Onboarding flow:** After email confirmation, new Users go through a series of questions to identify preferences (genres, favorite artists, mood...). This data is the initial input for AI recommendations.

---

### 3.2 Music Player

| ID | Requirement |
|----|-------------|
| PLAY-01 | Stream music online (no offline/download support) |
| PLAY-02 | Fixed audio quality: 128kbps |
| PLAY-03 | Basic controls: Play, Pause, Next, Previous, Seek |
| PLAY-04 | Shuffle (random) and Repeat (single track / entire playlist) modes |
| PLAY-05 | Volume control |
| PLAY-06 | Display real-time synced lyrics (synced LRC format) |
| PLAY-07 | Crossfade between songs |
| PLAY-08 | Equalizer for audio customization |
| PLAY-09 | Sleep Timer (auto-stop music after X minutes) |
| PLAY-10 | Radio mode: automatically play songs similar to the current track (see section 3.6) |

> **Lyrics note:** Lyrics files are stored in synced LRC (`.lrc`) format — a standard format with per-line timestamps, supporting highlight of the correct lyric line in sync with playback progress.

---

### 3.3 Music Library & Content

| ID | Requirement |
|----|-------------|
| LIB-01 | Song detail page (name, artist, album, genre, year, duration, play count) |
| LIB-02 | Artist detail page (bio, photo, song list, total play count) |
| LIB-03 | Album detail page (cover art, song list) |
| LIB-04 | Display play count per song (publicly visible to all users) |

---

### 3.4 Playlist & Liked Songs

| ID | Requirement | Role |
|----|-------------|------|
| PL-01 | User can create, name, edit, and delete personal playlists | User |
| PL-02 | Add / remove songs from a playlist | User |
| PL-03 | "Liked Songs" feature — personal favorites library | User |
| PL-04 | System auto-generates Top Charts playlists (daily / weekly / monthly) | System |
| PL-05 | Collaborative playlists are not supported | — |

---

### 3.5 Search & Discovery

| ID | Requirement |
|----|-------------|
| SEARCH-01 | Search by: song name, artist name, album name, genre |
| SEARCH-02 | Search results clearly grouped (Songs / Artists / Albums) |
| SEARCH-03 | Charts page: display top songs by day / week / month |

---

### 3.6 AI & Personalization

#### Behavioral Data Collected (for AI)

| Data Type | Details |
|-----------|---------|
| Play history | Which songs were played and when |
| Interaction behavior | Like, Dislike (direct feedback) |
| Skip behavior | Songs skipped early (< 30 seconds) |
| Listening duration | Percentage of song listened to |
| Onboarding preferences | Data from initial preference selection step |
| Followed artists | Artists the user is following |

#### AI Features

| ID | Feature | Description |
|----|---------|-------------|
| AI-01 | **Homepage Personalization** | Homepage shows a "Recommended for you" section based on play history and preferences. User A who listens to Indie → prioritize Indie artists. User B who listens to V-Pop → prioritize V-Pop |
| AI-02 | **Smart Radio** | From 1 song, automatically plays similar songs based on: genre, BPM, mood of the current track + user's personal preferences. Example: listening to V-Pop ballad → Radio continues with V-Pop ballads the user has liked |
| AI-03 | **User Feedback** | "Dislike" button so users can remove a genre/artist from suggestions — AI updates the preference |
| AI-04 | **Onboarding Cold Start** | For new users with no history, use onboarding data to initialize the initial recommendation profile |

#### Recommended AI Approaches

| Method | Application |
|--------|-------------|
| **Content-based Filtering** | Recommend songs based on metadata features (genre, BPM, mood, key) of songs the user has liked |
| **Collaborative Filtering** | Recommend based on behavior of users with similar tastes |
| **Hybrid Approach** | Combine both — Content-based for cold start, gradually shift to Collaborative as more data accumulates |

---

### 3.7 Social Features

| ID | Requirement | Role |
|----|-------------|------|
| SOC-01 | Follow / Unfollow Artist | User |
| SOC-02 | View list of followed Artists | User |
| SOC-03 | No user-to-user follows, no activity feed, no external social sharing | — |

---

### 3.8 Donate / Tip for Artists

| ID | Requirement |
|----|-------------|
| DON-01 | User can donate/tip money directly to an Artist |
| DON-02 | Payment via **VNPay** (Vietnamese market) |
| DON-03 | Payment via **Stripe** (international cards) |
| DON-04 | Display donation history for User |
| DON-05 | Artist can view total amount received |

---

### 3.9 Artist Dashboard

| ID | Requirement |
|----|-------------|
| ART-01 | Artist registers a separate account (not a regular User account) |
| ART-02 | Upload songs with metadata: name, album, genre, year, BPM, mood, key, audio file, lyrics file (.lrc), cover image |
| ART-03 | Uploaded songs start with status **"Pending"** — not yet visible on the platform |
| ART-04 | After Admin approval → song moves to **"Published"** and becomes publicly visible |
| ART-05 | Artist manages their song list (view, edit metadata, take down) |
| ART-06 | Artist views statistics: play count per song, total play count, play count over time |
| ART-07 | Artist views total amount received from donations |

---

### 3.10 Admin Panel

| ID | Requirement |
|----|-------------|
| ADM-01 | View list of songs **"Pending"** approval from Artists |
| ADM-02 | Approve or Reject songs with a reason |
| ADM-03 | Manage Users: view list, lock / unlock accounts |
| ADM-04 | Manage Artists: view list, lock / unlock accounts |
| ADM-05 | Delete violating songs from the system |
| ADM-06 | Analytics dashboard: total users, total plays, most popular songs, featured artists |
| ADM-07 | Admin does **not** have the ability to upload music directly |

---

### 3.11 Notifications

| ID | Requirement |
|----|-------------|
| NOTIF-01 | Send confirmation email when account registration is successful |
| NOTIF-02 | Send email to Artist with song review result (Approved / Rejected + reason) |
| NOTIF-03 | No browser push notifications |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Scale** | ~100 concurrent users (personal project, internal use) |
| **Deployment** | Runs on local machine, no SLA uptime requirement |
| **Platform** | Web Application — no Mobile App |
| **UI Language** | Vietnamese as primary |
| **Market** | Vietnam |
| **Security** | JWT authentication, HTTPS, password encryption (bcrypt) |
| **File Storage** | Audio files stored on AWS S3 |
| **Compliance** | No GDPR / PDPA compliance required |
| **Audio quality** | 128kbps MP3 (single fixed quality) |
| **Offline** | Not supported |

---

## 5. Key Business Flows

### 5.1 Music Upload Flow (Artist)
```
Artist uploads song + metadata
        ↓
Status: "Pending" (not publicly visible)
        ↓
Admin receives notification → Reviews content
        ↓
     [Approve]              [Reject]
        ↓                     ↓
Status: "Published"        Email with reason → Artist
Publicly visible on platform
```

### 5.2 New User Onboarding Flow
```
Register email + password
        ↓
Verify email (click link in email)
        ↓
Onboarding: answer preference questionnaire
(favorite genres, favorite artists, mood...)
        ↓
System creates initial AI preference profile
        ↓
Redirect to personalized Homepage
```

### 5.3 Donate Flow
```
User visits Artist page → Clicks "Donate"
        ↓
Enter amount
        ↓
Select payment method: VNPay / Stripe
        ↓
Process payment (redirect to payment gateway)
        ↓
Result: Success / Failure
        ↓
Update donation total displayed on Artist dashboard
```

---

## 6. Out of Scope

- Offline listening / download
- Premium / Subscription plans
- Mobile App (iOS / Android)
- Collaborative Playlists
- Social media sharing
- Browser push notifications
- Browse / Discover by mood / era
- User-to-user follows
- Livestream / Podcast
- Commercial music licensing (internal project)
