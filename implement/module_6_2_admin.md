# Module 6.2 — Admin Module (Đầy đủ)

**Status:** ✅ COMPLETED (2026-04-18)

---

## Tổng quan

Admin panel đầy đủ với layout riêng (không có PlayerBar, không có sidebar user). Gồm 6 nhóm chức năng chính.

---

## Backend API

Tất cả routes đều yêu cầu `role: admin`. Mount tại `/api/admin`.

### Kiểm duyệt nội dung
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/pending-songs` | Danh sách bài hát chờ duyệt |
| PATCH | `/admin/songs/:id/review` | Duyệt/từ chối + tạo SongApprovalLog + email nghệ sĩ |

### Quản lý bài hát
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/songs` | Tất cả bài hát, lọc theo status/search/artistId |
| GET | `/admin/songs/:id` | Chi tiết + approval logs |
| PATCH | `/admin/songs/:id` | Sửa metadata + force publish/reject |
| DELETE | `/admin/songs/:id` | Xóa cứng + approval logs |

### Quản lý nghệ sĩ
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/artists` | Danh sách nghệ sĩ, có tìm kiếm |
| POST | `/admin/users/:id/promote-artist` | Phong cấp user thành artist |
| PATCH | `/admin/artists/:id` | Sửa bio + displayName |

### Quản lý album
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/albums` | Danh sách album |
| GET | `/admin/albums/:id` | Chi tiết album + bài hát |
| POST | `/admin/albums` | Tạo album mới |
| PATCH | `/admin/albums/:id` | Sửa thông tin |
| DELETE | `/admin/albums/:id` | Xóa (songs set albumId=null) |
| POST | `/admin/albums/:id/songs` | Thêm bài hát vào album |
| DELETE | `/admin/albums/:id/songs/:songId` | Xóa bài khỏi album |

### Quản lý playlist chính thức
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/playlists` | Danh sách playlist (userId=null, isSystem=false) |
| GET | `/admin/playlists/:id` | Chi tiết + bài hát |
| POST | `/admin/playlists` | Tạo playlist |
| PATCH | `/admin/playlists/:id` | Sửa tên/cover |
| DELETE | `/admin/playlists/:id` | Xóa |
| POST | `/admin/playlists/:id/songs` | Thêm bài |
| DELETE | `/admin/playlists/:id/songs/:songId` | Xóa bài |

### Quản lý người dùng
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/users` | Danh sách user, lọc role/search |
| GET | `/admin/users/:id` | Chi tiết: profile + play history + behavior stats |
| PATCH | `/admin/users/:id/status` | Ban/unban |
| PATCH | `/admin/users/:id/role` | Đổi vai trò (tự tạo Artist profile nếu promote) |
| GET | `/admin/stats` | Tổng quan platform |

### Analytics
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/analytics/overview` | Tổng hợp 30d/7d plays, users mới, tổng doanh thu |
| GET | `/admin/analytics/top-songs` | Top bài hát theo lượt nghe (`?period=30&limit=10`) |
| GET | `/admin/analytics/top-artists` | Top nghệ sĩ (`?period=30&limit=10`) |
| GET | `/admin/analytics/plays` | Lượt nghe theo ngày (`?days=30`) |
| GET | `/admin/analytics/new-users` | User mới theo ngày (`?days=30`) |

### Donations
| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/donations` | Danh sách giao dịch, lọc status |
| GET | `/admin/donations/stats` | Thống kê doanh thu theo status/method/top artists |

---

## Files backend

| File | Nội dung |
|------|---------|
| `admin.service.js` | Moderation, user management, getUserDetail, updateUserRole |
| `admin.content.service.js` | Songs/Artists/Albums/Playlists management |
| `admin.analytics.service.js` | Analytics queries + Donations |
| `admin.controller.js` | HTTP handlers (import 3 services) |
| `admin.routes.js` | Tất cả routes |

---

## Frontend

### Layout
- `AdminLayout.jsx` — Sidebar riêng với 5 nhóm nav, không có PlayerBar
- `PlayerBarWrapper` trong `App.jsx` — tự ẩn khi ở `/admin/*`

### Routes
| Route | Trang |
|-------|-------|
| `/admin` | Duyệt bài hát (PendingSongsPage) |
| `/admin/songs` | Quản lý bài hát + preview + sửa inline |
| `/admin/artists` | Quản lý nghệ sĩ + phong cấp user |
| `/admin/albums` | Quản lý album + thêm/xóa bài hát |
| `/admin/playlists` | Playlist chính thức + quản lý bài hát |
| `/admin/users` | Danh sách user + thay đổi role inline |
| `/admin/users/:id` | Chi tiết user + play history + ban/role |
| `/admin/analytics` | Top songs/artists + biểu đồ lượt nghe + user mới |
| `/admin/donations` | Danh sách giao dịch + thống kê doanh thu |
| `/admin/stats` | Tổng quan số lượng |

### Features nổi bật
- **Preview nhạc**: Click ▶ → gọi `/player/stream/:id` → play inline `<audio>` tag
- **Sửa bài hát inline**: Mở form ngay trong table row
- **Bar chart**: Lượt nghe và user mới theo ngày (CSS Tailwind, không cần chart lib)
- **Role change inline**: Dropdown trực tiếp trong bảng user
- **Phong cấp artist**: Chọn user từ dropdown → tự động tạo Artist record + đổi role
