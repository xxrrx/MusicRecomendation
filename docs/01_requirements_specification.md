# 01 — Requirements & Specification
**Dự án:** Online Music Streaming System with AI Personalization
**Thị trường:** Việt Nam
**Phạm vi:** Web Application (Local Deployment)
**Phiên bản tài liệu:** 1.0
**Ngày:** 2026-03-28

---

## 1. Tổng Quan Hệ Thống

Hệ thống streaming nhạc trực tuyến cho phép người dùng nghe nhạc, khám phá nội dung, và nhận gợi ý âm nhạc được cá nhân hóa bởi AI. Nghệ sĩ có thể tự upload và quản lý nội dung. Admin kiểm duyệt nội dung trước khi xuất bản.

---

## 2. Vai Trò Người Dùng (User Roles)

| Vai trò | Mô tả |
|--------|-------|
| **Guest** | Người dùng chưa đăng nhập. Có thể nghe nhạc và xem thông tin công khai nhưng không có tính năng cá nhân hóa |
| **User** | Người dùng đã đăng ký. Có đầy đủ tính năng: playlist, liked songs, AI recommendations, follow artist, donate |
| **Artist** | Tài khoản nghệ sĩ. Có thể upload nhạc, quản lý bài hát của mình, xem thống kê lượt nghe, nhận donate |
| **Admin** | Quản trị viên hệ thống. Duyệt nội dung, quản lý user, xem analytics toàn hệ thống |

---

## 3. Functional Requirements

### 3.1 Authentication & User Account

| ID | Yêu cầu | Vai trò |
|----|---------|---------|
| AUTH-01 | Đăng ký tài khoản User bằng email + password | Guest |
| AUTH-02 | Đăng ký tài khoản Artist (quy trình riêng biệt) | Guest |
| AUTH-03 | Đăng nhập / Đăng xuất | User, Artist, Admin |
| AUTH-04 | Gửi email xác nhận tài khoản sau khi đăng ký | Hệ thống |
| AUTH-05 | Quản lý hồ sơ cá nhân (avatar, tên hiển thị, bio) | User, Artist |
| AUTH-06 | Onboarding chọn sở thích âm nhạc khi đăng ký lần đầu | User mới |

> **Onboarding flow:** Sau khi xác nhận email, User mới được dẫn qua một loạt câu hỏi để xác định sở thích (thể loại nhạc, nghệ sĩ yêu thích, mood...). Dữ liệu này là input khởi đầu cho AI recommendation.

---

### 3.2 Music Player

| ID | Yêu cầu |
|----|---------|
| PLAY-01 | Stream nhạc trực tuyến (không hỗ trợ offline/download) |
| PLAY-02 | Chất lượng âm thanh cố định: 128kbps |
| PLAY-03 | Các nút điều khiển cơ bản: Play, Pause, Next, Previous, Seek |
| PLAY-04 | Chế độ Shuffle (ngẫu nhiên) và Repeat (lặp 1 bài / lặp playlist) |
| PLAY-05 | Điều chỉnh âm lượng |
| PLAY-06 | Hiển thị lyrics đồng bộ theo thời gian thực (synced LRC format) |
| PLAY-07 | Tính năng Crossfade giữa các bài hát |
| PLAY-08 | Equalizer tùy chỉnh âm thanh |
| PLAY-09 | Sleep Timer (tự dừng nhạc sau X phút) |
| PLAY-10 | Tính năng Radio: tự động phát nhạc tương tự bài đang nghe (xem mục 3.6) |

> **Ghi chú Lyrics:** File lyrics lưu dạng synced LRC (`.lrc`) — format chuẩn có timestamp theo từng dòng, hỗ trợ highlight đúng dòng lời theo tiến trình bài hát.

---

### 3.3 Thư Viện & Nội Dung

| ID | Yêu cầu |
|----|---------|
| LIB-01 | Trang thông tin bài hát (tên, nghệ sĩ, album, thể loại, năm, thời lượng, lượt nghe) |
| LIB-02 | Trang thông tin nghệ sĩ (bio, ảnh, danh sách bài hát, tổng lượt nghe) |
| LIB-03 | Trang thông tin album (bìa, danh sách bài hát) |
| LIB-04 | Hiển thị lượt nghe cho từng bài hát (công khai với tất cả người dùng) |

---

### 3.4 Playlist & Liked Songs

| ID | Yêu cầu | Vai trò |
|----|---------|---------|
| PL-01 | User tạo, đặt tên, chỉnh sửa, xóa playlist cá nhân | User |
| PL-02 | Thêm / xóa bài hát khỏi playlist | User |
| PL-03 | Tính năng "Liked Songs" — thư viện yêu thích cá nhân | User |
| PL-04 | Hệ thống tự động tạo playlist BXH (Top Charts) theo ngày / tuần / tháng | Hệ thống |
| PL-05 | Không hỗ trợ collaborative playlist | — |

---

### 3.5 Tìm Kiếm & Khám Phá

| ID | Yêu cầu |
|----|---------|
| SEARCH-01 | Tìm kiếm theo: tên bài hát, tên nghệ sĩ, tên album, thể loại |
| SEARCH-02 | Kết quả tìm kiếm phân nhóm rõ ràng (Bài hát / Nghệ sĩ / Album) |
| SEARCH-03 | Trang BXH (Charts): hiển thị top bài hát theo ngày / tuần / tháng |

---

### 3.6 AI & Personalization

#### Dữ liệu hành vi thu thập (phục vụ AI)

| Loại dữ liệu | Chi tiết |
|--------------|---------|
| Lịch sử nghe | Bài nào được nghe, thời điểm nghe |
| Hành vi tương tác | Like, Dislike (feedback trực tiếp) |
| Hành vi skip | Bài bị skip sớm (< 30 giây) |
| Thời gian nghe | Nghe được bao nhiêu % bài hát |
| Sở thích onboarding | Dữ liệu từ bước chọn sở thích ban đầu |
| Follow Artist | Nghệ sĩ user đang follow |

#### Tính năng AI

| ID | Tính năng | Mô tả |
|----|-----------|-------|
| AI-01 | **Homepage Personalization** | Trang chủ hiển thị mục "Gợi ý cho bạn" dựa trên lịch sử nghe và sở thích. User A hay nghe Indie → ưu tiên nghệ sĩ Indie. User B hay nghe V-Pop → ưu tiên V-Pop |
| AI-02 | **Radio Thông Minh** | Từ 1 bài hát, tự phát các bài tương tự dựa trên: thể loại, BPM, mood của bài đang nghe + sở thích cá nhân của user. Ví dụ: đang nghe ballad V-Pop → Radio phát tiếp ballad V-Pop user từng thích |
| AI-03 | **User Feedback** | Nút "Không thích" để user loại bỏ thể loại / nghệ sĩ khỏi gợi ý — AI cập nhật preference |
| AI-04 | **Onboarding Cold Start** | Với user mới chưa có lịch sử, dùng dữ liệu onboarding để khởi tạo recommendation profile ban đầu |

#### Hướng tiếp cận AI đề xuất

| Phương pháp | Ứng dụng |
|------------|---------|
| **Content-based Filtering** | Gợi ý bài hát dựa trên đặc trưng metadata (genre, BPM, mood, key) của những bài user đã thích |
| **Collaborative Filtering** | Gợi ý dựa trên hành vi của những user có sở thích tương tự |
| **Hybrid Approach** | Kết hợp cả hai — Content-based cho cold start, dần chuyển sang Collaborative khi có đủ dữ liệu |

---

### 3.7 Tính Năng Xã Hội

| ID | Yêu cầu | Vai trò |
|----|---------|---------|
| SOC-01 | Follow / Unfollow Artist | User |
| SOC-02 | Xem danh sách Artist đang follow | User |
| SOC-03 | Không có follow user khác, không có activity feed, không chia sẻ mạng xã hội ngoài | — |

---

### 3.8 Donate / Tip cho Artist

| ID | Yêu cầu |
|----|---------|
| DON-01 | User có thể donate/tip tiền trực tiếp cho Artist |
| DON-02 | Hỗ trợ thanh toán qua **VNPay** (thị trường Việt Nam) |
| DON-03 | Hỗ trợ thanh toán qua **Stripe** (thẻ quốc tế) |
| DON-04 | Hiển thị lịch sử donate cho User |
| DON-05 | Artist xem được tổng số tiền nhận được |

---

### 3.9 Artist Dashboard

| ID | Yêu cầu |
|----|---------|
| ART-01 | Artist đăng ký tài khoản riêng biệt (không dùng tài khoản User thông thường) |
| ART-02 | Upload bài hát kèm metadata: tên, album, thể loại, năm, BPM, mood, key, file nhạc, file lyrics (.lrc), ảnh bìa |
| ART-03 | Bài hát upload xong ở trạng thái **"Chờ duyệt"** — chưa hiển thị lên hệ thống |
| ART-04 | Sau khi Admin duyệt → bài hát chuyển sang **"Đã xuất bản"** và hiển thị công khai |
| ART-05 | Artist quản lý danh sách bài hát của mình (xem, chỉnh sửa metadata, gỡ xuống) |
| ART-06 | Artist xem thống kê: lượt nghe từng bài, tổng lượt nghe, lượt nghe theo thời gian |
| ART-07 | Artist xem tổng số tiền nhận được từ donate |

---

### 3.10 Admin Panel

| ID | Yêu cầu |
|----|---------|
| ADM-01 | Xem danh sách bài hát đang **"Chờ duyệt"** từ Artist |
| ADM-02 | Duyệt (Approve) hoặc Từ chối (Reject) bài hát kèm lý do |
| ADM-03 | Quản lý User: xem danh sách, khoá / mở khoá tài khoản |
| ADM-04 | Quản lý Artist: xem danh sách, khoá / mở khoá tài khoản |
| ADM-05 | Xoá bài hát vi phạm khỏi hệ thống |
| ADM-06 | Dashboard analytics: tổng số user, tổng lượt nghe, bài hát phổ biến nhất, nghệ sĩ nổi bật |
| ADM-07 | Admin **không** có chức năng upload nhạc trực tiếp |

---

### 3.11 Notifications

| ID | Yêu cầu |
|----|---------|
| NOTIF-01 | Gửi email xác nhận khi đăng ký tài khoản thành công |
| NOTIF-02 | Gửi email thông báo kết quả duyệt bài hát cho Artist (Approved / Rejected + lý do) |
| NOTIF-03 | Không có push notification trên trình duyệt |

---

## 4. Non-Functional Requirements

| Hạng mục | Yêu cầu |
|---------|---------|
| **Quy mô** | ~100 người dùng đồng thời (dự án cá nhân, lưu hành nội bộ) |
| **Deployment** | Chạy trên máy local, không yêu cầu uptime SLA |
| **Nền tảng** | Web Application — không có Mobile App |
| **Ngôn ngữ giao diện** | Tiếng Việt là chính |
| **Thị trường** | Việt Nam |
| **Bảo mật** | Xác thực JWT, HTTPS, mã hoá password (bcrypt) |
| **Lưu trữ file** | Audio files lưu trên AWS S3 |
| **Compliance** | Không yêu cầu tuân thủ GDPR / PDPA |
| **Audio quality** | 128kbps MP3 (1 mức cố định) |
| **Offline** | Không hỗ trợ |

---

## 5. Luồng Nghiệp Vụ Quan Trọng

### 5.1 Luồng Upload Nhạc (Artist)
```
Artist upload bài hát + metadata
        ↓
Trạng thái: "Chờ duyệt" (không hiển thị công khai)
        ↓
Admin nhận thông báo → Xem xét nội dung
        ↓
     [Duyệt]              [Từ chối]
        ↓                     ↓
Trạng thái: "Đã xuất bản"   Email thông báo lý do → Artist
Hiển thị lên hệ thống
```

### 5.2 Luồng Onboarding User Mới
```
Đăng ký email + password
        ↓
Xác nhận email (click link trong mail)
        ↓
Onboarding: trả lời bộ câu hỏi sở thích
(thể loại yêu thích, nghệ sĩ yêu thích, mood...)
        ↓
Hệ thống tạo AI preference profile ban đầu
        ↓
Chuyển đến Homepage với gợi ý cá nhân hóa
```

### 5.3 Luồng Donate
```
User vào trang Artist → Nhấn "Donate"
        ↓
Nhập số tiền
        ↓
Chọn phương thức: VNPay / Stripe
        ↓
Xử lý thanh toán (redirect sang cổng)
        ↓
Kết quả: Thành công / Thất bại
        ↓
Cập nhật số dư donate hiển thị trên Artist dashboard
```

---

## 6. Out of Scope (Ngoài phạm vi)

- Nghe nhạc offline / download
- Gói Premium / Subscription
- Mobile App (iOS / Android)
- Collaborative Playlist
- Chia sẻ lên mạng xã hội
- Push Notification trên trình duyệt
- Tính năng Browse / Khám phá theo mood / thời đại
- Follow giữa các User thông thường
- Livestream / Podcast
- Bản quyền âm nhạc thương mại (dự án nội bộ)
