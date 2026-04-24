# Module 8.1 — Donation (Stripe + VNPay)

**Status:** ✅ COMPLETED (2026-04-24)

---

## Tổng quan

Tích hợp thanh toán hai cổng: **Stripe** (card quốc tế) và **VNPay** (ví điện tử Việt Nam). User donate tiền trực tiếp cho Artist; backend cập nhật `artist.totalEarnings` ngay khi thanh toán thành công.

---

## Backend API

Mount tại `/api/donations`. Tất cả endpoints yêu cầu `authenticate`.

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/donations/initiate` | Tạo PaymentIntent (Stripe) hoặc redirect URL (VNPay) |
| POST | `/donations/confirm` | Verify Stripe PaymentIntent sau khi frontend confirm |
| GET | `/donations/vnpay-return` | VNPay redirect về, verify HMAC, cập nhật DB, redirect frontend |
| GET | `/donations/history` | Lịch sử donate của user (paginated) |

---

## Files đã tạo / sửa

### Backend
| File | Mô tả |
|------|-------|
| `backend/src/modules/donation/donation.service.js` | Logic Stripe + VNPay + history |
| `backend/src/modules/donation/donation.controller.js` | Handler 4 endpoints |
| `backend/src/modules/donation/donation.routes.js` | Router với authenticate middleware |
| `backend/src/modules/donation/donation.validator.js` | Validate input với express-validator |
| `backend/src/app.js` | Thêm `app.use('/api/donations', ...)` |
| `backend/.env` | Điền Stripe keys + VNPay credentials |

### Frontend
| File | Mô tả |
|------|-------|
| `frontend/src/lib/donationApi.js` | API calls: initiate, confirm, history |
| `frontend/src/pages/DonatePage.jsx` | Form donate: chọn amount + gateway + Stripe Elements |
| `frontend/src/pages/DonationResultPage.jsx` | Trang kết quả success/failed |
| `frontend/src/pages/ArtistPage.jsx` | Thêm nút "💖 Donate" → `/donate/:id` |
| `frontend/src/App.jsx` | Thêm routes `/donate/:id` + `/donation-result` |
| `frontend/package.json` | Thêm `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| `frontend/.env` | `VITE_STRIPE_PUBLISHABLE_KEY` |

---

## Flow chi tiết

### Stripe Flow
```
User click Donate → DonatePage (chọn amount + Stripe)
→ POST /donations/initiate { artistId, amount, method: 'stripe' }
→ Backend: stripe.paymentIntents.create() → tạo Donation(status=pending)
→ Backend trả clientSecret + publishableKey
→ Frontend: stripe.confirmCardPayment(clientSecret, { card element })
→ Stripe xử lý → paymentIntent.status = 'succeeded'
→ POST /donations/confirm { paymentIntentId }
→ Backend: stripe.paymentIntents.retrieve() → verify succeeded
→ Prisma transaction: Donation(status=success) + Artist.totalEarnings += amount
→ Frontend redirect → /donation-result?status=success
```

### VNPay Flow
```
User click Donate → DonatePage (chọn amount + VNPay)
→ POST /donations/initiate { artistId, amount, method: 'vnpay' }
→ Backend: build vnpParams sorted, HMAC-SHA512 → tạo Donation(status=pending)
→ Backend trả paymentUrl
→ Frontend: window.location.href = paymentUrl
→ User thanh toán trên trang VNPay sandbox
→ VNPay redirect → GET /donations/vnpay-return?vnp_ResponseCode=00&...
→ Backend: verify HMAC-SHA512 (loại bỏ vnp_SecureHash khỏi params trước khi hash)
→ Nếu ResponseCode=00: Prisma transaction: Donation(success) + Artist.totalEarnings += amount
→ Backend redirect → frontend/donation-result?status=success
→ Nếu thất bại: Donation(failed) → redirect?status=failed
```

---

## Env vars cần thiết

### backend/.env
```env
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
VNP_TMN_CODE=YOUR_VNP_TMN_CODE
VNP_SECURE_SECRET=YOUR_VNP_SECURE_SECRET
VNP_HOST=https://sandbox.vnpayment.vn
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080/api
```

### frontend/.env
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51TPTCvFCSCfDri6wAtNGQPgSUBwLbywLZOBeAyHOoncWSpQZ8TzehkAeAibSmiPM7qmJ9A9a7rVE4P83XQV90iG000V2kqyMoR
```

---

## Hướng dẫn test

### Chuẩn bị

1. **Cài dependencies frontend** (nếu chưa):
   ```bash
   cd frontend && npm install
   ```

2. **Khởi động services:**
   ```bash
   docker-compose up -d postgres redis
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

3. **Login bằng tài khoản user** (không phải admin/artist) để test donate.

---

### Test 1 — Giao diện nút Donate trên ArtistPage

1. Vào `/artists/:id` (bất kỳ artist nào)
2. Kiểm tra nút **💖 Donate** xuất hiện cạnh nút Follow
3. Click → được redirect sang `/donate/:id`

---

### Test 2 — Stripe (sandbox)

1. Vào trang Donate, chọn số tiền (VD: 50,000₫), chọn **Stripe**
2. Nhập thẻ test của Stripe:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** bất kỳ ngày tương lai (VD: `12/28`)
   - **CVC:** bất kỳ 3 số (VD: `123`)
   - **ZIP:** `10000`
3. Click nút Donate
4. Kết quả mong đợi: chuyển sang `/donation-result?status=success`

**Verify DB:**
```sql
SELECT * FROM "Donation" ORDER BY "createdAt" DESC LIMIT 1;
-- status phải là 'success', completedAt không null

SELECT "totalEarnings" FROM "Artist" WHERE id = '<artistId>';
-- totalEarnings phải tăng đúng số tiền đã donate
```

**Test thẻ thất bại:**
- Card number: `4000 0000 0000 0002` → declined
- Kết quả: hiển thị lỗi, Donation record status = 'pending' (chưa confirm)

---

### Test 3 — VNPay (sandbox)

1. Chọn **VNPay**, nhập số tiền, click Thanh toán
2. Được redirect sang trang sandbox VNPay (`sandbox.vnpayment.vn`)
3. Trên trang VNPay sandbox, chọn **"Ngân hàng NCB"** (hoặc bất kỳ)
4. Nhập thông tin test:
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
   - **OTP:** `123456`
5. Xác nhận → VNPay redirect về backend `/api/donations/vnpay-return`
6. Backend verify → redirect frontend `/donation-result?status=success`

**Nếu không thể test VNPay sandbox trực tiếp** (cần IP public), test bằng curl:
```bash
# Simulate VNPay return với signature hợp lệ
# Lấy orderId từ DB sau khi initiate
curl "http://localhost:8080/api/donations/vnpay-return?\
vnp_Amount=5000000\
&vnp_BankCode=NCB\
&vnp_OrderInfo=Donate+cho+artist+xxx\
&vnp_ResponseCode=00\
&vnp_TmnCode=X46YN0AK\
&vnp_TxnRef=<orderId>\
&vnp_SecureHash=<hash>"
```
> Lưu ý: Hash phải đúng. Dùng script nhỏ để tính nếu cần.

---

### Test 4 — Lịch sử donate

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/donations/history
```

Kết quả mong đợi:
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "...", "amount": "50000", "status": "success", "artist": { "displayName": "..." } }],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### Test 5 — Validation

```bash
# Thiếu artistId
curl -X POST http://localhost:8080/api/donations/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "method": "stripe"}'
# → 422 VALIDATION_ERROR

# amount quá nhỏ
curl -X POST http://localhost:8080/api/donations/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"artistId": "<id>", "amount": 100, "method": "stripe"}'
# → 422: amount must be at least 1000 VND

# method không hợp lệ
curl -X POST http://localhost:8080/api/donations/initiate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"artistId": "<id>", "amount": 50000, "method": "paypal"}'
# → 422: method must be stripe or vnpay
```

---

## Lưu ý triển khai Production

- **VNPay:** `BACKEND_URL` phải là domain public (VNPay cần callback URL có thể truy cập từ internet). Sandbox chấp nhận `localhost` chỉ nếu test từ cùng máy.
- **Stripe:** Thay `sk_test_` → `sk_live_` và `pk_test_` → `pk_live_` khi go live.
- **Idempotency:** Donation record được tạo khi `initiate`, không tạo lại khi `confirm`. Nếu confirm gọi 2 lần, check `status === 'success'` trước để bỏ qua.
