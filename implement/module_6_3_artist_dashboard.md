# Module 6.3 — Artist Dashboard (Pro)

**Status:** ✅ COMPLETED (2026-04-18)

---

## Tổng quan

Artist Dashboard được nâng cấp thành giao diện "pro user" với 6 tab chức năng. Artist có thể quản lý bài hát, album, xem analytics, doanh thu từ donate, và chỉnh sửa hồ sơ.

---

## Backend API

Tất cả routes mount tại `/api/artist`, yêu cầu role `artist` hoặc `admin`.

### Albums (mở rộng)
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/artist/albums` | Danh sách album của tôi |
| POST | `/artist/albums` | Tạo album mới (multipart/cover) |
| GET | `/artist/albums/:id` | Chi tiết album + danh sách bài hát |
| PATCH | `/artist/albums/:id` | Sửa tên/năm/cover |
| DELETE | `/artist/albums/:id` | Xóa album (songs set albumId=null) |
| POST | `/artist/albums/:id/songs` | Thêm bài hát vào album (`{ songId }`) |
| DELETE | `/artist/albums/:id/songs/:songId` | Xóa bài khỏi album |

### Analytics
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/artist/analytics/plays` | Lượt nghe theo ngày (`?days=30`) |
| GET | `/artist/analytics/top-songs` | Top bài hát theo playCount (`?limit=10`) |
| GET | `/artist/analytics/revenue` | Doanh thu từ donate + recent donations |

### Profile
| Method | Path | Mô tả |
|--------|------|-------|
| PATCH | `/artist/profile` | Sửa displayName, bio, avatar (multipart) |

---

## Frontend

### Route
`/artist/dashboard` → `ArtistDashboardPage.jsx`

### Tab layout
| Tab | Nội dung |
|-----|---------|
| Tổng quan | Stats cards, top 5 bài hát hot |
| Bài hát | Upload mới, filter status, inline edit, xóa |
| Album | Tạo album, thêm/xóa bài hát trong album |
| Analytics | Bar chart lượt nghe theo ngày, top 10 bài hát |
| Doanh thu | Tổng doanh thu, doanh thu theo tháng, recent donations |
| Hồ sơ | Sửa displayName, bio, avatar |

### Features
- **Multi-tab**: 6 tabs với active indicator màu xanh lá
- **Inline song edit**: Mở form inline trong table row
- **Album management**: Chọn album → hiện panel bên phải với danh sách bài + dropdown thêm bài
- **Bar chart**: CSS Tailwind, không cần chart lib (tương tự admin analytics)
- **Revenue bars**: Progress bar theo tháng so với tháng cao nhất
- **Profile form**: Upload avatar trực tiếp, preview avatar hiện tại

---

## Files thay đổi

| File | Thay đổi |
|------|---------|
| `artist.service.js` | Thêm: `getMyAlbumDetail`, `updateMyAlbum`, `deleteMyAlbum`, `addSongToMyAlbum`, `removeSongFromMyAlbum`, `getMyPlaysOverTime`, `getMyTopSongs`, `getMyRevenue`, `updateMyProfile` |
| `artist.controller.js` | Thêm handlers cho tất cả functions mới |
| `artist.routes.js` | Thêm routes: albums CRUD, album songs, analytics, profile |
| `frontend/src/lib/artistApi.js` | Thêm: `getMyAlbum`, `updateAlbum`, `deleteAlbum`, `addSongToAlbum`, `removeSongFromAlbum`, `getMyPlaysOverTime`, `getMyTopSongs`, `getMyRevenue`, `updateMyProfile` |
| `frontend/src/pages/ArtistDashboardPage.jsx` | Rewrite hoàn toàn: 6-tab layout |
