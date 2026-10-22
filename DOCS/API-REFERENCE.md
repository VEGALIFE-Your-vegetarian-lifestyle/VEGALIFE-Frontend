# API Reference — VEGALIFE

Đặc tả đầy đủ từng endpoint của backend VEGALIFE: method, path, quyền, tham số,
request body, response schema, mã lỗi và business rule.

**Cập nhật:** 2026-10-15 · 28 nhóm · 71 mục (có mục chưa có API)

> **File này là gì:** đặc tả *backend*. Muốn biết frontend đã gọi endpoint nào, còn
> thiếu gì → xem [`API-COVERAGE.md`](./API-COVERAGE.md). Muốn biết endpoint nào có test
> → xem [`TEST-COVERAGE.md`](./TEST-COVERAGE.md).

## Quy ước chung

- **Base URL (dev):** `https://vegalife-backend.onrender.com` — Vite proxy `/api` sang đây.
- **Wrapper:** mọi response (trừ IPN VNPay) bọc trong `{ success, message, data }`.
  Lỗi cũng cùng envelope, `success: false`, `data: null`.
- **Phân trang:** `PageResponse` = `{ content, page, size, totalElements, totalPages, first, last }`.
  `page` **0-based**, `size` tối đa 100.
- **JWT:** header `Authorization: Bearer <access_token>`. Access token sống 15 phút,
  refresh token 7 ngày, không rotate.
- **Kiểu trong tài liệu:** `uuid`, `str`, `int`, `n` (number), `ISO` (ISO-8601 datetime),
  `date` (`YYYY-MM-DD`), `object`, `string[]|absent` (field vắng hẳn khỏi JSON khi chưa set).

**Bảng quyền**

| Ký hiệu | Nghĩa |
|---|---|
| `Public` | Không cần JWT. Gửi token hỏng/hết hạn vẫn bị 401 |
| `JWT (optional)` | Chạy được ẩn danh; có token hợp lệ thì trả thêm dữ liệu riêng của caller |
| `JWT` | Bắt buộc đăng nhập |
| `JWT (ADMIN)` | Bắt buộc đăng nhập **và** `role === "ADMIN"` |

> Số thứ tự mục dưới đây giữ nguyên theo tài liệu gốc. Tài liệu gốc dùng trùng số `29`
> (Search và Tạo bình luận) và `35` (My posts và My videos) — giữ nguyên để không phá
> tham chiếu chéo.

## Mục lục

| # | Method | Path | Quyền | Tên |
|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | Public | Đăng ký tài khoản |
| 2 | POST | `/api/auth/verify-email` | Public | Xác minh email (OTP) |
| 3 | POST | `/api/auth/resend-email` | Public | Gửi lại mã xác minh |
| 4 | POST | `/api/auth/login` | Public | Đăng nhập |
| 5 | POST | `/api/auth/refresh` | Public | Làm mới access token |
| 6 | POST | `/api/auth/logout` | JWT | Đăng xuất |
| 7 | POST | `/api/auth/forgot-password` | Public | Yêu cầu mã đặt lại mật khẩu |
| 8 | POST | `/api/auth/verify-password-reset` | Public | Xác minh mã OTP đặt lại |
| 9 | POST | `/api/auth/reset-password` | Public | Đặt lại mật khẩu |
| 10 | GET | `/api/profile` | JWT | Lấy hồ sơ của chính mình |
| 11 | GET | `/api/profile/{userId}` | Public | Lấy hồ sơ thành viên khác |
| 12 | PUT | `/api/profile` | JWT | Cập nhật hồ sơ cá nhân |
| 13 | GET | `/api/admin/users` | JWT (ADMIN) | Danh sách tài khoản |
| 14 | POST | `/api/admin/users/{userId}/suspend` | JWT (ADMIN) | Tạm khóa tài khoản |
| 15 | POST | `/api/admin/users/{userId}/restore` | JWT (ADMIN) | Khôi phục tài khoản |
| 16 | POST | `/api/admin/categories` | JWT (ADMIN) | Tạo danh mục |
| 17 | PATCH | `/api/admin/categories/{categoryId}` | JWT (ADMIN) | Sửa danh mục |
| 18 | DELETE | `/api/admin/categories/{categoryId}` | JWT (ADMIN) | Xóa danh mục (retire) |
| 19 | GET | `/api/categories` | Public | Danh sách danh mục đang hoạt động |
| 20 | GET | `/api/admin/posts` | JWT (ADMIN) | Danh sách tất cả bài viết |
| 21 | PATCH | `/api/posts/{postId}/visibility` | JWT (ADMIN) | Ẩn / bỏ ẩn bài viết |
| 22 | POST | `/api/admin/posts/{postId}/moderate` | JWT (ADMIN) | Duyệt (publish/unpublish) bài viết |
| 23 | GET | `/api/admin/videos` | JWT (ADMIN) | Danh sách tất cả video |
| 24 | GET | `/api/admin/recipes` | JWT (ADMIN) | Danh sách tất cả công thức |
| 25 | GET | `/api/admin/comments` | JWT (ADMIN) | Danh sách tất cả bình luận |
| 26 | GET | `/api/admin/payments` | JWT (ADMIN) | Danh sách tất cả thanh toán |
| 27 | GET | `/api/posts/feed` | Public | Bảng tin toàn hệ thống |
| 28 | GET | `/api/posts/{postId}` | Public | Xem một bài viết |
| 29 | — | — | — | Search — **chưa có API** |
| 29 | POST | `/api/posts/{postId}/comments` | JWT | Tạo bình luận / trả lời |
| 30 | GET | `/api/posts/{postId}/comments` | Public | Xem danh sách bình luận |
| 31 | PATCH | `/api/posts/{postId}/comments/{commentId}` | JWT | Sửa nội dung bình luận |
| 32 | DELETE | `/api/posts/{postId}/comments/{commentId}` | JWT | Xóa bình luận (soft delete) |
| 33 | PUT | `/api/posts/{postId}/votes` | JWT | Bỏ / đổi / xóa vote |
| 34 | GET | `/api/posts/{postId}/votes` | Public | Đọc số vote của bài viết |
| 35 | GET | `/api/posts` | JWT | Danh sách bài viết của tôi |
| 36 | GET | `/api/users/{userId}/posts` | JWT (optional) | Danh sách bài viết của thành viên khác |
| 37 | DELETE | `/api/posts/{postId}` | JWT | Xóa bài viết (soft delete) |
| 35 | — | — | — | My videos — **chưa có API** |
| 38 | POST | `/api/recipes` | JWT | Tạo công thức |
| 39 | GET | `/api/dishes` | JWT | Danh sách món ăn (autocomplete) |
| 40 | GET | `/api/ingredients` | JWT | Danh sách nguyên liệu (autocomplete) |
| 41 | POST | `/api/posts` | JWT | Tạo bài viết |
| 42 | PATCH | `/api/posts/{postId}` | JWT | Chỉnh sửa bài viết |
| 43 | POST | `/api/media/upload` | JWT | Tạo upload grant (bước 1 upload media) |
| 44 | POST | `/api/media/{mediaId}/confirm` | JWT | Xác nhận upload (bước 2) |
| 45 | GET | `/api/media/{mediaId}` | JWT | Đọc bản ghi media |
| 46 | DELETE | `/api/media/{mediaId}` | JWT | Xóa media (soft delete) |
| 65 | POST | `/api/posts/{postId}/media` | JWT | Gán / thay toàn bộ media của bài viết |
| 66 | POST | `/api/posts/{postId}/recipes` | JWT | Gán / thay toàn bộ công thức của bài viết |
| 67 | GET | `/api/locations/nearby` | JWT | Danh sách địa điểm theo bán kính |
| 68 | GET | `/api/locations` | JWT | Danh sách địa điểm gợi ý (bộ lọc) |
| 47 | POST | `/api/ai/messages` | JWT | Gửi tin nhắn chat (JSON) |
| 48 | POST | `/api/ai/messages/stream` | JWT | Gửi tin nhắn chat (SSE stream) |
| 49 | GET | `/api/ai/conversations` | JWT | Danh sách hội thoại AI |
| 50 | GET | `/api/ai/conversations/{id}` | JWT | Chi tiết một hội thoại AI |
| 51 | GET | `/api/subscriptions` | Public | Danh sách gói AI |
| 52 | GET | `/api/subscriptions/me` | JWT | Gói AI của tôi |
| 53 | GET | `/api/subscriptions/me/history` | JWT | Lịch sử gói AI của tôi |
| 54 | POST | `/api/subscriptions/me/cancel` | JWT | Hủy gói AI (ngay lập tức) |
| 55 | POST | `/api/subscriptions/me/purchase/eligibility` | JWT | Kiểm tra điều kiện mua gói |
| 56 | POST | `/api/payments/checkout` | JWT | Bắt đầu thanh toán VNPay |
| 57 | GET/POST | `/api/payments/vnpay/ipn` | Public | Webhook VNPay (IPN) |
| 58 | GET | `/api/payments` | JWT | Lịch sử thanh toán của tôi |
| 59 | GET | `/api/payments/{paymentId}` | JWT | Trạng thái một thanh toán |
| 60 | GET | `/api/menus` | JWT | Danh sách thực đơn tuần của tôi |
| 61 | GET | `/api/menus/details` | JWT | Thực đơn chi tiết theo khoảng ngày |
| 62 | POST | `/api/menus` | JWT | Tạo thực đơn tuần (draft) |
| 63 | PATCH | `/api/menus/{menuId}` | JWT | Sửa thực đơn |
| 64 | POST | `/api/menus/{menuId}/status` | JWT | Đổi trạng thái thực đơn |
| 69 | POST | `/api/admin/locations` | JWT (ADMIN) | Tạo địa điểm |
| 70 | PATCH | `/api/admin/locations/{locationId}` | JWT (ADMIN) | Sửa địa điểm (partial) |
| 71 | DELETE | `/api/admin/locations/{locationId}` | JWT (ADMIN) | Xóa mềm địa điểm |

---

## 1. Register

### 1. Đăng ký tài khoản

`POST /api/auth/register` · **Public** · `Content-Type: application/json`

**Request**

```json
{
  "username": "string (3-50, unique)",
  "email": "string (valid, ≤100, unique)",
  "password": "string (8-100)",
  "confirmPassword": "string (bắt buộc == password)"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "userId": "uuid", "username": "string", "email": "string" }
}
```

**Lỗi**

```
400 Validation failed
400 Fields must be equal
409 Email already registered
409 Username already taken
500 Internal server error
```

**Ghi chú** — Gửi OTP 6 số qua email (10 phút, gửi async — lỗi SMTP không làm fail đăng
ký). Bước tiếp: verify-email.

### 2. Xác minh email (OTP)

`POST /api/auth/verify-email` · **Public** · `Content-Type: application/json`

**Request**

```json
{
  "email": "string",
  "otp": "string (đúng 6 chữ số)"
}
```

**Response** `200 OK` — idempotent: đã verify rồi vẫn 200, không consume OTP.

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": { "userId": "uuid", "username": "string", "email": "string" }
}
```

**Lỗi**

```
400 Validation failed
400 Invalid or already used verification code
400 Verification code has expired. Please request a new one.
```

**Ghi chú** — Kích hoạt tài khoản (BR-AUTH-003). OTP 6 số, 10 phút, dùng 1 lần, lưu SHA-256.

### 3. Gửi lại mã xác minh

`POST /api/auth/resend-email` · **Public** · `Content-Type: application/json`

**Request**

```json
{ "email": "string" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "If an account with that email exists, a verification code has been sent",
  "data": null
}
```

**Lỗi**

```
400 Validation failed
500 Internal server error
```

**Ghi chú** — Anti-enumeration: response giống hệt cho email không tồn tại / đã verify.
Gọi lại sẽ hủy OTP cũ chưa dùng.

## 2. Login

### 4. Đăng nhập

`POST /api/auth/login` · **Public** · `Content-Type: application/json`

**Request**

```json
{
  "identifier": "string (email hoặc username)",
  "password": "string"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "uuid",
    "username": "string",
    "email": "string",
    "accessToken": "JWT (15 phút)",
    "refreshToken": "opaque (7 ngày)",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**Lỗi**

```
400 Validation failed
400 Invalid email/username or password
400 Email not verified. Please verify your email before logging in.
400 Account is suspended
400 Account is not active
500 Internal server error
```

**Ghi chú** — Lỗi business của login đều map về HTTP **400** (không phải 401/403).
FE lưu `accessToken` + `refreshToken`.

### 5. Làm mới access token

`POST /api/auth/refresh` · **Public** · `Content-Type: application/json`

**Request**

```json
{ "refreshToken": "string (từ login)" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": { "accessToken": "string", "tokenType": "Bearer", "expiresIn": 900 }
}
```

**Lỗi**

```
400 Validation failed
400 Refresh token is required
400 Invalid refresh token
400 Refresh token has expired
400 Refresh token has been revoked
400 Account is not active
```

**Ghi chú** — Refresh token **không rotate** (vẫn dùng lại token cũ). FE gọi khi access
token hết hạn.

### 6. Đăng xuất

`POST /api/auth/logout` · **JWT**

**Request** — body rỗng `{}`; token lấy từ header.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Lỗi**

```
401 Invalid or expired access token
401 Access token has been revoked
500 Internal server error
```

**Ghi chú** — Logout luôn thu hồi refresh token **và** blacklist access token hiện tại
(ngay cả khi refresh token đã hết hạn).

## 3. Forgot password

### 7. Yêu cầu mã đặt lại mật khẩu

`POST /api/auth/forgot-password` · **Public** · `Content-Type: application/json`

**Request**

```json
{ "email": "string" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset code has been sent",
  "data": null
}
```

**Lỗi**

```
400 Validation failed
500 Internal server error
```

**Ghi chú** — Anti-enumeration: 200 chung cho email có/không tồn tại. OTP 6 số, 10 phút,
gọi lại hủy OTP cũ.

### 8. Xác minh mã OTP

`POST /api/auth/verify-password-reset` · **Public** · `Content-Type: application/json`

**Request**

```json
{
  "email": "string",
  "otp": "string (^\\d{6}$)"
}
```

**Response** `200 OK` — đánh dấu `verified_at`; verify lại vẫn 200 (idempotent).

```json
{
  "success": true,
  "message": "Password reset code verified successfully",
  "data": null
}
```

**Lỗi**

```
400 Validation failed
400 Password reset code has expired. Please request a new one.
400 Invalid or already used password reset code
```

**Ghi chú** — Bước 1/2 của reset 2 bước: mới verify, **CHƯA** đổi mật khẩu, OTP chưa bị
consume.

### 9. Đặt lại mật khẩu

`POST /api/auth/reset-password` · **Public** · `Content-Type: application/json`

> Body **KHÔNG** còn field `otp`.

**Request**

```json
{
  "email": "string",
  "newPassword": "string (8-100)"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Password has been reset successfully",
  "data": null
}
```

**Lỗi**

```
400 Validation failed
400 Password reset code has expired. Please request a new one.
400 Invalid or already used password reset code
500 Internal server error
```

**Ghi chú** — Bước 2/2: consume OTP (1 lần), hash mật khẩu mới, thu hồi **TOÀN BỘ**
refresh token → các session khác phải đăng nhập lại. Bắt buộc gọi `verify-password-reset`
trước.

## 4. User profile management

### 10. Lấy hồ sơ của chính mình

`GET /api/profile` · **JWT**

Không có body — `userId` lấy từ JWT.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": "uuid",
    "username": "str",
    "email": "str",
    "heightCm": "number|null",
    "weightKg": "number|null",
    "bmi": "number|null",
    "age": "int|null",
    "gender": "male|female|other|null",
    "description": "str|null",
    "avatarUrl": "str|null",
    "preferences": "string[]|absent",
    "dislikes": "string[]|absent",
    "allergies": "string[]|absent",
    "restrictions": "string[]|absent",
    "healthGoal": "string|absent",
    "updatedAt": "ISO"
  }
}
```

- `bmi` = `weightKg / (heightCm/100)^2`, làm tròn **1 số lẻ HALF_UP**, tính lúc đọc,
  **KHÔNG** lưu DB; `null` khi thiếu `heightCm` hoặc `weightKg`.
- 5 field dietary chưa set thì **KHÔNG xuất hiện** trong JSON (khác `null`).

**Lỗi**

```
401 Missing/invalid JWT ("Authentication required")
500 Internal server error
```

**Ghi chú** — Auto-tạo profile rỗng ở lần đọc đầu nếu chưa có (BR-PROFILE-003 mở rộng:
tạo cả khi read). 5 field dietary đi trên wire ở dạng **phẳng**, nhưng lưu chung một cột
JSONB `user_profile.dietary_preferences`. BMI tính lại mỗi lần đọc, không bao giờ lưu
(BR-PROFILE-001, BR-PROFILE-004).

### 11. Lấy hồ sơ thành viên khác

`GET /api/profile/{userId}` · **Public**

**Path:** `userId` (uuid).

**Response** `200 OK` — cùng shape `ProfileResponse` với `GET /api/profile`:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "userId": "uuid", "username": "str", "email": "str",
    "heightCm": "n|null", "weightKg": "n|null", "bmi": "n|null",
    "age": "int|null",
    "gender": "str|null", "description": "str|null", "avatarUrl": "str|null",
    "preferences": "string[]|absent", "dislikes": "string[]|absent",
    "allergies": "string[]|absent", "restrictions": "string[]|absent",
    "healthGoal": "string|absent", "updatedAt": "ISO"
  }
}
```

**Lỗi**

```
404 User not found
500 Internal server error
```

**Ghi chú** — Public (`permitAll`), không cần đăng nhập. Response chứa `email`
(trade-off được chấp nhận). Auto-tạo profile rỗng ở lần đọc đầu. 5 field dietary phẳng +
`bmi` tính tại chỗ (`null` khi thiếu height/weight, field chưa set thì vắng trong JSON).

### 12. Cập nhật hồ sơ cá nhân

`PUT /api/profile` · **JWT** · `Content-Type: application/json`

> **Partial update dù là `PUT`:** field không truyền thì **GIỮ NGUYÊN**. Không truyền
> field nào → 400. Cần **≥ 1 field** (một field dietary cũng tính).

**Request**

```json
{
  "heightCm": "number (0.01-300, tối đa 2 số lẻ, optional)",
  "weightKg": "number (0.01-500, tối đa 2 số lẻ, optional)",
  "age": "int (1-150, optional)",
  "gender": "male | female | other",
  "description": "string (≤2000)",
  "avatarUrl": "string (URL hợp lệ)",
  "preferences": "string[] — optional, tối đa 50 phần tử, mỗi phần tử ≤100 ký tự",
  "dislikes": "string[] — optional, giới hạn như trên",
  "allergies": "string[] — optional, giới hạn như trên",
  "restrictions": "string[] — optional, giới hạn như trên",
  "healthGoal": "string — optional, tối đa 200 ký tự"
}
```

**Lưu ý casing:** tên field là **camelCase** (`heightCm`, `weightKg`, `avatarUrl`) — cùng
casing với response, khác các endpoint khác trong hệ thống dùng snake_case.

**Response** `200 OK` — `data` cùng shape `ProfileResponse` với `GET /api/profile`.

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "uuid", "username": "str", "email": "str",
    "heightCm": "n|null", "weightKg": "n|null", "bmi": "n|null", "age": "int|null",
    "gender": "str|null", "description": "str|null", "avatarUrl": "str|null",
    "preferences": "string[]|absent", "dislikes": "string[]|absent",
    "allergies": "string[]|absent", "restrictions": "string[]|absent",
    "healthGoal": "string|absent", "updatedAt": "ISO"
  }
}
```

**Lỗi**

```
400 At least one profile field must be provided
400 Height must be between 0 and 300 cm
400 Height must have at most 2 decimal places
400 Weight must be between 0 and 500 kg
400 Weight must have at most 2 decimal places
400 Age must be between 1 and 150
400 Gender must be male, female, or other
400 Description must not exceed 2000 characters
400 Avatar URL must be a valid URL
400 Preferences must contain at most 50 entries
400 Each preference must not exceed 100 characters
    (tương tự dislikes / allergies / restrictions)
400 Health goal must not exceed 200 characters
401 Invalid or missing access token
```

**Ghi chú** — Auto-tạo profile nếu chưa có (BR-PROFILE-003); chỉ sửa được hồ sơ của
chính mình (BR-PROFILE-002). 5 field dietary gộp thành một cột JSONB nhưng wire vẫn phẳng;
merge theo từng member: **bỏ trống = giữ giá trị đã lưu**, **mảng rỗng = xóa**
(BR-PROFILE-001). Không nhận và không trả `bmi` — server tự tính lại từ `heightCm`/`weightKg`.

## 5. User accounts management (Admin)

### 13. Danh sách tài khoản

`GET /api/admin/users` · **JWT (ADMIN)**

**Query**

| Param | Mặc định | Ghi chú |
|---|---|---|
| `page` | `0` | **0-based** |
| `size` | `20` | tối đa 100 |
| `sort` | `createdAt,desc` | |
| `status` | — | `created\|activated\|deactivated\|suspended` |
| `role` | — | `ADMIN\|USER` |
| `createdFrom` / `createdTo` | — | ISO-8601 |

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "email": "str", "username": "str",
        "role": "ADMIN|USER", "status": "str", "createdAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
401 Unauthorized
403 Forbidden (đã đăng nhập nhưng không phải ADMIN)
500 Internal server error
```

**Ghi chú** — ADMIN-only (`@PreAuthorize`, ADR-009 — không còn rule `/api/admin/**`).
Loại user đã soft-delete. Không có tham số tìm kiếm — muốn search phải lọc ở client.

### 14. Tạm khóa tài khoản

`POST /api/admin/users/{userId}/suspend` · **JWT (ADMIN)**

**Path:** `userId` (uuid). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": { "id": "uuid", "email": "str", "username": "str",
            "role": "str", "status": "suspended", "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed
401 Unauthorized
403 Forbidden
404 User not found
409 User is already suspended
500 Internal server error
```

**Ghi chú** — Thu hồi toàn bộ refresh token; access token cũ bị từ chối ở request kế tiếp.
Không lưu lý do tạm khóa (version này).

### 15. Khôi phục tài khoản

`POST /api/admin/users/{userId}/restore` · **JWT (ADMIN)**

**Path:** `userId` (uuid — đang ở trạng thái `suspended`). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "User restored successfully",
  "data": { "id": "uuid", "email": "str", "username": "str",
            "role": "str", "status": "activated", "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed
401 Unauthorized
403 Forbidden
404 User not found
409 User is not suspended
500 Internal server error
```

**Ghi chú** — Chỉ user đang `suspended` mới restore được; `created`/`activated`/`deactivated`
→ 409. Trạng thái đích **luôn** là `activated`.

## 6. Category management (Admin)

### 16. Tạo danh mục

`POST /api/admin/categories` · **JWT (ADMIN)** · `Content-Type: application/json`

**Request**

```json
{
  "name": "string (bắt buộc, trim, ≤100, unique case-insensitive)",
  "description": "string (optional, blank → null)"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { "id": "uuid", "name": "str", "description": "str|null", "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed (name blank/over 100)
401 Unauthorized
403 Forbidden (không phải ADMIN)
409 Category name already exists (active, case-insensitive)
500 Internal server error
```

**Ghi chú** — BR-ADMIN-003: chỉ ADMIN. Unique scoped cho danh mục đang active
(chưa soft-delete).

### 17. Sửa danh mục

`PATCH /api/admin/categories/{categoryId}` · **JWT (ADMIN)** · `Content-Type: application/json`

**Path:** `categoryId` (uuid).

**Request** — PATCH một phần: bỏ trống/null giữ nguyên. Cần **≥ 1 field**.

```json
{
  "name": "string (≤100, unique)",
  "description": "string (\"\" để xóa về null)"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { "id": "uuid", "name": "str", "description": "str|null", "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed (không field nào, name blank/>100)
401 Unauthorized
403 Forbidden
404 Category not found (không có / đã soft-delete)
409 Category name already exists
500 Internal server error
```

**Ghi chú** — Description **không** clear được bằng `null` — gửi `""` để xóa. Unique loại
trừ chính category đang sửa.

### 18. Xóa danh mục (retire)

`DELETE /api/admin/categories/{categoryId}` · **JWT (ADMIN)**

**Path:** `categoryId` (uuid). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null
}
```

**Lỗi**

```
401 Unauthorized
403 Forbidden
404 Category not found (không có / đã retire)
500 Internal server error
```

**Ghi chú** — Soft delete (set `deleted_at`) — bài viết đã gắn category vẫn giữ tham chiếu;
category retired không gán được cho bài mới/sửa. Xóa lại → 404 (**không** idempotent),
giống `DELETE /api/posts/{postId}`.

## 7. Content categories (public)

### 19. Danh sách danh mục đang hoạt động

`GET /api/categories` · **Public**

**Query**

| Param | Mặc định | Ghi chú |
|---|---|---|
| `page` | `0` | 0-based |
| `size` | `20` | tối đa 100 |
| `sort` | `name,asc` | |
| `name` | — | substring, case-insensitive |

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "name": "str", "description": "str|null", "createdAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page/size ngoài khoảng, sort sai format)
500 Internal server error
```

**Ghi chú** — Public, không cần JWT. Category đã retire (soft-delete) **không bao giờ**
xuất hiện. `name` khớp substring.

## 8. Post moderation (Admin)

### 20. Danh sách tất cả bài viết

`GET /api/admin/posts` · **JWT (ADMIN)**

**Query**

| Param | Mặc định | Ghi chú |
|---|---|---|
| `page` | `0` | 0-based |
| `size` | `20` | tối đa 100 |
| `sort` | `createdAt,desc` | `createdAt\|publishedAt\|updatedAt\|viewCount\|title` |
| `status` | — | `created\|processed\|published\|unpublished\|hidden` |
| `flag` | `NEEDS_REVIEW` | `PENDING\|PASSED\|REJECTED\|NEEDS_REVIEW\|all` |
| `userId` / `categoryId` | — | uuid |
| `createdFrom` / `createdTo` | — | ISO-8601 |

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "title": "str", "content": "str", "featuredImageUrl": "str|null",
        "categoryIds": ["uuid"], "mediaIds": ["uuid"],
        "status": "created|processed|published|unpublished|hidden",
        "flag": "PENDING|PASSED|REJECTED|NEEDS_REVIEW|null",
        "viewCount": "int", "publishedAt": "ISO|null", "createdAt": "ISO",
        "userId": "uuid", "username": "str", "email": "str" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (sort/status/flag/date sai, createdFrom>createdTo, size>100)
401 Unauthorized
403 Forbidden (không phải ADMIN)
500 Internal server error
```

**Ghi chú** — ADMIN-only (`@PreAuthorize`, ADR-009). Không giới hạn `status` (khác
`GET /api/posts`). Loại bài soft-delete. Mặc định `flag=NEEDS_REVIEW` để admin thấy bài
chờ duyệt; `flag=all` bỏ hẳn filter flag. `content` giữ để duyệt (issue #101). `status` đã
bỏ `'flagged'` (ADR-011) — bài filter fail là `status=unpublished` + flag
`REJECTED`/`NEEDS_REVIEW`.

### 21. Ẩn / bỏ ẩn bài viết

`PATCH /api/posts/{postId}/visibility` · **JWT (ADMIN)** · `Content-Type: application/json`

**Request**

```json
{ "hidden": "boolean — true = ẩn, false = bỏ ẩn" }
```

**Response** `200 OK` — `PostListResponse` với status mới.
`message` = `"Post is visible again"` khi `hidden=false`.

```json
{
  "success": true,
  "message": "Post hidden successfully",
  "data": { "id": "uuid", "status": "hidden", "publishedAt": null }
}
```

**Lỗi**

```
400 Validation failed / Post is not hidden
401 Unauthorized
403 Forbidden (không phải ADMIN)
404 Post not found
500 Internal server error
```

**Ghi chú** — Ẩn → `status=hidden` + xóa `publishedAt`; bỏ ẩn → về `created` (private
draft, chủ post phải tự đăng lại). Mọi thay đổi ghi `moderation_log`
(`HIDE_POST`/`UNHIDE_POST`).

### 22. Duyệt (publish/unpublish) bài viết

`POST /api/admin/posts/{postId}/moderate` · **JWT (ADMIN)** · `Content-Type: application/json`

**Path:** `postId` (uuid).

**Request**

```json
{
  "action": "PUBLISH | UNPUBLISH (bắt buộc)",
  "reason": "string (optional, ≤1000 — lưu vào moderation_log)"
}
```

**Response** `200 OK` — `AdminPostListResponse`; `flag` **KHÔNG đổi**.

```json
{
  "success": true,
  "message": "Post published successfully | Post unpublished successfully",
  "data": { "id": "uuid", "title": "str", "status": "published|unpublished",
            "flag": "str|null", "publishedAt": "ISO|null", "createdAt": "ISO",
            "userId": "uuid", "username": "str", "email": "str" }
}
```

**Lỗi**

```
400 Validation failed
400 At least one category is required to publish a post
400 A hidden post is moderated through the visibility endpoint
401 Unauthorized
403 Forbidden (không phải ADMIN)
404 Post not found
500 Internal server error
```

**Ghi chú** — BR-POST-012, BR-ADMIN-002. `PUBLISH` → `status=published` + `publishedAt=now`
(cần ≥1 category); `UNPUBLISH` → `status=unpublished` + xóa `publishedAt`. `flag` (verdict
filter) **GIỮ NGUYÊN** (ADR-011). Post `hidden` không duyệt ở đây (dùng `/visibility`).
Đã đúng status đích = no-op 200, **KHÔNG** ghi log. Mỗi thay đổi thật ghi `moderation_log`
`PUBLISH_POST`/`UNPUBLISH_POST` kèm `reason`.

## 9. Video moderation (Admin)

### 23. Danh sách tất cả video

`GET /api/admin/videos` · **JWT (ADMIN)**

**Query:** `page` (0-based), `size` (≤100), `sort` (`createdAt,desc` — cũng nhận
`updatedAt|durationSeconds|fileSizeBytes`), `status` (`uploading|succeed|failed`),
`userId`, `createdFrom`, `createdTo`.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Videos retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "mediaUrl": "str|null", "thumbnailUrl": "str|null",
        "description": "str|null", "status": "uploading|succeed|failed",
        "durationSeconds": "int|null", "fileSizeBytes": "int|null", "mimeType": "str",
        "width": "int|null", "height": "int|null", "externalId": "str|null",
        "createdAt": "ISO", "updatedAt": "ISO",
        "userId": "uuid|null", "username": "str|null", "email": "str|null",
        "posts": [{ "id": "uuid", "title": "str", "status": "str" }] }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (sort/status/date sai, createdFrom>createdTo, size>100)
401 Unauthorized
403 Forbidden
500 Internal server error
```

**Ghi chú** — ADMIN-only. Chỉ row chưa soft-delete; chỉ MIME video (bỏ qua `image/*`).
Mọi upload state (kể cả `uploading`/`failed`) đều hiện để thấy upload bỏ dở/hỏng.

## 10. Recipe moderation (Admin)

### 24. Danh sách tất cả công thức

`GET /api/admin/recipes` · **JWT (ADMIN)**

**Query:** `page` (0-based), `size` (≤100), `sort` (`createdAt,desc` — cũng nhận
`updatedAt|name`), `userId`, `categoryId`, `createdFrom`, `createdTo`.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Recipes retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "name": "str", "description": "str|null", "instructions": "str",
        "prepTimeMinutes": "int|null", "cookTimeMinutes": "int|null", "servings": "int",
        "difficulty": "EASY|MEDIUM|HARD|null", "status": "ACTIVE|DELETED",
        "dishId": "uuid", "dishName": "str|null", "categoryIds": ["uuid"],
        "ingredients": [
          { "ingredientId": "uuid", "name": "str", "amount": "n", "unit": "str" }
        ],
        "createdAt": "ISO", "updatedAt": "ISO",
        "userId": "uuid", "username": "str", "email": "str" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (sort/date sai, createdFrom>createdTo, size>100)
401 Unauthorized
403 Forbidden
500 Internal server error
```

**Ghi chú** — ADMIN-only. Recipe soft-delete **VẪN** được liệt kê với `status=DELETED`
(derived, không lưu cột). Không có filter `status`. `categoryId` resolve qua
`post_recipe → post_category`.

## 11. Comment moderation (Admin)

### 25. Danh sách tất cả bình luận

`GET /api/admin/comments` · **JWT (ADMIN)**

**Query:** `page` (0-based), `size` (≤100), `sort` (`createdAt,desc` — cũng nhận
`updatedAt`), `status` (`active|removed`), `userId`, `postId`, `createdFrom`, `createdTo`.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "postId": "uuid", "parentId": "uuid|null",
        "userId": "uuid", "username": "str", "content": "str",
        "status": "active|removed", "createdAt": "ISO", "updatedAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation message (status sai, sort không allowlist, UUID sai, createdFrom>createdTo)
401 Unauthorized
403 Forbidden
500 Internal server error
```

**Ghi chú** — ADMIN-only. `status` derive từ `deleted_at`. **Không** có value `"all"` —
bỏ trống param để lấy cả hai. `parentId` trả thô, không resolve thread.

## 12. Payment / subscription moderation (Admin)

### 26. Danh sách tất cả thanh toán

`GET /api/admin/payments` · **JWT (ADMIN)**

**Query:** `page` (0-based), `size` (≤100), `userId`,
`status` (`pending|succeeded|failed|refunded`), `createdFrom`, `createdTo`.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "userId": "uuid", "amount": "n", "currency": "VND",
        "status": "str", "provider": "vnpay", "txnRef": "str",
        "paidAt": "ISO|null", "createdAt": "ISO",
        "subscription": { "id": "uuid", "status": "str",
                          "startedAt": "ISO", "renewalDate": "ISO" },
        "plan": { "code": "str", "name": "str", "monthlyRequestLimit": "int",
                  "price": { "amount": "n", "currency": "VND" } } }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

`subscription` và `plan` có thể là `null`.

**Lỗi**

```
400 Validation failed (filter/page/size sai)
401 Unauthorized
403 Forbidden (không phải ADMIN)
500 An unexpected error occurred
```

**Ghi chú** — ADMIN-only — counterpart của `GET /api/payments`, thêm `userId` mỗi row.
Pure ledger read, không gọi gateway. Sắp xếp `createdAt` desc.

## 13. Home feeds

### 27. Bảng tin toàn hệ thống

`GET /api/posts/feed` · **JWT (optional)**

**Query:** `page` (mặc định 0), `size` (mặc định 20, **1-100**).

**Response** `200 OK` — `PageResponse<PostListResponse>`

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "content": [{ "id": "uuid", "title": "str", "status": "published" }],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0
  }
}
```

**Lỗi**

```
400 Validation failed (page/size ngoài khoảng)
401 Unauthorized (có gửi token nhưng invalid)
500 Internal server error
```

**Ghi chú** — Public (`permitAll`) — guest đọc được. Chỉ bài `published`, chưa xóa. Sort
**cố định** `published_at DESC, created_at DESC` — không có param `sort`/`category`/`keyword`.

## 14. Post detail

### 28. Xem một bài viết

`GET /api/posts/{postId}` · **Public**

**Path:** `postId` (uuid). Không có body.

> Không cần JWT — nhưng nếu **gửi** token sai/hết hạn thì vẫn 401.

**Response** `200 OK` — `PostListResponse`

```json
{
  "success": true,
  "message": "Post retrieved successfully",
  "data": {
    "id": "uuid", "title": "str", "rawContent": "object", "featuredImageUrl": "str|null",
    "categoryIds": ["uuid"], "mediaIds": ["uuid"], "status": "str",
    "flag": "PENDING|PASSED|REJECTED|NEEDS_REVIEW|null",
    "viewCount": "int", "publishedAt": "ISO|null", "createdAt": "ISO"
  }
}
```

**Lỗi**

```
401 token gửi lên nhưng invalid/expired hoặc account inactive
404 Post not found (không tồn tại / đã soft-delete)
500 Internal server error
```

**Ghi chú** — Public (`permitAll`) — guest đọc được. Visibility **CHỈ** theo
`deleted_at IS NULL` (BR-POST-011): **KHÔNG** check `status` lẫn ownership, nên bài
draft/unpublished/hidden — kể cả của người khác — vẫn trả về. Id không tồn tại và bài đã
xóa đều 404 giống nhau (không leak tồn tại). **Không** tăng `viewCount`.

## 15. Search

### 29. Tìm kiếm — **chưa có API**

Chưa có endpoint trong `docs/apis`. FE hiện lọc client-side trên feed.

## 16. Comment component

> **Số `29` bị dùng hai lần** trong tài liệu gốc (Search + Tạo bình luận). Giữ nguyên.

### 29. Tạo bình luận / trả lời

`POST /api/posts/{postId}/comments` · **JWT** · `Content-Type: application/json`

**Path:** `postId` (uuid — bài phải `published`).

> **KHÔNG** gửi `userId`/`postId` (server lấy từ JWT + path).

**Request**

```json
{
  "content": "string (bắt buộc, không blank)",
  "parentId": "uuid|null — optional; null = comment gốc, ngược lại là reply dưới comment đó (có thể reply lồng)"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": { "id": "uuid", "postId": "uuid", "parentId": "uuid|null",
            "userId": "uuid", "content": "str",
            "createdAt": "ISO", "updatedAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed (content blank, field sai, UUID sai)
401 Unauthorized
404 Post not found (bài không có / đã xóa / chưa published)
404 Parent comment not found (comment cha không có / đã removed / khác bài)
500 Internal server error
```

**Ghi chú** — BR-COMMENT-001: cần đăng nhập. Chỉ bài `published` chưa xóa nhận comment.
Comment cha phải `active` và cùng bài; reply có thể có reply.

### 30. Xem danh sách bình luận

`GET /api/posts/{postId}/comments` · **Public**

**Path:** `postId` (uuid).
**Query:** `page` (mặc định 0, ≥0), `size` (mặc định 20, 1-100).

**Response** `200 OK` — `PageResponse<CommentResponse>`

```json
{
  "success": true,
  "message": "Comments retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "userId": "uuid", "username": "str",
        "avatarUrl": "str|null", "content": "str", "edited": "bool", "deleted": "bool",
        "createdAt": "ISO", "updatedAt": "ISO",
        "replies": ["{ ...cùng shape, lồng đệ quy }"] }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page/size sai, postId không phải uuid)
404 Post not found (bài chưa đăng / đã xóa)
500 Internal server error
```

**Ghi chú** — Public, không cần đăng nhập (BR-COMMENT-001). Phân trang theo **BÌNH LUẬN
GỐC**; mỗi gốc mang trọn subtree `replies` của nó (`replies` **không** phân trang). Bình
luận đã xóa hiển thị placeholder `"[deleted]"` với author `null` nhưng `replies` vẫn giữ
chỗ (BR-COMMENT-003). `avatarUrl` null khi user chưa có profile.

### 31. Sửa nội dung bình luận

`PATCH /api/posts/{postId}/comments/{commentId}` · **JWT** · `Content-Type: application/json`

> **KHÔNG** gửi `userId` / `postId` / `commentId` / `edited` (server tự suy ra).

**Request**

```json
{ "content": "string — bắt buộc, không được rỗng" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": { "id": "uuid", "postId": "uuid", "parentId": "uuid|null",
            "userId": "uuid", "content": "str", "edited": true,
            "createdAt": "ISO", "updatedAt": "ISO" }
}
```

`edited = true` sau lần sửa đầu tiên và giữ nguyên mãi.

**Lỗi**

```
400 Validation failed (content rỗng, uuid sai)
401 Unauthorized
403 Forbidden (không phải chủ bình luận)
404 Comment not found (đã xóa, hoặc thuộc postId khác)
500 Internal server error
```

**Ghi chú** — Chỉ **CHỦ** bình luận được sửa — Admin cũng **không** có quyền sửa bình luận
của người khác (BR-COMMENT-002). Không giới hạn thời gian tính từ `createdAt`. Sửa không
đổi `parentId`/`postId`/`userId`; cờ `edited` do server quản lý.

### 32. Xóa bình luận (soft delete)

`DELETE /api/posts/{postId}/comments/{commentId}` · **JWT**

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Comment deleted successfully",
  "data": null
}
```

**Lỗi**

```
401 Unauthorized
404 Comment not found (không tồn tại, đã xóa, hoặc thuộc postId khác;
     người thường xóa comment của người khác cũng nhận 404)
500 Internal server error
```

**Ghi chú** — Soft delete: chỉ set `deleted_at`, giữ nguyên row; replies không bị ảnh
hưởng và vẫn trỏ về nó qua `parent_id` nên bố cục thread giữ nguyên. Người thường xóa
comment của người khác nhận **404 thay vì 403** để không lộ sự tồn tại. Admin xóa comment
của người khác → ghi `moderation_log` (`DELETE_COMMENT`, BR-ADMIN-002); Admin xóa bình
luận của chính mình thì không ghi.

## 17. Vote component

### 33. Bỏ / đổi / xóa vote

`PUT /api/posts/{postId}/votes` · **JWT** · `Content-Type: application/json`

**Request**

```json
{ "voteType": "UPVOTE | DOWNVOTE — bắt buộc" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": { "postId": "uuid", "likeCount": "int", "dislikeCount": "int",
            "userVote": "UPVOTE|DOWNVOTE|null" }
}
```

`userVote = null` khi lời gọi vừa gỡ vote của caller.

**Lỗi**

```
400 Validation failed / Malformed request body (thiếu voteType hoặc sai giá trị)
401 Unauthorized
404 Post not found (bài chưa đăng / đã xóa)
500 Internal server error
```

**Ghi chú** — Mỗi user chỉ 1 vote mỗi bài, toggle giữa 3 trạng thái (BR-VOTE-001): gửi
**trùng** type với vote hiện tại → **GỠ** vote; gửi type **khác** → **CHUYỂN** vote. Chỉ
bài đã đăng, chưa xóa mới vote được. Không hỗ trợ vote bình luận (issue #45 non-goal).

### 34. Đọc số vote của bài viết

`GET /api/posts/{postId}/votes` · **Public**

Có thể gửi kèm `Authorization: Bearer` để biết `userVote` của chính mình.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Votes retrieved successfully",
  "data": { "postId": "uuid", "likeCount": "int", "dislikeCount": "int",
            "userVote": "UPVOTE|DOWNVOTE|null" }
}
```

`userVote = null` khi caller chưa đăng nhập / ẩn danh.

**Lỗi**

```
401 Unauthorized (đã gửi token nhưng sai/hết hạn — route không cần token,
     nhưng JWT filter vẫn reject token hỏng)
404 Post not found (bài chưa đăng / đã xóa)
500 Internal server error
```

**Ghi chú** — Public (BR-VOTE-002): đếm vote **KHÔNG** cần đăng nhập. Chỉ khi có token hợp
lệ mới trả về `userVote` của người gọi. Cùng visibility với `PUT`: chỉ bài đã đăng, chưa xóa.

## 18. My posts

### 35. Danh sách bài viết của tôi

`GET /api/posts` · **JWT**

**Query:** `page` (mặc định 0, ≥0), `size` (mặc định 20, 1-100).

**Response** `200 OK` — `PageResponse<PostListResponse>`

```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "title": "str", "rawContent": "object",
        "featuredImageUrl": "str|null", "categoryIds": ["uuid"], "mediaIds": ["uuid"],
        "status": "created|processed|published|unpublished|hidden",
        "flag": "PENDING|PASSED|REJECTED|NEEDS_REVIEW|null",
        "viewCount": "int", "publishedAt": "ISO|null", "createdAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page <0 hoặc size ngoài 1-100)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Chỉ trả bài của chính user trong JWT (**không** nhận `userId` từ query). Mọi
`status` đều trả về (kể cả draft/unpublished) để chủ bài quản lý; sắp xếp `createdAt` giảm
dần, không đổi được. `flag` = trạng thái content filter: `null` (chưa từng filter — draft
không vào hàng đợi), `PENDING`, `PASSED`, `REJECTED`, `NEEDS_REVIEW`. `type`/`videoUrl` đã
bỏ (V27/issue #101); dùng `rawContent`.

### 36. Danh sách bài viết của thành viên khác

`GET /api/users/{userId}/posts` · **JWT (optional)**

**Path:** `userId` (uuid).
**Query:** `page` (mặc định 0), `size` (mặc định 20, 1-100).

**Response** `200 OK` — cùng envelope với `GET /api/posts`
(`PageResponse<PostListResponse>`, message `"Posts retrieved successfully"`).

**Lỗi**

```
400 Validation failed (page/size ngoài khoảng)
401 Unauthorized (token gửi lên nhưng không hợp lệ)
404 User not found
500 Internal server error
```

**Ghi chú** — Public: khách/người khác chỉ thấy `status=published`; chủ bài & ADMIN thấy
mọi status. Sắp xếp `publishedAt` giảm dần (public) / `createdAt` giảm dần (owner/admin).

### 37. Xóa bài viết (soft delete)

`DELETE /api/posts/{postId}` · **JWT** (chủ bài hoặc role ADMIN)

**Path:** `postId` (uuid). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Post deleted successfully",
  "data": null
}
```

**Lỗi**

```
401 Unauthorized
404 Post not found (bài không tồn tại / đã xóa / không thuộc về caller)
500 Internal server error
```

**Ghi chú** — Xóa mềm (set `deleted_at`). Bài đã xóa không xuất hiện trong `GET /api/posts`.
Non-admin xóa bài của người khác → 404 (không tiết lộ tồn tại). Admin xóa ghi
`moderation_log` `DELETE_POST`.

## 19. My videos

### 35. Danh sách video của tôi — **chưa có API**

Chưa có endpoint trong `docs/apis`.

> **Số `35` bị dùng hai lần** trong tài liệu gốc (My posts + My videos). Giữ nguyên.

## 20. My favorite recipe

### 38. Tạo công thức

`POST /api/recipes` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "name": "string (bắt buộc, ≤255)",
  "dishName": "string (bắt buộc, ≤255, trim+lowercase)",
  "instructions": "string (bắt buộc)",
  "servings": "int (≥1)",
  "ingredients": [
    { "name": "str (≤100)", "amount": "number (>0, ≤3dp)", "unit": "str (≤30)" }
  ],
  "description": "string|null",
  "prepTimeMinutes": "int|null (≥0)",
  "cookTimeMinutes": "int|null (≥0)",
  "difficulty": "EASY|MEDIUM|HARD|null"
}
```

`ingredients`: 1-50 phần tử, `name` unique case-insensitive.

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "id": "uuid", "userId": "uuid", "dishId": "uuid", "dishName": "str (lowercased)",
    "name": "str", "description": "str|null", "instructions": "str",
    "prepTimeMinutes": "int|null", "cookTimeMinutes": "int|null", "servings": "int",
    "difficulty": "str|null",
    "ingredients": [
      { "ingredientId": "uuid", "name": "str (lowercased)", "amount": "n", "unit": "str" }
    ],
    "createdAt": "ISO", "updatedAt": "ISO"
  }
}
```

**Lỗi**

```
400 Validation failed / rule message (thiếu field, servings<1, amount<=0,
    difficulty sai, name/unit quá dài, ingredient trùng/empty/>50)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Owner luôn lấy từ JWT (BR-RECP-001). `dishName` & ingredient `name`
trim+lowercase rồi find-or-create shared row (BR-RECP-002). Unique case-insensitive
(migration V22). **KHÔNG** gửi `userId`/`dishId`/`id`/timestamps.

### 39. Danh sách món ăn (autocomplete)

`GET /api/dishes` · **JWT**

**Query:** `page` (mặc định 0), `size` (mặc định 20, 1-100), `sort` (`name,asc`),
`name` (substring, case-insensitive).

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Dishes retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "name": "str", "description": "str|null",
        "imageUrl": "str|null", "cuisineType": "str|null", "createdAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page/size ngoài khoảng, sort sai)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — **Yêu cầu JWT.** Dish retired (soft-delete) không xuất hiện, kể cả trong
`totalElements`. `name` unique case-insensitive. Read-only.

### 40. Danh sách nguyên liệu (autocomplete)

`GET /api/ingredients` · **JWT**

**Query:** `page` (mặc định 0), `size` (mặc định 20, 1-100), `sort` (`name,asc`),
`name` (substring, case-insensitive).

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Ingredients retrieved successfully",
  "data": {
    "content": [{ "id": "uuid", "name": "str", "createdAt": "ISO" }],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page<0 / size ngoài 1-100)
400 Sort must be in the form property,asc|desc
400 Sort property must not be blank
401 Unauthorized
500 Internal server error (sort trỏ property lạ)
```

**Ghi chú** — **Yêu cầu JWT** (khác `GET /api/categories`). Không trả nutrition columns.
Bảng `ingredient` không có `deleted_at` → liệt kê mọi row.

## 21. Create/edit post

### 41. Tạo bài viết

`POST /api/posts` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "title": "string (≤255, không blank)",
  "content": "string (bắt buộc, không blank — chỉ dùng làm input filter)",
  "rawContent": "object JSON (bắt buộc — tài liệu rich-text từ editor)",
  "featuredImageUrl": "string|null (optional)",
  "categoryIds": "[uuid] (bắt buộc khi publish=true; mọi category phải active)",
  "publish": "boolean (mặc định false — BR-POST-004)"
}
```

> **KHÔNG** gửi `userId`/`status`/`flag`/`viewCount`/`type`/`videoUrl`/`mediaId`/timestamps
> (server set).

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": { "id": "uuid", "title": "str", "rawContent": "object",
            "featuredImageUrl": "str|null", "status": "created",
            "flag": "PENDING|null", "viewCount": 0,
            "publishedAt": null, "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed (title blank/>255; content blank/missing;
    rawContent thiếu hoặc không phải JSON object; category unknown/inactive;
    publish=true mà không có category)
401 Unauthorized
404 User not found
500 Internal server error
```

**Ghi chú** — Status khởi tạo = `created`. `publish=true` **KHÔNG** đăng ngay: set
`flag=PENDING` và đẩy `CONTENT_FILTER` qua outbox, chỉ chuyển `published` khi filter trả
`PASSED` (BR-POST-004, BR-FILTER-004/005) — chạy async, endpoint không block
(BR-FILTER-006). Draft (`publish=false`) có `flag=null` vì chưa vào hàng đợi (BR-FILTER-007).
`content` là input filter; `rawContent` không bao giờ được filter đọc (V27/issue #101).

### 42. Chỉnh sửa bài viết

`PATCH /api/posts/{postId}` · **JWT** (chủ bài hoặc role ADMIN) · `Content-Type: application/json`

> `content` và `rawContent` **BẮT BUỘC** mỗi lần sửa; field còn lại bỏ trống/null giữ nguyên.

**Request**

```json
{
  "title": "str (≤255, không blank)",
  "content": "str (bắt buộc — input filter, không blank)",
  "rawContent": "object JSON (bắt buộc — tài liệu rich-text)",
  "featuredImageUrl": "str",
  "categoryIds": "[uuid] (thay toàn bộ list; mọi category phải active)",
  "publish": "boolean (true = đăng, false = về draft)"
}
```

**Response** `200 OK` — `PostListResponse` đã cập nhật (`id`, `title`, `rawContent`,
`featuredImageUrl`, `categoryIds`, `mediaIds`, `status`, `flag`, `viewCount`, `publishedAt`,
`createdAt`). `flag: null|PENDING|PASSED|REJECTED|NEEDS_REVIEW`.

**Lỗi**

```
400 Validation failed / thông báo rule cụ thể
    (content/rawContent thiếu hoặc sai; title sai; category unknown/inactive;
     publish thiếu category; non-admin sửa post đang hidden)
401 Unauthorized
404 Post not found (không có / soft-delete / của user khác với non-admin)
500 Internal server error
```

**Ghi chú** — Đăng bài yêu cầu ≥1 category active; published không được mất category cuối.
`publish=true` → `flag=PENDING` chờ filter (không đăng ngay); `publish=false` → status
`created` + xóa `publishedAt`, post đã unpublished giữ nguyên `flag` (BR-POST-007). Sửa
`title`/`content` của post đang published/unpublished → re-queue filter, `flag` về `PENDING`
(rawContent-only đổi thì không re-queue). `REJECTED`/`NEEDS_REVIEW` trả về owner dưới
`status=unpublished` (BR-POST-010, BR-FILTER-008). Admin sửa post của người khác ghi
`moderation_log` (BR-ADMIN-002).

### 43. Tạo upload grant (bước 1 upload media)

`POST /api/media/upload` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "contentType": "string (bắt buộc, phải trong allowlist)",
  "fileName": "string (optional, chỉ advisory)",
  "sizeBytes": "number (optional, check giới hạn)"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Upload grant created",
  "data": {
    "mediaId": "uuid", "status": "uploading", "expiresAt": "ISO",
    "upload": {
      "method": "POST", "url": "str", "headers": {},
      "fields": { "api_key": "str", "timestamp": "str", "signature": "str",
                  "public_id": "str", "max_file_size": "str", "allowed_formats": "str" }
    }
  }
}
```

**Lỗi**

```
400 Unsupported content type: <value>
400 File exceeds the 5 MB image limit / File exceeds the 50 MB limit
401 Unauthorized
403 Forbidden
404 User not found
500 Internal server error
```

**Ghi chú** — Trả URL + fields để FE POST thẳng file lên provider (Cloudinary).
`api-secret` **KHÔNG** bao giờ trả về. Grant có TTL.

### 44. Xác nhận upload (bước 2)

`POST /api/media/{mediaId}/confirm` · **JWT**

**Path:** `mediaId` (uuid). Body rỗng `{}` — **KHÔNG** gửi `mediaUrl`/`size`... backend tự
đọc lại từ provider.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Media upload confirmed",
  "data": { "mediaId": "uuid", "status": "succeed", "mediaUrl": "str",
            "thumbnailUrl": null, "description": null, "mimeType": "str",
            "fileSizeBytes": "n", "width": "n|null", "height": "n|null",
            "durationSeconds": "n|null", "createdAt": "ISO" }
}
```

**Lỗi**

```
400 Upload verification failed
400 File exceeds the 5 MB image limit / File exceeds the 50 MB limit
400 Upload grant has expired
401 Unauthorized
404 Media not found
409 Media upload has already been confirmed
500 Internal server error
```

**Ghi chú** — Chỉ khi `status=succeed` post mới được tham chiếu media. Confirm **đúng 1
lần** (BR-MEDIA-007); backend tin read-back từ provider (BR-MEDIA-008).

### 45. Đọc bản ghi media

`GET /api/media/{mediaId}` · **JWT**

**Path:** `mediaId` (uuid). Không có body.

**Response** `200 OK` — cùng shape với response confirm. Khi `status=uploading` thì
`mediaUrl`/`fileSizeBytes`/`mimeType`/`width`/`height`/`durationSeconds` = `null`.

**Lỗi**

```
401 Unauthorized
404 Media not found
500 Internal server error
```

**Ghi chú** — Dùng để check upload đã confirm chưa mà không phải gọi lại confirm. Chưa
kiểm quyền theo owner (mọi authenticated đều đọc được).

### 46. Xóa media (soft delete)

`DELETE /api/media/{mediaId}` · **JWT** (chủ media hoặc role ADMIN)

**Path:** `mediaId` (uuid). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Media deleted successfully",
  "data": null
}
```

**Lỗi**

```
401 Unauthorized
403 Forbidden (không phải uploaded_by, không phải ADMIN)
404 Media not found (row chưa từng tồn tại)
500 Internal server error
```

**Ghi chú** — Soft-delete (set `deleted_at`) + enqueue purge bất đồng bộ (không chờ
provider). **Idempotent**: gọi lại row đã soft-delete → 200, không enqueue purge lần 2.
`GET` row đã xóa → 404.

### 65. Gán / thay toàn bộ media của bài viết

`POST /api/posts/{postId}/media` · **JWT** (chủ bài viết hoặc Admin) · `Content-Type: application/json`

**Path:** `postId` (uuid, bắt buộc).

**Request**

```json
{
  "mediaIds": "[\"uuid\", ...] — bắt buộc (mảng, được rỗng); mỗi id phải là media đã upload xong (status = succeed), chưa xóa"
}
```

**Response** `200 OK` — trả về bài viết đã cập nhật (`PostListResponse`: `id`, `title`,
`rawContent`, `featuredImageUrl`, `categoryIds`, `mediaIds`, `recipeIds`, `status`, `flag`,
`viewCount`, `publishedAt`, `createdAt`).

```json
{
  "success": true,
  "message": "Media attached successfully",
  "data": { "id": "uuid", "mediaIds": ["..."], "recipeIds": [], "status": "created" }
}
```

**Lỗi**

```
400 Validation failed / One or more media do not exist, are deleted, or have not finished uploading
401 Unauthorized
404 Post not found (với non-admin: bài của người khác cũng ra 404)
500 Internal server error
```

**Ghi chú** — Issue #137. Thay **TOÀN BỘ** bộ media của bài: gọi lại cùng bộ là idempotent,
mảng rỗng = gỡ hết; **không ghi gì** nếu một id trong request không hợp lệ. Không đổi
`status`/`publishedAt`/`flag` của bài. Việc tạo media vẫn nằm ở `POST /api/media/upload` +
`POST /api/media/{mediaId}/confirm`.

### 66. Gán / thay toàn bộ công thức của bài viết

`POST /api/posts/{postId}/recipes` · **JWT** (chủ bài viết hoặc Admin) · `Content-Type: application/json`

**Path:** `postId` (uuid, bắt buộc).

**Request**

```json
{
  "recipeIds": "[\"uuid\", ...] — bắt buộc (mảng, được rỗng); mỗi id phải là công thức tồn tại, chưa xóa"
}
```

**Response** `200 OK` — trả về bài viết đã cập nhật (`PostListResponse`, như `/media`).

```json
{
  "success": true,
  "message": "Recipes attached successfully",
  "data": { "id": "uuid", "mediaIds": [], "recipeIds": ["..."], "status": "created" }
}
```

**Lỗi**

```
400 Validation failed / One or more recipes do not exist or are deleted
401 Unauthorized
404 Post not found (với non-admin: bài của người khác cũng ra 404)
500 Internal server error
```

**Ghi chú** — Issue #137. Cùng semantics với `/media`: thay toàn bộ bộ công thức của bài,
idempotent, mảng rỗng = gỡ hết. Không đổi `status`/`publishedAt`/`flag`. Tạo công thức vẫn
qua `POST /api/recipes`.

## 22. Nearby location

### 67. Danh sách địa điểm theo bán kính

`GET /api/locations/nearby` · **JWT**

**Query** — tất cả **bắt buộc**:

| Param | Kiểu | Ghi chú |
|---|---|---|
| `lat` | decimal | −90..90 — tâm tìm kiếm |
| `lng` | decimal | −180..180 |
| `radius` | decimal | > 0, đơn vị **mét** |

Không có request body. **Không** có `page`/`size` — trả hết trong một lần.

**Response** `200 OK` — `data` là **mảng phẳng**, KHÔNG phải page envelope.

```json
{
  "success": true,
  "message": "Nearby locations retrieved successfully",
  "data": [
    { "id": "uuid", "name": "string", "address": "string",
      "latitude": "decimal", "longitude": "decimal",
      "phoneNumber": "string|null",
      "placeType": "restaurant|grocery|cafe|market",
      "openingHours": "object|null", "websiteUrl": "string|null",
      "rating": "decimal|null", "priceLevel": "int|null",
      "distance": "decimal (mét, tính theo haversine, không lưu DB)" }
  ]
}
```

**Lỗi**

```
400 Validation failed (thiếu lat/lng/radius, sai khoảng, radius không dương)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Anh em của `GET /api/locations` (issue #10). Sắp xếp theo `distance` tăng dần;
pre-filter bounding-box trên `idx_location_coords`, không thêm PostGIS/Redis GEO. Không có
kết quả → mảng rỗng 200 (**không** 404). Không lọc rating/loại/giá/open-now, không phân
trang, không đọc toạ độ của user (issue #10 non-goals).

## 23. Location detail

### 68. Danh sách địa điểm gợi ý (bộ lọc)

`GET /api/locations` · **JWT**

**Query** — tất cả optional, lọc theo **AND**; filter không đặt thì không lọc:

| Param | Mặc định | Ghi chú |
|---|---|---|
| `page` | `0` | < 0 → 400 |
| `size` | `20` | 1..100 |
| `minRating` | — | decimal 0..5 — địa điểm **không có** rating luôn bị loại |
| `placeType` | — | `restaurant\|grocery\|cafe\|market` |
| `maxPriceLevel` | — | int 1..4 — địa điểm **không có** `priceLevel` luôn bị loại |
| `openNow` | `false` | `true` → soi `openingHours` theo giờ máy chủ |

Không có request body.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Locations retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "name": "string", "address": "string",
        "latitude": "decimal", "longitude": "decimal",
        "phoneNumber": "string|null", "placeType": "string",
        "openingHours": "object|null", "websiteUrl": "string|null",
        "rating": "decimal|null", "priceLevel": "int|null" }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true
  }
}
```

`createdAt` / `updatedAt` / `deletedAt` **không bao giờ** xuất hiện trong kết quả.

**Lỗi**

```
400 Validation failed (page/size/minRating/maxPriceLevel ngoài khoảng, placeType sai giá trị)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Feed gợi ý (issue #9): không embedding, không tìm kiếm ngữ nghĩa. Sắp xếp
`rating` giảm dần (chưa đánh giá xếp cuối), rồi `createdAt` tăng dần, rồi `id` tăng dần để
phân trang ổn định. `openNow=true` loại địa điểm không có giờ mở cửa hoặc không mở lúc hiện
tại. Không có kết quả → mảng rỗng 200, không 404. Tạo/sửa/xóa địa điểm nằm ở nhóm 28 (Admin).

## 24. AI Chatbot

### 47. Gửi tin nhắn chat (JSON)

`POST /api/ai/messages` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "conversationId": "uuid (optional — bỏ trống để tạo mới)",
  "message": "string (bắt buộc, 1..4000 ký tự)"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "conversationId": "uuid",
    "reply": "str (toàn bộ trả lời)",
    "usage": { "used": "long", "limit": "long",
               "windowStart": "ISO", "windowEnd": "ISO" }
  }
}
```

**Lỗi**

```
400 Validation failed (message thiếu/blank/>4000)
401 Unauthorized
404 Conversation not found (không tồn tại / của member khác)
429 Monthly AI request limit reached (used/limit). Resets at the start of the next UTC month.
    (+ header Retry-After, đơn vị giây)
500 Internal server error
502 AI provider request failed
```

**Ghi chú** — Quota gate **trước** khi gọi provider (BR-AI-001); chỉ reply thành công mới
tính quota (BR-AI-002). Context = profile + history hội thoại của mình. Window = tháng UTC
hiện tại (BR-SUBS-001). System prompt inline trong `AiChatService` (dùng chung cho JSON và
SSE): persona vegan/Vegalife-only, câu hỏi lệch chủ đề được từ chối lịch sự + gợi ý quay
lại chủ đề vegan/platform (BR-AI-006). Context gồm dietary 5 field + BMI lấy từ profile —
chỉ nêu field **đã có giá trị**, không suy diễn (BR-AI-004).

### 48. Gửi tin nhắn chat (SSE stream)

`POST /api/ai/messages/stream` · **JWT** · `Content-Type: application/json`

**Request** — cùng validation/ownership với `POST /api/ai/messages`.

```json
{
  "conversationId": "uuid (optional)",
  "message": "string (1..4000)"
}
```

**Response** `200 OK` — `Content-Type: text/event-stream`

```
event: delta
data: { "reply": "<fragment>" }                                  (0..n lần)

event: done
data: { "conversationId": "uuid", "reply": "str",
        "usage": { "used": ..., "limit": ..., "windowStart": ..., "windowEnd": ... } }  (1 lần)

event: error
data: { "message": "AI provider request failed" }
```

**Lỗi** — JSON body bình thường (**chưa** mở stream):

```
400 Validation failed
401 Unauthorized
404 Conversation not found
429 Monthly AI request limit reached ... (+ Retry-After)
500 Internal server error
```

Sau khi stream đã mở, lỗi đi qua event `error` — HTTP đã là 200.

**Ghi chú** — Cùng semantics quota/persistence với endpoint JSON. Lỗi provider giữa stream →
**không** persist history, **không** tăng usage. 400/404/429 trả về `ApiResponse` JSON thường
(không bắt đầu SSE). Dùng chung system prompt với `POST /api/ai/messages` (BR-AI-006,
BR-AI-004).

### 49. Danh sách hội thoại AI

`GET /api/ai/conversations` · **JWT**

Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Conversations retrieved",
  "data": [
    { "id": "uuid", "title": "str (từ message đầu, ≤60 ký tự)", "updatedAt": "ISO" }
  ]
}
```

**Lỗi**

```
401 Unauthorized
500 Internal server error
```

**Ghi chú** — BR-AI-003: ownership từ authentication — chỉ liệt kê row có `user_id` = caller.
Sắp xếp `updatedAt` giảm dần.

### 50. Chi tiết một hội thoại AI

`GET /api/ai/conversations/{id}` · **JWT**

**Path:** `id` (uuid — conversation id). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Conversation retrieved",
  "data": {
    "id": "uuid", "title": "str", "updatedAt": "ISO",
    "messages": [
      { "role": "user|assistant|system", "content": "str", "createdAt": "ISO" }
    ]
  }
}
```

`messages` là đầy đủ history, sắp **cũ → mới**.

**Lỗi**

```
401 Unauthorized
404 Conversation not found (không tồn tại HOẶC của member khác — không phân biệt)
500 Internal server error
```

**Ghi chú** — BR-AI-003: id lạ và id của member khác đều 404 để không xác nhận tồn tại hội
thoại không sở hữu. History sắp cũ → mới.

## 25. AI Subscription

### 51. Danh sách gói AI

`GET /api/subscriptions` · **Public**

Không có body — trả **plain array**, không phân trang.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": [
    { "code": "FREE", "name": "Free", "monthlyRequestLimit": 20,
      "price": { "amount": 0, "currency": "VND" } },
    { "code": "PRO", "name": "Pro", "monthlyRequestLimit": 500,
      "price": { "amount": 49000, "currency": "VND" } }
  ]
}
```

**Lỗi**

```
500 Internal server error (kể cả bảng ai_plan rỗng)
```

**Ghi chú** — Public (`permitAll`). Data từ `ai_plan`, sắp theo `sort_order`. Bỏ qua gói
`active=false`. Response là **array thường**, KHÔNG phải `PageResponse`.

### 52. Gói AI của tôi

`GET /api/subscriptions/me` · **JWT**

Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "tier": "FREE|PRO",
    "status": "active|cancelled|past_due",
    "renewalDate": "ISO|null",
    "usage": { "used": "int", "limit": "int",
               "periodStart": "ISO", "periodEnd": "ISO" },
    "currentPlan": { "code": "str", "name": "str", "monthlyRequestLimit": "int",
                     "price": { "amount": "n", "currency": "VND" } },
    "latestPayment": { "planCode": "str", "amount": "n", "currency": "str",
                       "status": "succeeded", "provider": "str|null",
                       "paidAt": "ISO" }
  }
}
```

`latestPayment` có thể là `null`.

**Lỗi**

```
401 Unauthorized
500 Internal server error (kể cả thiếu row FREE seed)
```

**Ghi chú** — Read-only (FR-008). Không có row `ai_subscription` → synth FREE từ `ai_plan`
code=`'FREE'` (`renewalDate=null`). `usage` = tháng UTC hiện tại. **KHÔNG** trả subscription
id / user id / ledger id / provider_reference.

### 53. Lịch sử gói AI của tôi

`GET /api/subscriptions/me/history` · **JWT**

**Query:** `page` (mặc định 0, ≥0), `size` (mặc định 20, 1-100).

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Subscription history retrieved successfully",
  "data": {
    "content": [
      { "planCode": "str", "planName": "str",
        "status": "active|past_due|scheduled|cancelled|expired",
        "startedAt": "ISO|null", "renewalDate": "ISO|null",
        "cancelledAt": "ISO|null", "createdAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 Validation failed (page<0 hoặc size ngoài 1-100)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Read-only. Mỗi purchase/extension = 1 row (BR-SUBS-004). Sắp theo `createdAt`
desc. Member chưa có row → 200 content rỗng (**không** 404). **KHÔNG** trả subscription id /
`extended_from_id` / user id.

### 54. Hủy gói AI (ngay lập tức)

`POST /api/subscriptions/me/cancel` · **JWT**

Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": { "status": "cancelled", "cancelledAt": "ISO" }
}
```

**Lỗi**

```
400 Validation failed
401 Unauthorized
409 Subscription already cancelled (không còn row in effect / gọi lần 2)
500 Internal server error
```

**Ghi chú** — BR-SUBS-005: hủy **tức thì**, cascade mọi row `scheduled` của member,
repeat-safe (409, no writes). Sau đó `GET /api/subscriptions/me` đọc ra `FREE`.

### 55. Kiểm tra điều kiện mua gói

`POST /api/subscriptions/me/purchase/eligibility` · **JWT** · `Content-Type: application/json`

**Request**

```json
{ "planCode": "string (bắt buộc, non-blank — key giống checkout)" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Purchase allowed",
  "data": { "allowed": true }
}
```

**Lỗi**

```
400 Validation failed (planCode thiếu/blank)
400 Plan is not active
400 Plan is not purchasable: price must be greater than zero
400 Plan is not purchasable: only VND plans can be purchased
401 Unauthorized
404 Plan not found
409 Cancel your current subscription before purchasing a different plan
409 A renewal is already scheduled for this plan
500 Internal server error
```

**Ghi chú** — Read-only (FR-007) — không tạo/sửa/xóa row. Chỉ **2** kết quả cho phép:
(1) không row in-effect → mua mới; (2) row in-effect **cùng** plan chưa có successor → gia
hạn. Còn lại 409 — body chính là tín hiệu `allowed=false`; **KHÔNG** có
`200 { allowed: false }`.

## 26. Payment (VNPay)

### 56. Bắt đầu thanh toán VNPay

`POST /api/payments/checkout` · **JWT** · `Content-Type: application/json`

**Request**

```json
{ "planCode": "string (bắt buộc, @NotBlank, match ai_plan.code case-sensitive)" }
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Payment session created",
  "data": {
    "paymentId": "uuid", "txnRef": "str (32 hex)",
    "planCode": "str", "amount": "n (VND)", "currency": "VND",
    "status": "pending", "paymentUrl": "str (đã ký)"
  }
}
```

**Lỗi**

```
400 Validation failed (planCode thiếu/blank)
400 Plan không purchasable (inactive / price=0 / không VND)
401 Unauthorized
404 Resource not found (không có ai_plan.code)
500 Internal server error (gateway chưa cấu hình)
```

**Ghi chú** — **Không** mutate `ai_subscription` — chỉ IPN ghi row (BR-PAY-001). Amount chốt
từ `ai_plan.price_amount`. Một pending/user+plan trong TTL (mặc định 30 phút) → tái dùng
`txnRef`. FREE/zero/non-VND không mua được (BR-PAY-009). Redirect về `return-url` +
`/{paymentId}`.

### 57. Webhook VNPay (IPN)

`GET|POST /api/payments/vnpay/ipn` · **Public** (`permitAll`, exact path — không wildcard)

**Query params (GET) hoặc form (POST):**

```
vnp_TmnCode, vnp_Amount (x100), vnp_BankCode, vnp_OrderInfo,
vnp_TransactionNo, vnp_ResponseCode, vnp_TransactionStatus,
vnp_TxnRef, vnp_CreateDate, vnp_PayDate,
vnp_SecureHashType=HMACSHA512, vnp_SecureHash (bắt buộc)
```

Không có JSON body.

**Response** `200 OK` — **KHÔNG** bọc `ApiResponse` (VNPay parse literal):

```json
{ "RspCode": "00", "Message": "Confirm Success" }
```

| RspCode | Nghĩa |
|---|---|
| `00` | Confirm Success |
| `01` | Order not Found |
| `04` | Invalid Amount |
| `97` | Invalid Checksum |
| `99` | Unknown error |

**Lỗi** — không dùng envelope 400/401/404/500; mọi case đã xử lý đều **HTTP 200** + RspCode
ở trên.

**Ghi chú** — BR-PAY-001: IPN là **nguồn sự thật duy nhất**; redirect browser chỉ để hiển
thị. Paid khi `ResponseCode=00` **VÀ** `TransactionStatus=00` (BR-PAY-002). Amount phải khớp
ledger (BR-PAY-003). `pending→succeeded` tối đa 1 lần (BR-PAY-004). `07`/`04` không fulfil
(BR-PAY-006). Receipt email enqueue cùng transaction (BR-PAY-007). POST cùng path hoạt động
y hệt.

### 58. Lịch sử thanh toán của tôi

`GET /api/payments` · **JWT**

**Query:** `page` (mặc định 0, ≥0), `size` (mặc định 20, 1-100).

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "amount": "n", "currency": "VND", "status": "str",
        "provider": "vnpay", "txnRef": "str", "paidAt": "ISO|null", "createdAt": "ISO",
        "subscription": { "id": "uuid", "status": "str",
                          "startedAt": "ISO", "renewalDate": "ISO" },
        "plan": { "code": "str", "name": "str", "monthlyRequestLimit": "int",
                  "price": { "amount": "n", "currency": "VND" } } }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

`subscription` / `plan` có thể là `null`.

**Lỗi**

```
400 Validation failed (page/size ngoài khoảng)
401 Unauthorized
500 An unexpected error occurred
```

**Ghi chú** — Pure ledger read, chỉ row của caller. Sắp `createdAt` desc — **không** param
`sort`. `subscription=null` khi payment chưa kích hoạt gói. Không gọi gateway.

### 59. Trạng thái một thanh toán

`GET /api/payments/{paymentId}` · **JWT**

**Path:** `paymentId` (uuid — từ checkout). Không có body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Payment retrieved successfully",
  "data": {
    "paymentId": "uuid",
    "status": "pending|succeeded|failed|refunded",
    "plan": { "code": "str", "name": "str", "monthlyRequestLimit": "int",
              "price": { "amount": "n", "currency": "VND" } },
    "amount": "n", "currency": "VND",
    "createdAt": "ISO", "paidAt": "ISO|null"
  }
}
```

**Lỗi**

```
401 Unauthorized
404 Payment not found (không tồn tại / của user khác / plan không resolve — không phân biệt)
500 An unexpected error occurred
```

**Ghi chú** — FE poll sau khi VNPay redirect về. Pure read — không gọi gateway/QueryDR
(ADR-008), **không thể** re-fulfil. `status`/`paidAt` phản ánh row lưu as-is.

## 27. Weekly menu

### 60. Danh sách thực đơn tuần của tôi

`GET /api/menus` · **JWT**

**Query**

| Param | Mặc định | Ghi chú |
|---|---|---|
| `from` | — | `YYYY-MM-DD` — gửi một mình được, trả về mọi menu **từ** đó trở đi |
| `to` | — | `YYYY-MM-DD` — gửi một mình được, trả về mọi menu **đến** đó |
| `status` | — | `drafted\|scheduled\|cancelled\|completed` — AND với range |
| `page` | `0` | ≥0 |
| `size` | `20` | 1..100 |
| `sort` | `startDate,desc` | |

Không có body.

**Response** `200 OK` — PageResponse

```json
{
  "success": true,
  "message": "Menus retrieved successfully",
  "data": {
    "content": [
      { "id": "uuid", "startDate": "date", "endDate": "date",
        "status": "drafted|scheduled|cancelled|completed", "notes": "str|null",
        "createdAt": "ISO", "updatedAt": "ISO" }
    ],
    "page": 0, "size": 20, "totalElements": 0, "totalPages": 0,
    "first": true, "last": true
  }
}
```

**Lỗi**

```
400 from/to sai format, from > to, range > 366 ngày
400 Validation failed (status/sort/page/size sai)
401 Unauthorized
500 Internal server error
```

**Ghi chú** — PR #126 (2026-10-12) **bỏ hẳn** selector `period`/`date`/`month` — muốn lọc
tuần hay tháng thì khai trực tiếp ngày, ví dụ `?from=2026-10-05&to=2026-10-11`.

- **BR-MENU-001:** chỉ menu của caller (`userId` lấy từ JWT), không nhận `userId`.
- **BR-MENU-002:** menu lọt khi `[startDate,endDate]` **giao** với cửa sổ yêu cầu, kể cả
  chạm biên; mỗi biên chỉ áp khi truyền. **KHÔNG** truyền `from` lẫn `to` = mọi menu.
- **BR-MENU-004:** tuần/tháng tính theo giờ server **UTC**.

Chỉ trả summary (**không** có `days`/`meals`) — muốn chi tiết dùng `GET /api/menus/details`.

### 61. Thực đơn chi tiết theo khoảng ngày

`GET /api/menus/details` · **JWT**

**Query** — tất cả optional:

| Param | Ghi chú |
|---|---|
| `from` | `YYYY-MM-DD` — gửi một mình được |
| `to` | `YYYY-MM-DD` — phải ≥ `from` |
| `menuId` | uuid — khi có thì **bỏ qua hoàn toàn** `from`/`to` |

Không có body.

**Response** `200 OK` — **mảng phẳng**, KHÔNG phân trang, xếp theo `startDate` tăng dần.

```json
{
  "success": true,
  "message": "Meal plan retrieved successfully",
  "data": [
    { "id": "uuid", "startDate": "date", "endDate": "date",
      "status": "drafted|scheduled|cancelled|completed",
      "notes": "str|null", "createdAt": "ISO", "updatedAt": "ISO",
      "days": [
        { "date": "date",
          "meals": [
            { "mealType": "BREAKFAST|LUNCH|DINNER", "servings": "int",
              "dish": { "id": "...", "name": "...", "description": "...",
                        "imageUrl": "...", "cuisineType": "..." } }
          ] }
      ] }
  ]
}
```

**Lỗi**

```
400 Invalid from '<value>'. Use YYYY-MM-DD.
400 from must be on or before to
400 Date range must not exceed 366 days
400 Validation failed (menuId không phải uuid)
401 Unauthorized
404 Menu not found (menuId không tồn tại hoặc của user khác)
500 Internal server error
```

**Ghi chú** — **THAY THẾ** `GET /api/menus/{menuId}` (đường dẫn đó đã xóa; giờ chỉ còn
`PATCH` và `POST .../status`). Không có filter `status` — mỗi menu trả kèm `status` của
chính nó, cần lọc theo status thì dùng `GET /api/menus?status=`.

Cửa sổ: có `menuId` → đúng 1 menu đó; không truyền `from` lẫn `to` → **tuần ISO hiện tại**
theo giờ server UTC; truyền một hoặc cả hai → giao, mỗi biên chỉ áp khi có (BR-MENU-004).
Menu lọt cửa sổ khi `[startDate,endDate]` giao, kể cả chạm biên (BR-MENU-002). Mỗi meal
nhúng **ĐẦY ĐỦ** `dish` — đây là endpoint backend của tool AI `get_meal_plan`.

PR #145 (2026-10-13): gỡ `dietaryPreferences` khỏi mọi payload menu — dietary của người
dùng giờ nằm ở `PUT /api/profile`.

### 62. Tạo thực đơn tuần (draft)

`POST /api/menus` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "startDate": "YYYY-MM-DD — bắt buộc, là thứ Hai; endDate tự tính = startDate + 6, KHÔNG nhận từ client",
  "notes": "string — optional, free-text",
  "days": [
    { "date": "YYYY-MM-DD",
      "meals": [ { "mealType": "BREAKFAST|LUNCH|DINNER",
                   "dishId": "uuid", "servings": "int ≥ 1" } ] }
  ]
}
```

`days` bắt buộc, **đúng 7 ngày**. Không nhận `user_id` trong body.

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Menu created successfully",
  "data": {
    "id": "uuid", "startDate": "date", "endDate": "date",
    "status": "drafted", "notes": "str|null",
    "createdAt": "ISO", "updatedAt": "ISO",
    "days": [
      { "date": "date",
        "meals": [ { "mealType": "...", "dishId": "uuid",
                     "dishName": "str", "servings": "int" } ] }
    ]
  }
}
```

**Lỗi**

```
400 Validation failed (thiếu/sai field, servings < 1)
400 <thông báo nêu rõ rule BR-MENU-005, ví dụ
     days must contain exactly the 7 dates from start_date to start_date + 6>
401 Unauthorized
500 Internal server error
```

**Ghi chú** — Luôn tạo trạng thái `drafted` — không bao giờ tạo trực tiếp `scheduled`, nên
ràng buộc một-tuần-scheduled-không-chồng-lấn không bao giờ bị trigger khi tạo (BR-MENU-003).

Quy tắc cấu trúc **BR-MENU-005**: đúng 7 ngày, mỗi ngày **một lần**; 1-3 bữa/ngày; tối đa
1 bữa mỗi `mealType`/ngày; `servings ≥ 1`; dish tồn tại và chưa soft-delete; mỗi dish dùng
**≤ 3 lần**; **≥ 5** dish khác nhau. Vi phạm → 400 và **KHÔNG lưu gì** (atomic).

Response chỉ nêu `dishId`+`dishName` — muốn dish nhúng đầy đủ dùng `GET /api/menus/details`
(cố ý khác shape).

PR #145 (2026-10-13): gỡ `dietaryPreferences` khỏi request/response — dietary nằm ở
`PUT /api/profile` (5 field phẳng). `notes` vẫn optional trên REST; riêng tool AI
`create_menu` khai `notes required=true` (chỉ ràng buộc tool schema, server không ép).

### 63. Sửa thực đơn (tuần hiện tại, drafted/scheduled)

`PATCH /api/menus/{menuId}` · **JWT** · `Content-Type: application/json`

**Request**

```json
{
  "days": "[ ... ] — BẮT BUỘC; tuần mới đầy đủ, thay TOÀN BỘ meals cũ",
  "notes": "string — optional; bỏ trống/null = giữ nguyên"
}
```

Không nhận `startDate` / `endDate` — một menu giữ nguyên tuần của nó.

**Response** `200 OK` — cùng shape với response tạo menu.

```json
{
  "success": true,
  "message": "Menu updated successfully",
  "data": { "id": "uuid", "startDate": "date", "endDate": "date",
            "status": "str", "notes": "str|null",
            "createdAt": "ISO", "updatedAt": "ISO",
            "days": [] }
}
```

**Lỗi**

```
400 Validation failed (thiếu days, body hỏng)
400 <thông báo nêu rõ rule BR-MENU-005, ví dụ
     a menu must reference at least 5 distinct dishes>
401 Unauthorized
404 Menu not found (menu của user khác → 404, KHÔNG phải 403)
409 Only drafted or scheduled menus can be updated
500 Internal server error
```

**Ghi chú** — Chỉ sửa được menu `drafted` hoặc `scheduled` (BR-MENU-006); `cancelled` /
`completed` → 409. Thay meals **TOÀN BỘ**, không cập nhật từng phần — tuần kết quả không
hợp lệ thì bị từ chối **cả gói**. Validate lại toàn bộ tuần sau mỗi lần sửa (BR-MENU-005).
Tuần (`startDate`/`endDate`) không đổi nên trạng thái overlap không thể thay đổi.

PR #145 (2026-10-13): gỡ `dietaryPreferences` — dietary nằm ở `PUT /api/profile`. `notes`
giữ nguyên ngữ nghĩa: bỏ trống/null = giữ giá trị hiện tại.

### 64. Đổi trạng thái thực đơn

`POST /api/menus/{menuId}/status` · **JWT** · `Content-Type: application/json`

**Request**

```json
{ "status": "scheduled | cancelled | completed — bắt buộc" }
```

Không nhận `"drafted"` — menu sinh ra đã là `drafted`.

**Response** `200 OK` — cùng shape với response tạo menu.

```json
{
  "success": true,
  "message": "Menu status updated successfully",
  "data": { "id": "uuid", "startDate": "date", "endDate": "date",
            "status": "str", "notes": "str|null",
            "createdAt": "ISO", "updatedAt": "ISO", "days": [] }
}
```

**Lỗi**

```
400 Validation failed (thiếu status, sai format, hoặc gửi drafted)
401 Unauthorized
404 Menu not found (menu của user khác → 404, KHÔNG phải 403)
409 Cannot transition a drafted menu to completed
409 Another scheduled menu already overlaps this week
500 Internal server error
```

**Ghi chú** — Chuyển trạng thái hợp pháp (BR-MENU-007):

```
drafted   → scheduled | cancelled
scheduled → cancelled | completed
cancelled, completed = trạng thái cuối
```

Gửi trùng trạng thái hiện tại cũng là 409 (no-op). Chỉ được có **MỘT** tuần `scheduled`
không chồng lấn mỗi user: service check trước, constraint V30 trong DB là lưới an toàn
(BR-MENU-003, ADR-010).

## 28. Location management (Admin)

### 69. Tạo địa điểm

`POST /api/admin/locations` · **JWT (ADMIN)** · `Content-Type: application/json`

**Request**

```json
{
  "name": "string (bắt buộc, ≤255)",
  "address": "string (bắt buộc, ≤255)",
  "latitude": "decimal (bắt buộc, -90..90)",
  "longitude": "decimal (bắt buộc, -180..180)",
  "placeType": "restaurant|grocery|cafe|market (bắt buộc)",
  "phoneNumber": "string (≤20, optional)",
  "openingHours": "object (optional, key = tên thứ trong tuần, [{ \"open\": \"HH:mm\", \"close\": \"HH:mm\" }])",
  "websiteUrl": "string (optional)",
  "rating": "decimal 0..5 (optional)",
  "priceLevel": "int 1..4 (optional)"
}
```

**Response** `201 Created`

```json
{
  "success": true,
  "message": "Location created successfully",
  "data": { "id": "uuid", "name": "string", "address": "string",
            "latitude": "decimal", "longitude": "decimal",
            "phoneNumber": "string|null", "placeType": "string",
            "openingHours": "object|null", "websiteUrl": "string|null",
            "rating": "decimal|null", "priceLevel": "int|null",
            "createdAt": "iso", "updatedAt": "iso" }
}
```

Khác GET public: phản hồi admin **có** `createdAt` + `updatedAt`.

**Lỗi**

```
400 Validation failed (thiếu trường bắt buộc, placeType sai, priceLevel ngoài 1..4,
                       rating ngoài 0..5, toạ độ ngoài khoảng) — không lưu gì khi 400
401 Unauthorized
403 Forbidden (đúng JWT nhưng không phải Admin)
500 Internal server error
```

**Ghi chú** — Issue #144. Chỉ Admin tạo/sửa/xóa được (BR-ADMIN-003); mỗi thao tác thành
công ghi một dòng `moderation_log` `CREATE_LOCATION` / `UPDATE_LOCATION` / `DELETE_LOCATION`
(BR-ADMIN-002). Không import dữ liệu bên thứ ba, không cho user tự submit địa điểm.

### 70. Sửa địa điểm (partial)

`PATCH /api/admin/locations/{locationId}` · **JWT (ADMIN)** · `Content-Type: application/json`

**Path:** `locationId` (uuid, bắt buộc).

**Request** — toàn bộ field đều optional, field nào gửi thì đổi field đó (`null` / bỏ qua =
giữ nguyên); phải gửi **ít nhất một** field. Gửi chuỗi rỗng cho field text = **xóa** giá trị
đang lưu.

```json
{
  "name": "string (≤255, không được rỗng nếu gửi)",
  "address": "string (≤255, không được rỗng nếu gửi)",
  "latitude": "decimal (-90..90)",
  "longitude": "decimal (-180..180)",
  "phoneNumber": "string (≤20)",
  "placeType": "restaurant|grocery|cafe|market",
  "openingHours": "object (thay thế toàn bộ document)",
  "websiteUrl": "string",
  "rating": "decimal 0..5",
  "priceLevel": "int 1..4"
}
```

**Response** `200 OK` — object location đã cập nhật, cùng shape với
`POST /api/admin/locations` (bao gồm `createdAt` và `updatedAt`); `updatedAt` **luôn** được
làm mới.

**Lỗi**

```
400 Validation failed (không gửi field nào, placeType sai, priceLevel ngoài 1..4,
                       rating ngoài 0..5, toạ độ ngoài khoảng, field text bắt buộc rỗng)
401 Unauthorized
403 Forbidden
404 Location not found (không tồn tại hoặc đã soft-delete)
500 Internal server error
```

**Ghi chú** — Issue #144. Sửa từng phần, ghi `moderation_log` `UPDATE_LOCATION`
(BR-ADMIN-002). Xóa mềm nằm ở `DELETE /api/admin/locations/{locationId}` (không có khôi phục
qua API).

### 71. Xóa mềm địa điểm

`DELETE /api/admin/locations/{locationId}` · **JWT (ADMIN)**

**Path:** `locationId` (uuid, bắt buộc). Không có request body.

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Location deleted successfully",
  "data": null
}
```

**Lỗi**

```
401 Unauthorized
403 Forbidden
404 Location not found (không tồn tại hoặc đã soft-delete)
500 Internal server error
```

**Ghi chú** — Issue #144. Soft delete: chỉ set `deletedAt`, giữ nguyên bản ghi, **không**
hard-delete và **không** khôi phục được qua API. Ghi `moderation_log` `DELETE_LOCATION`
(BR-ADMIN-002).