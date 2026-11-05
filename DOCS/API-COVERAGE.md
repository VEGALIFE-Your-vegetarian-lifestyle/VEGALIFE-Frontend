# API Coverage — VEGALIFE Frontend

Đối chiếu backend đang chạy (`https://vegalife-backend.onrender.com/v3/api-docs`, **112 operation**)
với code trong `src/features/`, `src/app/routes.tsx`.

Cập nhật: 2026-11-06 · branch `fix/admin-post` · backend `dev` @ `991a7ef` (V49/V50 — dinh dưỡng
theo nguyên liệu) + các thay đổi sau `e8db8a4`

> **Nguồn lần này**: fetch thẳng `/v3/api-docs` sống, không dùng bảng spec của team. Mọi số
> operation, shape request/response và tên field dưới đây đọc từ đó; chỗ nào chỉ suy luận sẽ
> ghi rõ "chưa verify".

> **So với lần trước**: +4 operation (`/api/subscriptions/acquire`, `GET /api/dishes/{dishId}`,
> `GET /api/dishes/{dishId}/ingredients/suggestions`, `GET /api/dishes/suggestions`),
> −3 operation FE đang gọi mà spec **không còn** (`/api/payments/checkout`,
> `/api/subscriptions/me/cancel`, `/api/subscriptions/me/purchase/eligibility`),
> và admin dish/ingredient CRUD đã lên live đủ 13 endpoint.

> Endpoint nào đã có test tự động: xem `DOCS/TEST-COVERAGE.md`.

## 🔴 Đang vỡ so với backend live (2026-11-06)

Đọc từ `/v3/api-docs` sống. Sửa theo thứ tự này; 1–3 là user thường thấy ngay.

| # | Chỗ vỡ | FE đang làm | Backend live |
|---|---|---|---|
| 1 | **Đăng ký** | [RegisterPage.tsx:111](src/features/auth/pages/RegisterPage/RegisterPage.tsx#L111) gửi `username` | `RegisterRequest` chỉ nhận `displayName` (2–100, không unique). Curl thử: gửi `username` → 400 `data.displayName = "Display name is required"` |
| 2 | **Tên tác giả bình luận** | [CommentThread.tsx:21](src/features/posts/components/CommentThread.tsx#L21) đọc `comment.username` | `CommentThreadResponse` trả `displayName` (curl xác nhận) → mọi bình luận hiện nhãn "đã xoá" |
| 3 | **Gói AI** | `AiPlan.monthlyRequestLimit`, `AiSubscription{tier,currentPlan,...}` | `AvailablePlanResponse` = `code,name,description,requestQuota,price{amount,currency}`; `GET /api/subscriptions/me` = `{remainingUsage}` — không có `tier`/`currentPlan`/`renewalDate` |
| 4 | **Mua gói** | `checkPurchaseEligibility` → `POST /api/payments/checkout` | Cả hai path **không có trong spec live**. Thay bằng `POST /api/subscriptions/acquire {planCode}` → `{action: CLAIMED\|CHECKOUT_CREATED, remainingUsage, paymentId?, paymentUrl?, ...}` |
| 5 | **Huỷ gói** | `POST /api/subscriptions/me/cancel` | Không có trong spec live |
| 6 | **Lịch sử mua** | `SubscriptionHistoryItem{startedAt,renewalDate,cancelledAt}` | `SubscriptionHistoryResponse` = `planCode,planName,source(PURCHASE\|CLAIM),grantedAt,paymentId,amount,currency,status,createdAt` |
| 7 | **Chi tiết thanh toán** | `PaymentDetail.plan.name` ở [PaymentResultPage.tsx:44](src/features/subscription/pages/PaymentResultPage/PaymentResultPage.tsx#L44) | `PaymentStatusResponse` = `paymentId,status,amount,currency,createdAt,paidAt` — **không có `plan`** → crash khi mở trang kết quả |
| 8 | **Lịch sử thanh toán** | `PaymentItem{plan,subscription}` | `PaymentHistoryItemResponse` = `id,amount,currency,status,provider,txnRef,paidAt,createdAt,userId` — không có `plan`/`subscription` |

Ba path 1–3 và 6–8 cùng gốc: team BE đổi shape subscription/payment từ lúc làm `a5fe977`.
`checkout`/`cancel`/`eligibility` trả 401 kể cả khi path không tồn tại (security config chặn
mọi path lạ), nên **đừng dùng curl để kết luận path còn sống** — chỉ tin `/v3/api-docs`.

## 🟢 Đã sửa: `POST /api/admin/posts/{id}/moderate` → `approve` / `reject`

Backend ADR-016 đã **xoá** `/moderate` (nó gộp hai câu hỏi khác nhau — "bài có được chấp nhận
không" và "bài có hiện không" — và không diễn đạt được quyết định theo từng component).
Thay bằng hai endpoint không đối xứng:

| Cũ | Mới |
|---|---|
| `POST /api/admin/posts/{id}/moderate` `{action: PUBLISH\|UNPUBLISH, reason?}` | `POST /api/admin/posts/{id}/approve` `{reason?}` |
| | `POST /api/admin/posts/{id}/reject` `{reason?}` |

Approve → publish + approve các component (dish/ingredient/recipe) mà bài tham chiếu.
Reject → unpublish + reject các component **còn PENDING**. Cả hai **không** đổi `flag`.
`reason` optional — body rỗng `{}` vẫn 200.

**Trạng thái FE (2026-11-02): đã chuyển xong.** `moderatePost` xoá khỏi
[api.ts](src/features/posts/api.ts); thay bằng `approvePost`/`rejectPost` cùng file.
`PostsPage` + `PostPreviewDialog` + `RejectPostDialog` đã đổi; `ModerationAction` /
`ModeratePostRequest` xoá khỏi [types.ts](src/features/posts/types.ts).

Hệ quả UI: **nút "Ngừng đăng" biến mất**. `canUnpublish` → `canReject`, trả `true` cho bài
`processed` **và** `unpublished` ([constants.ts:21-27](src/features/posts/constants.ts#L21-L27)) —
bài đã bị từ chối vẫn mở được `RejectPostDialog` để admin ghi lý do mới. Bài đã
`published` giờ chỉ còn nút Xoá — ADR-016 không để lại endpoint admin nào bỏ bài xuống;
`PATCH /api/posts/{id}/visibility` là ẩn hẳn (chủ bài phải tự đăng lại), việc khác.

Lý do từ chối hiện **chỉ** nằm trong `RejectPostDialog` (bắt buộc, ≤1000 ký tự) và gửi lên
qua body `{reason}`. Không lưu/không hiển thị lại ở phía user — `AdminPost` và `PostStatus`
chưa có field reason để đọc về.

Kèm theo: `hidden` **vẫn còn** trong state machine backend (`PostListRequest.status` nhận
`created|processed|published|unpublished|hidden`, `PATCH /api/posts/{id}/visibility` vẫn sống).
Doc cũ ghi "đã bỏ" là sai — FE bỏ UI, backend chưa bỏ.

## Tổng quan

| Trạng thái | Số endpoint |
|---|---|
| ✅ Đã gọi API thật | 60 |
| ❌ Chưa làm (backend đã có) | 50 |
| — Backend-only, FE không gọi | 2 (`/api/payments/vnpay/ipn` GET+POST) |

> **112 operation** từ `/v3/api-docs` live (2026-11-06). 60 + 50 + 2 = 112.
>
> **Endpoint FE đang gọi mà spec live KHÔNG có (3)**: `POST /api/payments/checkout`,
> `POST /api/subscriptions/me/cancel`, `POST /api/subscriptions/me/purchase/eligibility`.
> Đây là chỗ vỡ #4/#5 ở mục đầu file.
>
> **+4 operation so với 2026-11-02**: `POST /api/subscriptions/acquire`,
> `GET /api/dishes/{dishId}`, `GET /api/dishes/{dishId}/ingredients/suggestions`,
> `GET /api/dishes/suggestions`. Cùng đợt, **13 endpoint admin dish/ingredient** lên live
> (§10b giờ đã đủ để dựng).
>
> `getMedia` (`GET /api/media/{id}`) tính ✅ nhưng chưa nơi nào gọi — xem mục cuối file.

> **Cập nhật 2026-10-30**: §24/25 (subscription + payment) trước đây đánh ❌ toàn bộ — sai,
> `src/features/subscription/` đã dựng xong và wired vào `/subscription` +
> `/payment/result/:paymentId` (commit `a5fe977`). Nhưng từ đó **shape response đã đổi** —
> `plan`/`subscription`/`tier`/`currentPlan`/`renewalDate` không còn trong response; xem mục 🔴.

## Màn hình đã dựng lại theo UI mới

| Màn hình | Route | Nguồn dữ liệu |
|---|---|---|
| Home | `/` | ✅ `GET /api/posts/feed` + `GET /api/categories` |
| Explore | `/explore` | ✅ feed dọc + vote/comment trên card (search/sort/filter lọc client-side) |
| Post Detail | `/posts/:id` | ✅ `GET /api/posts/{id}` (public) + feed cho "bài liên quan" + `GET/POST /api/posts/{id}/comments` |
| Create Post | `/posts/create` | ✅ `POST /api/posts` → `PATCH /api/posts/{id}` |
| Edit Post | `/posts/:id/edit` | ✅ `GET /api/posts/{id}` → `PATCH` |
| My Posts | `/my-posts` | ✅ `GET /api/posts` + unpublish/delete |
| Admin Posts | `/admin/posts` | ✅ `GET /api/admin/posts` + `approve`/`reject`/`delete` |
| Profile | `/profile` | ✅ `GET/PUT /api/profile` (gồm 5 field dietary) + `GET /api/posts` (stats) |
| Login / Register | `/login`, `/register` | 🔴 auth — RegisterPage gửi `username`, BE nhận `displayName` |
| Nearby | `/nearby` | ✅ `GET /api/locations/nearby` |
| Location Detail | `/nearby/:id` | ✅ `GET /api/locations` (lọc theo id ở client) |
| AI Nutrition | `/ai-nutrition` | ⚠️ `POST /api/ai/messages` + lịch sử hội thoại; `GET /api/subscriptions/me` chỉ trả `remainingUsage` |
| Create Recipe | `/recipes/create` | ⚠️ `POST /api/recipes` + `GET /api/dishes`, `GET /api/ingredients` — xem §19 |
| My Recipes | `/recipes` | ⚠️ `GET /api/recipes/me` (lọc/sort/phân trang client-side) — 5 tổng dinh dưỡng mới, chưa render |
| Admin Recipes | `/admin/recipes` | ✅ đủ CRUD: list + detail + `PATCH` + `DELETE` (mềm, một chiều) + approve/reject + điền nguyên liệu thiếu khi duyệt |
| Admin Ingredients | `/admin/ingredients` | ✅ 5/7 endpoint: list + create + `PATCH` + `DELETE` (mềm). **Cố ý bỏ** approve/reject |
| Meal Plan | `/meal-plan` | ✅ `GET /api/menus/details` + `POST .../status` |
| Create Meal Plan | `/meal-plan/create` | ✅ `POST /api/menus` + `GET /api/dishes` (chọn món) |
| Subscription | `/subscription` | 🔴 `GET /api/subscriptions` OK, `me/history` đổi shape, `cancel`/`checkout` không còn |
| Payment Result | `/payment/result/:paymentId` | 🔴 `GET /api/payments/{paymentId}` không trả `plan` |

---

## 1. Register — 🔴 vỡ tên field

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/register | `features/auth/api` `register` | RegisterPage |
| POST /api/auth/verify-email | `verifyEmail` | VerifyEmailPage |
| POST /api/auth/resend-email | `resendVerifyEmail` | VerifyEmailPage |

🔴 **`RegisterRequest` live chỉ có `displayName`, `email`, `password`, `confirmPassword`.**
`username` không còn (ADR-019: email là identity duy nhất; `displayName` chỉ là nhãn, **không
unique**). Curl 2026-11-06 với body `{username:"abc", email:"not-an-email", password:"x",
confirmPassword:"x"}` → 400 `data: {password, email, displayName: "Display name is required"}`
— tức `username` bị bỏ qua hoàn toàn và `displayName` bị báo thiếu.

Hệ quả: [RegisterPage.tsx:36-41](src/features/auth/pages/RegisterPage/RegisterPage.tsx#L36-L41)
validate `username` 3–50 ký tự chỉ `[a-zA-Z0-9_.]`, nhưng gửi lên thì BE không nhận.
[RegisterPage.tsx:82](src/features/auth/pages/RegisterPage/RegisterPage.tsx#L82) map
`data.displayName` → `User.username` (đúng, response vẫn là `displayName`).
[RegisterRequest](src/shared/types/user.ts#L50) và
[authApi.test.ts:68](src/features/auth/__tests__/authApi.test.ts#L68) cũng đang dùng `username`.

Sửa: đổi field form + `RegisterRequest` sang `displayName` (2–100, không ràng buộc ký tự),
xoá `errors.username*` khỏi 2 locale, đổi nhãn i18n `register.usernameLabel` → "Display name".

`verify-email` và `resend-email` vẫn đúng: `{email, otp}` / `{email}`.

## 2. Login — ✅ đủ

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/auth/login | `login` | decode role từ JWT ở LoginPage |
| POST /api/auth/refresh | `refreshAccessToken` | interceptor + timer 14 phút |
| POST /api/auth/logout | `logout` | retry sau refresh khi 401 |
| POST /api/auth/google | ✅ `loginWithGoogle` | GIS code client (`useGoogleLogin`) trên LoginPage + RegisterPage |

`LoginRequest` live = `{identifier, password}`, cả hai `minLength: 1` — đúng như FE gửi.
`identifier` là **email** (ADR-019); tên `identifier` chỉ để tương thích, `displayName` không
đăng nhập được.

Chi tiết ADR-017 (spec 2026-11-02): BE tự đổi `code` → `id_token`, verify RS256 qua JWKS
Google (`aud = GOOGLE_CLIENT_ID`, `iss`, `exp`, `email_verified`), không session, không thêm
dependency. Thứ tự resolve: (1) có `user_identity(GOOGLE, sub)` → vào đúng user đó, không
tra email; (2) email khớp tài khoản đã verify + activated → auto-link; (3) chưa có → tạo tài
khoản mới (`emailVerified=true`, `activated`, `password_hash=null`, không gửi OTP, `displayName`
sinh từ email); (4) còn lại → từ chối.

**Bẫy FE**: `redirect_uri` lúc xin code phải khớp env `GOOGLE_REDIRECT_URI` từng ký tự
(scheme, case, `/` cuối). Tài khoản Google-only đăng nhập bằng password nhận chung lỗi
"Invalid email/username or password".

LoginPage + RegisterPage dùng chung tab switcher; AuthLayout dùng namespace `auth` (`split.*`, `tabs.*`, `google`, `guest`).

⚠️ **Login trả 400, không phải 401** — mọi lỗi business của `/api/auth/login` (sai mật khẩu,
email chưa verify, tài khoản suspended, tài khoản chưa active) đều là **HTTP 400**. Chỉ 401 mới
kích interceptor refresh trong [client.ts](src/shared/api/client.ts) — may là login không đi qua
đường đó, nhưng đừng suy ra "sai mật khẩu = 401" khi viết test.

## 3. Forgot password — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/forgot-password | `forgotPassword` | ForgotPasswordPage |
| POST /api/auth/verify-password-reset | `verifyPasswordReset` | ForgotPasswordPage |
| POST /api/auth/reset-password | `resetPassword` | ForgotPasswordPage |

Spec 2026-11-02 (3 bước, đúng như `ForgotPasswordPage` đang làm):

- `forgot-password` → OTP 6 số, 10 phút, gọi lại **huỷ OTP cũ**; anti-enumeration (200 chung
  cho email có/không tồn tại).
- `verify-password-reset` → mới **verify**, CHƯA đổi mật khẩu, **OTP chưa bị consume**;
  verify lại vẫn 200 (idempotent).
- `reset-password` → body **KHÔNG có `otp`** (chỉ `{email, newPassword}`), consume OTP 1 lần,
  và **thu hồi TOÀN BỘ refresh token** → mọi session khác phải đăng nhập lại. Bắt buộc gọi
  `verify-password-reset` trước, nếu không → 400 `Invalid or already used password reset code`.

`ResetPasswordRequest` hiện tại ([user.ts:97](src/shared/types/user.ts#L97)) đã đúng shape này.

## 4. User profile management — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/profile | ✅ `features/profile/api` `getProfile` | ProfilePage, MyPostsPage (header). Profile **tự tạo rỗng** ở lần đọc đầu nếu chưa có |
| GET /api/profile/{userId} | ❌ | **Public (permitAll)**, trả cả `email`; 404 khi user không tồn tại. Cần cho trang profile công khai |
| PUT /api/profile | ✅ `updateProfile` | map camelCase; nhận cả 5 field dietary |

Response đọc được (`ProfileResponse` live, 2026-11-06):
`userId, displayName, email, heightCm, weightKg, age, gender, description, avatarUrl,
preferences, dislikes, allergies, restrictions, healthGoal, bmi, updatedAt`.

⚠️ **Không có `id` và không có `username`.** `toUserProfile` ([api.ts:32](src/features/profile/api.ts#L32))
vẫn đọc `raw.id` → luôn ra `""`; `UserProfile.id` là field chết, xoá được. `username` đã
đổi thành `displayName` (khớp type hiện tại).

⚠️ **`bmi`**: schema `ProfileResponse` của cả `GET` lẫn `PUT` **có** `bmi` (server tính
`weightKg/(heightCm/100)^2`, 1 số lẻ HALF_UP, null khi thiếu). `PUT` **không nhận** `bmi`.
FE map vào `UserProfile.bmi` nhưng `ProfilePage` vẫn tự tính ở client để số đổi ngay khi gõ
(`ponytail:` tại [ProfilePage.tsx:113](src/features/profile/ProfilePage.tsx#L113)).

**Ghi được** chỉ 11 field (`PROFILE_FIELDS` trong `api.ts`): height/weight/age/gender/description/
avatarUrl + 5 field dietary. `displayName`, `email`, `bmi` là **chỉ-đọc** — backend trả trong
response nhưng không nhận khi ghi. `UpdateProfileRequest` live đúng 11 field này.

`PUT /api/profile` merge từng field: vắng mặt = giữ nguyên, `[]` = xoá sạch. Nhờ vậy
`ProfilePage` gộp cả 11 field vào **một** form, một nút Save, gửi đủ 11 field mỗi lần
(kể cả 4 mảng dietary rỗng) — không cần diff patch.
`healthGoal` xoá trắng thì gửi `""`.

Response có `bmi` (server tính `weightKg/(heightCm/100)^2`, 1 số lẻ HALF_UP, null khi thiếu
height/weight). FE **có map** vào `UserProfile.bmi` nhưng `ProfilePage` vẫn tự tính ở client để
số đổi ngay khi gõ (`ponytail:` tại [ProfilePage.tsx:113](src/features/profile/ProfilePage.tsx#L113)) —
server `bmi` dùng cho trang profile công khai (chưa dựng) và ai cần số do server chốt.

ProfilePage stats (`published`/`videos`/`saved`/`contributions`) suy từ `GET /api/posts` 100 bài gần nhất; `saved` luôn 0 vì chưa có API favorites.

## 5. Admin users — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/users | `getUsers` | UsersPage. Gửi `page`/`size`/`sort=createdAt,desc`/`status`; `role` + `createdFrom`/`createdTo` khai báo sẵn nhưng UI chưa dùng |
| POST /api/admin/users/{id}/suspend | `suspendUser` | UsersPage |
| POST /api/admin/users/{id}/restore | `restoreUser` | UsersPage |

⚠️ **`getUsers` nhận `page` 0-based**, khác mọi service khác trong repo: service gửi
thẳng `params.page` và trả `page.page + 1`, nên `UsersPage` phải truyền `page - 1`
([api.ts:17](src/features/admin/api.ts#L17), [UsersPage.tsx:37](src/features/admin/pages/UsersPage/UsersPage.tsx#L37)).
Truyền 1-based như các service khác sẽ lặng lẽ lấy sai trang.

Search `q` lọc client-side **trong trang hiện tại** — backend chưa có tham số tìm kiếm.

## 6. Category management (Admin) — ✅ đủ theo backend

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/admin/categories | `createCategory` | |
| PATCH /api/admin/categories/{id} | `updateCategory` | |
| DELETE /api/admin/categories/{id} | `retireCategory` | soft delete |
| GET /api/admin/categories | ❌ (backend chưa có) | `getCategories` dùng tạm `GET /api/categories` rồi tự sort ở client (`features/categories/api.ts`) → **không thấy được category đã retire** |

CategoriesPage hiện có: 2 thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`,
phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete —
backend chưa có endpoint (`ponytail:` ở `features/categories/api.ts`).

## 7. Content categories (public) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/categories | `getPublicCategories` | HomePage, ExplorePage, PostComposerDialog, CategoriesPage |

Spec 2026-11-02 chốt lại tham số: `page=0`, `size=20` (≤100), `sort=name,asc` (whitelist),
`name` (substring, case-insensitive). Category đã retire **không bao giờ** xuất hiện.
Đây là lý do `getCategories` ([api.ts:51](src/features/categories/api.ts#L51)) dùng tạm nó cho
admin list là chấp nhận được — `name` lọc ở server, không cần lọc client.

## 8. Post moderation (Admin) — ✅ đủ theo backend

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/posts | ✅ `getPosts` | PostsPage. BE có `status`/`flag`/`userId`/`categoryId`/`createdFrom`/`createdTo`/`sort` — **nhưng swagger chỉ hiện `page`/`size`**, xem ⚠️ dưới. **Luôn gửi `flag=all`** — BE mặc định `NEEDS_REVIEW` |
| GET /api/admin/posts/{id} | ❌ | `AdminPostDetailResponse` = `id, title, content, status, flag, contentScore, **recipes[]**, **names[]**, userId, displayName, email`. Mỗi phần tử `ComponentSummary` = `{id, type, name, moderationStatus, score}`. Duyệt theo từng tên |
| POST /api/admin/posts/{id}/approve | ✅ `approvePost` | `{reason?}` ≤1000. Trả **`AdminPostDetailResponse`** (không phải void). 400 nếu bài chưa có category hoặc đang `hidden`; 404 nếu không có / xoá mềm. **Duyệt luôn các component PENDING** mà bài tham chiếu |
| POST /api/admin/posts/{id}/reject | ✅ `rejectPost` | `{reason?}` ≤1000. Trả `AdminPostDetailResponse`. 400 nếu đang `hidden`; 404. **Chỉ từ chối các component còn `PENDING`** |
| ~~POST /api/admin/posts/{id}/moderate~~ | 🟢 **đã xoá khỏi backend** | `moderatePost` đã xoá khỏi `features/posts/api.ts`. Xem mục đầu file |
| PATCH /api/posts/{id}/visibility | ❌ (FE bỏ, backend còn) | `{hidden: boolean}`. Ẩn → `hidden` + xoá `publishedAt`; bỏ ẩn → về `created` (draft riêng tư, chủ bài phải tự đăng lại). Ghi `moderation_log` HIDE_POST/UNHIDE_POST |
| DELETE /api/posts/{id} | ✅ `deletePost` | |

→ `q` (tìm kiếm) lọc **trong trang hiện tại** — BE chưa có tham số search cho `/api/admin/posts`.

⚠️ **Bẫy OpenAPI (vẫn còn 2026-11-06)**: `/api/admin/posts` và `/api/posts` cùng tham chiếu
schema `PostListRequest` (hai class khác package trùng tên). Bản trong `/v3/api-docs` chỉ có
`page`/`size`, nhưng lỗi 400 của endpoint liệt kê rõ `status`/`flag`/`createdFrom`/`createdTo`
— bộ lọc thật nằm ở `dto/request/admin/PostListRequest.java`. Đọc source, đừng tin swagger.

## 9. Video moderation (Admin) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/videos | `getVideos` | VideosPage. `VideoListRequest` live = `page,size,sort,status,userId,createdFrom,createdTo` (khớp doc cũ). Row có `posts[{id,title,status}]` |
| DELETE /api/media/{mediaId} | `deleteVideo` | VideosPage |

`q` lọc client-side trên tối đa 100 row (`ponytail:` ở [videos/api.ts:41](src/features/videos/api.ts#L41)).

Spec 2026-11-02 bổ sung: `sort` whitelist là `createdAt|updatedAt|durationSeconds|fileSizeBytes`
(và `getVideos` đang gửi `page: 0, size: 100` rồi tự cắt trang ở client — sai nhưng vô hại vì
BE tối đa 100). Chỉ MIME video được liệt kê (`image/*` bị bỏ); **mọi** upload state
(`uploading`/`failed`) đều hiện, để admin thấy upload bỏ dở. `durationSeconds`/`fileSizeBytes`/
`mimeType`/`width`/`height`/`externalId` **chỉ có ở đây**, không có ở response của upload grant.
`status` pattern live = `^(uploading|succeed|failed)$`.

## 10. Recipe moderation + admin CRUD — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/recipes | ✅ `getAdminRecipes` | 🟢 `moderationStatus` có trong `RecipeListRequest` lẫn row. ⚠️ Không có tham số tìm theo tên → `q` lọc client-side |
| GET /api/admin/recipes/{id} | ✅ `getAdminRecipe` | Đã nối nhưng **UI không gọi** — row list đủ field, gọi thêm là request thừa |
| PATCH /api/admin/recipes/{id} | ✅ `updateAdminRecipe` | Chỉ 7 field: `name,description,instructions,prepTimeMinutes,cookTimeMinutes,servings,difficulty`. **Không** sửa được ingredients/dish/dinh dưỡng. 400 khi name/instructions rỗng hoặc `difficulty` lạ; 404 khi xoá mềm |
| DELETE /api/admin/recipes/{id} | ✅ `deleteAdminRecipe` | **Xoá mềm, một chiều** — spec live **không có** endpoint khôi phục. Row vẫn hiện với `status: DELETED`. ConfirmDialog nói rõ |
| POST /api/admin/recipes/{id}/approve | ✅ `approveRecipe` | `{reason?}`, idempotent. **Chỉ đổi recipe** — không đổi dish/ingredient |
| POST /api/admin/recipes/{id}/reject | ✅ `rejectRecipe` | `{reason?}` → dialog `RejectRecipeDialog` nhập lý do (bắt buộc ở UI, lưu `moderation_log`). Không xoá gì; tên bị chặn tạo lại |

Route `/admin/recipes`. Phân trang thật ở server (`page`/`size`/`sort` + lọc `userId`,
`categoryId`, `moderationStatus`, `createdFrom`, `createdTo`). Backend trả **cả** recipe đã
xoá mềm với `status: "DELETED"` và **không** có tham số lọc theo status hay tìm theo tên —
`q` lọc client-side trên trang hiện tại (xem `ponytail:` trong `features/recipes/adminApi.ts`).

UI: cột "Duyệt" + `<Select>` lọc 4 lựa chọn (Pending/Approved/Rejected/All). Mọi thao tác ghi
(Duyệt/Từ chối/Sửa/Xoá) nằm trong dialog chi tiết — admin phải đọc nội dung trước. Duyệt qua
`ApproveRecipeDialog`; từ chối qua `RejectRecipeDialog` (**bắt buộc nhập lý do** — backend
optional nhưng lý do mới vào được `moderation_log.reason`); xoá qua `ConfirmDialog` nói rõ là
một chiều; sửa qua `EditRecipeDialog` (chỉ 7 field, không đụng ingredients).

`ApproveRecipeDialog` là nơi nối **duyệt recipe ⇄ curate nguyên liệu**: recipe còn
`missingRequiredIngredients` thì dialog liệt kê từng tên để admin nhập `unit` + 5 giá trị dinh
dưỡng (để trống = bỏ qua, điền sau ở `/admin/ingredients`). Bấm duyệt → `PATCH` từng nguyên
liệu **rồi mới** `POST approve`. Hai lời gọi không chung transaction ở BE nên `PATCH` nào lỗi
thì dừng, recipe không được duyệt; các `PATCH` đã xong là idempotent nên bấm lại an toàn.

Dialog chi tiết còn hiện `missingRequiredIngredients` — tên nguyên liệu chưa có unit/dinh
dưỡng, tức lý do recipe chưa có tổng dinh dưỡng. Admin sửa ở màn ingredient (§10b), không sửa
được qua API recipe.

Duyệt recipe **không** làm dish/ingredient của nó hiện ra — xem §10b.

⚠️ **Đã verify 2026-11-06**: `moderationStatus` **có** ở cả query lẫn row của
`GET /api/admin/recipes` (spec live). `<Select>` Pending/Approved/Rejected ở
`AdminRecipesPage` chạy thật, không phải lọc chết.

⚠️ **`DELETE` không có đường lùi**: spec live chỉ có `/api/admin/users/{userId}/restore`,
không có restore cho recipe. Đừng thêm nút "khôi phục".

## 10b. Dish & Ingredient management (Admin) — 🟡 ingredient đã nối, dish chưa làm

Cùng một khuôn cho hai resource (`/api/admin/dishes`, `/api/admin/ingredients`), **lên live
đầy đủ 2026-11-06**:

| Endpoint | Ghi chú |
|---|---|
| GET `/api/admin/{dishes\|ingredients}` | Query thật là `AdminComponentListRequest` = `page,size,sort,name,**moderationStatus**` (spec live 2026-11-06 — khác `IngredientListRequest` chỉ có `name`). Đã verify: `moderationStatus` **có** |
| GET `/{id}` | `AdminDishResponse` / `AdminIngredientResponse` |
| POST `/` | Tạo tay → `moderationStatus: APPROVED` ngay. 400 nếu tên từng bị reject (BR-DISH-001), 409 nếu trùng tên |
| PATCH `/{id}` | Partial. Dish: `name,description,imageUrl,cuisineType`; Ingredient: `name,unit,calories,proteinG,carbohydrateG,fatG,fiberG`. 400 blank name hoặc rename row đã REJECTED; 404; 409 tên trùng row khác |
| DELETE `/{id}` | Soft delete. Tên **không** được giải phóng |
| POST `/{id}/approve` | `{reason?}` → trả `AdminDishResponse`/`AdminIngredientResponse`. **FE cố ý không nối** cho ingredient (xem dưới) |
| POST `/{id}/reject` | `{reason?}` — reject **vĩnh viễn** với member, không tạo lại được tên đó. **FE cố ý không nối** cho ingredient |

**Ingredient — route `/admin/ingredients`, đã nối 5/7 endpoint** (`features/recipes/adminApi.ts`):

| Endpoint | Hàm | UI |
|---|---|---|
| GET `/api/admin/ingredients` | ✅ `getAdminIngredients` | Page danh sách: `page`/`size`/`name`. **Không** lọc `moderationStatus`, **không** hiện cột Duyệt |
| POST | ✅ `createAdminIngredient` | `IngredientFormDialog` — tạo tay, `APPROVED` ngay |
| PATCH | ✅ `updateAdminIngredient` | Cùng dialog; **chỉ gửi field đã đổi**; cũng dùng trong `ApproveRecipeDialog` để điền nguyên liệu thiếu |
| DELETE | ✅ `deleteAdminIngredient` | `ConfirmDialog` nói rõ tên không được giải phóng, không restore |
| GET `/{id}` | ❌ | Row list đủ field, gọi thêm là request thừa |
| POST `/{id}/approve` \| `/reject` | ❌ **cố ý bỏ** | Chủ dự án yêu cầu không đưa 2 endpoint này lên UI. Hệ quả: `moderationStatus` của ingredient không đổi được từ FE — trang chỉ để xem/sửa `unit` + dinh dưỡng, không có cột duyệt, không có filter trạng thái. `moderationStatus` vẫn còn trong `AdminIngredient` type vì response trả về |

**Không có `POST` để "tạo nguyên liệu mới lúc duyệt recipe"**: tên nguyên liệu member gõ đã
được BE tạo sẵn ở `PENDING` (`unit: null`, không dinh dưỡng) ngay khi `POST /api/recipes` chạy.
Gọi `POST /api/admin/ingredients` cho đúng tên đó sẽ **400/409 trùng tên** — và tên **không**
được giải phóng khi xoá mềm. Đường đúng là `PATCH` để điền `unit` + đủ 5 giá trị; đó là việc
`ApproveRecipeDialog` làm trước khi gọi `approveRecipe`.

**Thông báo cho admin**: BE không có API notification. Badge `PENDING` cạnh mục "Nguyên liệu"
ở `AdminShell` gọi `countAdminIngredients("PENDING")` (`GET ...?page=0&size=1` rồi đọc
`totalElements`, `staleTime` 60s), cộng warn banner `missingRequiredIngredients` trong
`RecipeDetailDialog`.

Shape response:
- `AdminDishResponse` = `id, name, description, imageUrl, cuisineType, moderationStatus, suggestedIngredients[], createdAt, updatedAt`
- `AdminIngredientResponse` = `id, name, moderationStatus, **unit, calories, proteinG, carbohydrateG, fatG, fiberG, nutritionResolved**, createdAt, updatedAt` — 6 field nutrition là **mới từ V49/V50** (§19b). `unit` là `G|ML|PIECE|null`
- `AdminDishCreateRequest` = `name, description, imageUrl, cuisineType`
- `AdminIngredientCreateRequest` = `name` (bắt buộc, ≤100), `unit` (≤30), 5 giá trị dinh dưỡng — (**không** `pieceGrams` — đã bỏ). Gửi 1–4 giá trị → 400; có dinh dưỡng mà không có `unit` → 400

**Dish — vẫn chưa có trang.** 4 endpoint `/api/admin/dishes` chưa nối. Duyệt tên món đi
đường tắt: `approveDish()` từ dialog chi tiết recipe.

**Dish ⇄ ingredient (curation, 4 endpoint riêng, chưa nối)**:

| Endpoint | Ghi chú |
|---|---|
| GET `/api/admin/dishes/{dishId}/ingredients` | `List<AdminDishIngredientResponse>` = `ingredientId,name,moderationStatus,required,createdAt,updatedAt` |
| POST `/api/admin/dishes/{dishId}/ingredients` | `{ingredientName, required?}` → 201; **200** nếu entry từng bị gỡ và được phục hồi. 400 tên blank/>100, hoặc nguyên liệu đang `REJECTED`; 404 dish |
| PATCH `.../ingredients/{ingredientId}` | `{required}` bắt buộc (không gửi = 400) |
| DELETE `.../ingredients/{ingredientId}` | idempotent — gỡ 2 lần vẫn 200 |

Tên do member tạo qua `POST /api/recipes` bắt đầu ở `PENDING`. Duyệt/từ chối bài sẽ duyệt/từ
chối luôn các tên nó tham chiếu (chỉ các tên còn `PENDING`).

**Đọc phía member (mới)**:
| Endpoint | Ghi chú |
|---|---|
| GET `/api/dishes/{dishId}` | `DishResponse` = `id,name,description,imageUrl,cuisineType` (không có `createdAt`, khác `GET /api/dishes`) |
| GET `/api/dishes/{dishId}/ingredients/suggestions` | `List<{ingredientId,name,required}>` — chỉ đọc, member không ghi |
| GET `/api/dishes/suggestions` | `DishSuggestionRequest`: `name, cuisineType, difficulty, maxPrepTime, maxCookTime, maxTotalTime, **minCalories/maxCalories/minProtein/maxProtein/minCarbohydrate/maxCarbohydrate/minFat/maxFat/minFiber/maxFiber**, page, size, recipesPerDish` → `DishSuggestionResponse{id,name,description,imageUrl,cuisineType,recommendedRecipes[]}`, mỗi recipe là `RecipeSummaryResponse` (§19b) |

## 10c. Weekly menu — ✅ đọc + tạo + đổi trạng thái

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/menus/details | ✅ `getMealPlans` | MealPlanPage. Trả **mảng phẳng**, không phân trang. Mỗi meal có thêm `recommendedRecipes[]` (bản deploy trả, spec live chưa khai) — dialog món ở `/meal-plan` gọi `GET /api/recipes/{id}` theo id đầu tiên |
| GET /api/menus | ❌ | Danh sách rút gọn, phân trang + lọc `status`. `page` **0-based** |
| POST /api/menus | ✅ `createMenu` | `{startDate, notes?, days[]}` — luôn tạo `drafted`. `MenuValidator` chặn cả tuần nếu sai BR-MENU-005 |
| PATCH /api/menus/{menuId} | ❌ | `{days?, notes?}` — sửa menu `drafted`/`scheduled` (giai đoạn B2) |
| POST /api/menus/{menuId}/status | ✅ `changeMenuStatus` | `{status}` — `drafted → scheduled\|cancelled`, `scheduled → cancelled\|completed` |

Route `/meal-plan` (cần đăng nhập) và `/meal-plan/create`. Luôn gửi `from`/`to` tường minh —
bỏ trống thì backend lấy tuần hiện tại theo **giờ UTC**, lệch ngày với người dùng múi giờ dương.
`days` trong response **chỉ chứa ngày có bữa** nên UI dựng đủ 7 ô từ `startDate` thay vì
lặp theo `days`. Endpoint không lọc được `status`; `menuId` của user khác trả **404**
(không phải 403, cố ý giấu sự tồn tại — BR-MENU-001).

**Hai shape response khác nhau**: `POST`/`PATCH`/`status` trả `MenuDetailResponse` — meals chỉ
có `dishId`/`dishName`. `GET /api/menus/details` trả `MenuMealPlanResponse` với `dish` đầy đủ.
Sau khi ghi phải `invalidateQueries(["meal-plans"])`, đừng render từ response.

**BR-MENU-005** (validate ở `CreateMealPlanPage/validate.ts` trước khi gửi): đúng 7 ngày liên
tiếp; 1–3 bữa/ngày; ≤1 bữa mỗi `mealType`/ngày; `servings` nguyên ≥ 1; `dishId` tồn tại và
chưa xoá mềm; một món **≤ 3 lần**; **≥ 5 món khác nhau**.

**BR-MENU-007**: `drafted` không bao giờ là đích; no-op cũng 409. Schedule trùng tuần menu
`scheduled` khác → 409 `MenuOverlapException`. Không có cron/admin nào tự đổi status — chỉ
owner qua endpoint trên (hoặc chatbot AI gọi cùng endpoint đó).

`GET /api/dishes` (dùng cho picker) chỉ trả món `moderation_status = APPROVED`; món member tạo
chưa duyệt không chọn được.

## 11. Comment — ✅ đọc + tạo

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId}/comments | ✅ `getPostComments` | **public**, `page` (0-based, default 0) / `size` (default 20, 1–100). Spring page của comment **gốc**, mỗi phần tử mang sẵn cả cây `replies[]` (không phân trang riêng). Item live (`CommentThreadResponse`): `id, userId, **displayName**, avatarUrl, content, edited, deleted, createdAt, updatedAt, replies[]`; xoá mềm → `content: "[deleted]"` + author null, reply vẫn nằm trong cây. Sort `createdAt ASC` |
| POST /api/posts/{postId}/comments | ✅ `createComment` | PostDetailPage — form chỉ hiện khi đăng nhập, `parentId` luôn `null` (UI chưa mở reply) |
| PATCH /api/posts/{postId}/comments/{commentId} | ❌ | `{content}` — chủ comment |
| DELETE /api/posts/{postId}/comments/{commentId} | ❌ | chủ comment hoặc admin |
| POST /api/posts/{postId}/comments/{commentId}/report | ❌ | |

🔴 **`username` → `displayName`**: `CommentThreadResponse` live trả `displayName` (curl
2026-11-06 xác nhận `{"displayName":"Haha1122", ...}`) — **không có `username`**.
[CommentThread.tsx:21](src/features/posts/components/CommentThread.tsx#L21) đọc
`comment.username` → luôn `undefined` → mọi comment hiện nhãn "đã xoá".
`PostCommentThread` ([types.ts:78-95](src/features/posts/types.ts#L78-L95)) phải đổi
`username: string | null` → `displayName: string | null`. `ApiComment` (shape của `POST`)
live = `id, postId, parentId, userId, content, edited, createdAt, updatedAt` — khớp type hiện tại.

`CommentsSection` phân trang 20 root/trang; `POST` trả `CommentResponse` (thiếu
`displayName`/`replies`) nên sau khi gửi phải `invalidateQueries(["post-comments", postId])
để đọc lại từ GET — đừng render thẳng từ response.

## 12. Comment moderation (Admin) — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/comments | ⚠️ `CommentListRequest` live = **`page,size`** thôi — swagger lại ẩn `status`/`userId`/`postId`/`sort` (cùng bệnh với `PostListRequest`). Row `CommentListResponse` = `id, postId, parentId, userId, **displayName**, content, status, reportCount, createdAt, updatedAt` |
| POST /api/admin/comments/{commentId}/moderate | `{reason}` bắt buộc, ≤1000 ký tự. Soft-delete, reply giữ `parentId` |

Spec 2026-11-02 xác nhận lại: `sort` whitelist chỉ `createdAt|updatedAt`; có thêm
`createdFrom`/`createdTo`; **không có value `all`** — bỏ trống param để lấy cả hai trạng thái;
`parentId` trả thô, BE không resolve thread. Moderated comment là soft-delete: `deletedAt` set,
reply giữ `parentId` (khớp `DELETE /api/posts/{postId}/comments/{commentId}`).
404 khi comment không tồn tại **hoặc đã soft-delete**. Mỗi lần moderate ghi `moderation_log`
(actor, `MODERATE_COMMENT`, `COMMENT`, targetId, reason).

Route `/admin/comments` chưa dựng — mục sidebar còn `ready: false`
([AdminShell.tsx:16](src/features/admin/AdminShell.tsx#L16)). Backend đã đủ để dựng ngay:
lọc theo `status`/`userId`/`postId` chạy ở server, không cần lọc client.

## 13. Vote — ✅ đọc + bấm trên card Explore

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId}/votes | ✅ | `getPostVotes` — `{postId, likeCount, dislikeCount, userVote}`. **Public**: curl anon 2026-11-02 → 200. Dùng ở `FeedPostCard` |
| PUT /api/posts/{postId}/votes | ✅ | `setPostVote` — `{voteType: "UPVOTE"\|"DOWNVOTE"}`, **cần JWT**. Gửi lại cùng `voteType` để bỏ vote (BE toggle) |

UI vote **chỉ có trên card Explore** (2026-11-02); Post Detail cố ý không có — mockup chốt
không vẽ thanh vote ở trang chi tiết.

## 14. Home feeds — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/posts/feed | `getFeedPosts` | HomePage, ExplorePage (feed dọc), PostDetailPage (related) |

## 15. Post detail — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId} | ✅ `getPostDetail` | PostDetailPage, PostComposerDialog (edit mode) |
| GET /api/posts/{postId}/related | ✅ `getRelatedPosts` | `?limit=` → `[{post, similarityScore}]`, xếp giảm dần. Dùng ở lưới "Related" (2026-11-02, thay cách cắt từ feed) |

Bài chỉ trả `categoryIds` → PostDetailPage tra tên qua `GET /api/categories` (fallback hiện UUID).
Nhãn trạng thái dùng `PostStatusBadge` (i18n `common:postStatus.*`).

**Post Detail còn gọi thêm** (2026-11-02): `GET /api/recipes/{recipeId}` (§19, `AttachedRecipes`
— render `post.recipeIds`, cần JWT). Bình luận nằm ở sidebar phải, dưới thẻ meta.

## 16. Search — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/search | `SearchRequest` live = `q, type(POST\|VIDEO\|RECIPE), categoryId, dateFrom, dateTo, page, size` → `PageResponse<SearchResultItem>`, item = `{type, id, title, snippet, categoryIds, createdAt}` |

Search trên Navbar hiện điều hướng sang `/explore?q=`, lọc client-side 60 bài feed.

## 17. My posts — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts | ✅ `getMyPosts` | MyPostsPage, ProfilePage. Lọc `q`/`status` client-side trên 100 bài |
| GET /api/users/{userId}/posts | ❌ | Public chỉ trả bài published; owner/Admin thấy cả draft. Cần cho profile công khai |
| PATCH /api/posts/{id} `{publish}` | ✅ `unpublishPost` | MyPostsPage. `publishPost` không dùng — hệ thống tự publish |
| DELETE /api/posts/{postId} | ✅ `deletePost` | MyPostsPage, Admin PostsPage |

🟢 **`PostListResponse` live đã có `userId`, `displayName`, `avatarUrl`** (curl
`/api/posts/feed` 2026-11-06: `["id","userId","displayName","avatarUrl","title","content",
"rawContent","featuredImageUrl","categoryIds","mediaIds","recipeIds","status","flag",
"viewCount","publishedAt","createdAt"]`). Tức **`mockAuthors.ts` bơm tác giả giả đã hết cần
thiết** — card có thể đọc `post.displayName`/`post.avatarUrl` thật. `PostListResponse` type
([types.ts:149](src/features/posts/types.ts#L149)) chưa khai `userId`/`displayName`/`avatarUrl`
và vẫn có `type`/`videoUrl` (BE **không** trả — đã verify cả hai vắng mặt).
`enrichListItem` vẫn gọi `getAuthorCard(post.id)` → đang ghi đè tên thật bằng tên bịa.

MyPostsPage: draft (`created`) **xoá được** — `DELETE /api/posts/{id}` chỉ kiểm chủ bài + `deletedAt IS NULL`, không xét `status` (backend `PostService.deletePost`). Sửa draft cũng **mở được**: `GET /api/posts/{id}` trả mọi status (BR-POST-011, `findDetailById` chỉ lọc `deletedAt`) và `PATCH /api/posts/{id}` nhận owner với mọi status (`findManageablePost`). Chỉ "ngừng đăng" (`unpublishPost`) mới cần `status === "published"`.

MyPostsPage tabs My Videos / Saved Recipes / My Activity → `unsupported` (chờ API).

## 18. My videos — ❌ chưa làm

Không có endpoint riêng; dùng `GET /api/admin/videos?userId=` (ADMIN) hoặc chờ backend mở cho user.

## 19. Recipe — 🔴 vỡ shape dinh dưỡng (V49/V50)

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/recipes | 🔴 `createRecipe` | CreateRecipePage — **không còn nhận 5 field dinh dưỡng** |
| GET /api/dishes | ✅ `searchDishes` | gợi ý tên món (CreateRecipePage, DishPicker) |
| GET /api/ingredients | ✅ `searchIngredients` | gợi ý tên nguyên liệu trong form — **có `unit`** (`G\|ML\|PIECE\|null`), form hiện đơn vị đã lưu ở ô read-only khi chọn nguyên liệu có sẵn |
| GET /api/recipes/me | ⚠️ `getMyRecipes` | MyRecipesPage — **mảng phẳng**, không phân trang/lọc → client tự lọc. Trả thêm 5 tổng + `nutritionResolved` |
| GET /api/recipes/{recipeId} | ✅ `getRecipe` | **Post Detail** (`AttachedRecipes`) + **dialog món ở `/meal-plan`** (`MealRecipeDialog`, gọi theo `recommendedRecipes[].id`). Owner-only — recipe người khác là **404**; dialog rơi về card tóm tắt dựng từ response tuần |
| GET /api/dishes/{dishId} | ❌ | `DishResponse` = `id,name,description,imageUrl,cuisineType` (không có `createdAt`) |
| GET /api/dishes/suggestions | ❌ | Không chỉ cuisine/difficulty/thời gian — **có 10 filter dinh dưỡng** (`min/max` × calories/protein/carb/fat/fiber) + `recipesPerDish` |

### 19b. V49/V50 — dinh dưỡng tính từ nguyên liệu (BE `991a7ef`)

Nguồn chi tiết: `DOCS/frontend-api-changes-ingredient-nutrition.md` + plan ở
`DOCS/PLAN-INGREDIENT-NUTRITION.md`. Tóm tắt phần ảnh hưởng shape:

| # | Thay đổi | FE hiện tại |
|---|---|---|
| 1 | `POST /api/recipes` **bỏ** `calories/proteinG/carbohydrateG/fatG/fiberG` | `CreateRecipeRequest` + `payload.ts` vẫn gửi — BE **bỏ qua**, không lưu. Phải xoá |
| 2 | Line `unit` **optional**, normalize về `G`/`ML`/`PIECE` | `RecipeIngredientInput.unit: string` (bắt buộc), schema `.required()`, `UNIT_SUGGESTIONS` = `kg/l/tbsp/tsp/cup/clove/pinch` → **`tbsp`/`kg` cho nguyên liệu MỚI trả 400** |
| 3 | `unit` **bị bỏ qua** cho nguyên liệu đã tồn tại | FE không biết điều này; member gõ `2 quả` cho `đậu hũ` (lưu `G`) → thành `2 g` |
| 4 | Recipe reads thêm 5 tổng + `nutritionResolved` | `Recipe` type **chưa có** `nutritionResolved`; 5 field tồn tại nhưng **không màn nào render** |
| 5 | `RecipeIngredientResponse.unit` có thể **`null`** | `RecipeIngredient.unit: string` → dialog admin có thể in `"200 null"` |
| 6 | `AdminRecipeListResponse` **không** có tổng dinh dưỡng | `AdminRecipe extends Omit<Recipe,"dishName">` → type hứa field BE không gửi |

`RecipeResponse` live (đủ): `id, userId, dishId, dishName, dishModerationStatus,
moderationStatus, name, description, instructions, prepTimeMinutes, cookTimeMinutes, servings,
difficulty, ingredients, missingRequiredIngredients, **calories, proteinG, carbohydrateG, fatG,
fiberG, nutritionResolved**, createdAt, updatedAt`.

`0.00` là câu trả lời thật (nước = 0 kcal); `null` = "catalogue chưa định giá được công thức".
**Không** quy `null` → `0`. Tổng là **cả công thức**, không phải per-serving.

Chưa có trang danh sách/chi tiết recipe công khai (recipe của **người khác**) — `/recipes`
chỉ hiện công thức của chính mình. Chưa gán recipe vào bài:
`POST /api/posts/{postId}/recipes` `{recipeIds[]}` (❌).

## 20. Create/edit post — ✅ đủ luồng chính

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/posts | ✅ `createPost` | PostComposerDialog (tạo) |
| PATCH /api/posts/{postId} | ✅ `updatePost` | PostComposerDialog (tạo + sửa) |
| POST /api/media/upload | ✅ `createUploadGrant` | `components/common/ImageUploader` |
| (upload thẳng provider) | ✅ `uploadFileToProvider` | |
| POST /api/media/{id}/confirm | ✅ `confirmUpload` | |
| GET /api/media/{id} | ✅ `getMedia` | chưa nơi nào gọi |
| POST /api/posts/{postId}/media | ❌ | `{mediaIds[]}` — gắn media có sẵn vào bài |

⚠️ `PostCreateRequest` / `PostUpdateRequest` **không** có `type`, `videoUrl`, `mediaId`.
`buildPatch` vẫn gửi `videoUrl` khi type = video ([payload.ts:36](src/features/posts/components/composer/payload.ts#L36))
→ backend bỏ qua. Post type được suy từ media gắn vào, không phải field nhập tay.
`PostListResponse` cũng đã bỏ `type`/`videoUrl` (thay bằng `recipeIds`).

Soạn bài là **một dialog** (`PostComposerDialog`, mở bằng `useUiStore().openComposer(postId?)`, mount một lần ở `Layout`) — không còn route `/posts/create` hay `/posts/:id/edit`. Một màn hình: tiêu đề trần → hàng meta (ảnh bìa compact / summary / dropdown danh mục) → editor cao hết khung → dải chip công thức; rail phải = readiness checklist (suy từ form) + preview card; footer cố định = Cancel / Save Draft / Publish.

## 21–22. Nearby location / Location detail — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/locations/nearby | `getNearbyLocations` | NearbyPage |
| GET /api/locations | `getLocations` | AdminLocationsPage. BE có `minRating`/`placeType`/`maxPriceLevel`/`openNow`, UI chưa dùng |
| GET /api/locations/{id} | ❌ backend chưa có | LocationDetailPage dùng `getLocationById` = lấy 100 địa điểm rồi lọc ở client (`ponytail:` trong `api.ts`) |
| GET /api/admin/locations/{id} | ❌ backend chưa có | Chỉ có PATCH/DELETE trên path này |
| POST /api/admin/locations | `createLocation` | AdminLocationsPage |
| PATCH /api/admin/locations/{id} | `updateLocation` | AdminLocationsPage |
| DELETE /api/admin/locations/{id} | `deleteLocation` | AdminLocationsPage |

Bản đồ: react-leaflet (`features/locations/components/PlaceMap.tsx`).

## 23. AI Chatbot — 🟡 UI + API xong, SSE chưa

| Endpoint | Trạng thái |
|---|---|
| POST /api/ai/messages | ✅ `sendAiMessage` |
| POST /api/ai/messages/stream | ❌ chưa dùng — cần `fetch` + `getReader()`, xem `ponytail:` trong `features/nutrition-ai/api.ts` |
| GET /api/ai/conversations | ✅ `getAiConversations` |
| GET /api/ai/conversations/{id} | ✅ `getAiConversation` |

`useAiChat` giữ state chat; khách chưa đăng nhập bị chặn ở ô nhập (mọi endpoint cần JWT).

## 24. AI Subscription — 🔴 shape đã đổi

| Endpoint | Trạng thái | Hàm |
|---|---|---|
| GET /api/subscriptions | ✅ | `getPlans` — public, plain array. Row live = `AvailablePlanResponse{code,name,description,requestQuota,price{amount,currency}}` — **`monthlyRequestLimit` không tồn tại**, tên đúng là `requestQuota` |
| GET /api/subscriptions/me | 🔴 | `getMySubscription` — response live = `{remainingUsage}` **duy nhất**. Không có `tier`/`status`/`renewalDate`/`usage`/`currentPlan`/`latestPayment` |
| GET /api/subscriptions/me/history | 🔴 | `getSubscriptionHistory` — row live = `{planCode, planName, source(PURCHASE\|CLAIM), grantedAt, paymentId, amount, currency, status, createdAt}`. Không có `startedAt`/`renewalDate`/`cancelledAt` |
| POST /api/subscriptions/acquire | ❌ | **Endpoint mới thay `checkout` + `cancel`**. Body `{planCode}` (bắt buộc, minLength 1) → `{planCode, action: CLAIMED\|CHECKOUT_CREATED, remainingUsage, paymentId?, txnRef?, paymentUrl?, amount?, currency?, status?}` |
| ~~POST /api/subscriptions/me/cancel~~ | ❌ **không còn trong spec** | `cancelSubscription` gọi path chết |
| ~~POST /api/subscriptions/me/purchase/eligibility~~ | ❌ **không còn trong spec** | `checkPurchaseEligibility` gọi path chết |

`action` quyết định UI: `CLAIMED` = gói FREE đã nhận, không đi thanh toán;
`CHECKOUT_CREATED` = có `paymentUrl` để redirect VNPay.

## 25. Payment (VNPay) — 🔴 shape đã đổi

| Endpoint | Trạng thái | Hàm |
|---|---|---|
| ~~POST /api/payments/checkout~~ | ❌ **không còn trong spec** | `createCheckout` gọi path chết — dùng `POST /api/subscriptions/acquire` |
| GET /api/payments | ⚠️ | `getPayments` — row live `PaymentHistoryItemResponse` = `{id, amount, currency, status, provider, txnRef, paidAt, createdAt, userId}` — **không có `plan`/`subscription`** |
| GET /api/payments/{paymentId} | 🔴 | `getPayment` — live `PaymentStatusResponse` = `{paymentId, status, amount, currency, createdAt, paidAt}` — **không có `plan`** → [PaymentResultPage.tsx:44](src/features/subscription/pages/PaymentResultPage/PaymentResultPage.tsx#L44) `plan.name` crash |
| GET/POST /api/payments/vnpay/ipn | — | backend-only, FE không gọi. IPN là nguồn sự thật, redirect chỉ để hiển thị |

Muốn hiện plan name ở trang kết quả: hoặc `GET /api/subscriptions/me/history?page=0` tìm theo
`paymentId`, hoặc bỏ hẳn dòng plan (khuyến nghị — response không cam kết có).

## 26. Admin payments / plans / settings — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/payments | `AdminPaymentListRequest` = `page,size,userId,status,createdFrom,createdTo`. Row = `PaymentHistoryItemResponse{id,amount,currency,status,provider,txnRef,paidAt,createdAt,userId}` — 🟢 **live KHÔNG có `subscription`/`plan`** (khác doc cũ mô tả). Pure ledger read, sort `createdAt desc` |
| GET /api/admin/plans | Trả mảng. Row live `AdminPlanResponse` = `{id, code, name, description, **requestQuota**, priceAmount, priceCurrency, active, sortOrder, createdAt, updatedAt}` |
| POST /api/admin/plans | `AdminPlanCreateRequest` = `code,name,description,requestQuota,priceAmount,priceCurrency,active,sortOrder`. `code` bất biến, tự uppercase; 409 nếu trùng |
| PATCH /api/admin/plans/{planId} | 400 khi không gửi field nào; 404; 409 khi tắt `active` của plan FREE |
| DELETE /api/admin/plans/{planId} | Thực chất là deactivate. 409 với FREE |
| GET /api/admin/settings | Trả nhóm `{category, items[{key, value, updatedAt}]}` |
| PATCH /api/admin/settings | `{settings}` — mỗi thay đổi ghi `moderation_log` |

Plan FREE **không bao giờ** tắt được (`PATCH .../active=false` lẫn `DELETE` đều 409) — nó là
fallback mặc định của BR-SUBS-003.

## 27. Admin dashboard — ❌ còn mock

| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/dashboard | ❌ **backend đã có** (verify live 2026-11-06). Response `DashboardResponse` = `{range{type,from,to}, users{total,newInRange,activeInRange}, content{totalPosts,newPosts,totalRecipes,newRecipes,totalComments,newComments}, engagement{votesInRange,commentsInRange}, moderationQueue{pendingPosts,pendingRecipes,reportedComments}}` |

`features/admin/dashboardApi.ts` vẫn trả số giả — **xoá được ngay**, shape khớp 1:1.

---

## Việc cần làm trước (theo thứ tự đề xuất)

1. ~~🔴 **Sửa `moderatePost` → `approvePost`/`rejectPost`**~~ — ✅ xong 2026-11-02.
   Nút "Ngừng đăng" đã bỏ khỏi `/admin/posts` (không còn endpoint admin để bỏ bài đã publish).
2. 🔴 **Đăng ký** — `username` → `displayName` (§1). Chặn đứng mọi user mới.
3. 🔴 **Bình luận** — `username` → `displayName` (§11). Mọi bình luận đang hiện "đã xoá".
4. 🔴 **Subscription + payment** — đổi sang `POST /api/subscriptions/acquire`; sửa
   `getSubscriptionHistory`/`getPayment`/`getPayments`; bỏ `plan` khỏi trang kết quả (§24/25).
   `cancel`/`eligibility`/`checkout` phải xoá hoặc chờ BE trả lại.
5. 🔴 **Recipe V49/V50** — xoá 5 field dinh dưỡng khỏi schema/payload; `unit` optional +
   giới hạn `g/ml/piece`; render 5 tổng + `nutritionResolved` (§19b). Plan chi tiết:
   `DOCS/PLAN-INGREDIENT-NUTRITION.md`.
6. **Dashboard thật** — `GET /api/admin/dashboard` đã có, bỏ mock `dashboardApi.ts`.
7. **Bỏ `mockAuthors`** — `PostListResponse` đã trả `userId`/`displayName`/`avatarUrl` (§17).
8. **Comment** — còn: mở UI trả lời (`parentId`), sửa/xoá comment.
9. **Upload video thật** — thay ô nhập tay `videoUrl` bằng grant → upload → confirm →
   `POST /api/posts/{id}/media`.
10. **Trang profile công khai** — `GET /api/profile/{userId}` + `GET /api/users/{userId}/posts`.
11. **Sửa nội dung menu** — `PATCH /api/menus/{menuId}` (giai đoạn B2; tạo + đổi status đã xong).
12. **Admin moderation mới** — `GET /api/admin/posts/{id}` (component list), quản lý
    dish/ingredient (§10b — backend đã đủ 13 endpoint), comment moderation.
13. **Vote + Search** — `PUT/GET /api/posts/{id}/votes` (đã xong), `GET /api/search`.
14. **Google OAuth** — `POST /api/auth/google` đã có ở backend và FE đã gọi.

---

## Hàm có nhưng chưa nơi nào gọi

| Hàm | Ghi chú |
|---|---|
| `getMedia` | `GET /api/media/{id}` — đã viết, chưa màn hình nào gọi |

## File mock cần xoá khi nối API thật

| File | Dùng bởi | Thay bằng |
|---|---|---|
| `src/features/admin/dashboardApi.ts` | `AdminDashboardPage` | `GET /api/admin/dashboard` |
| `src/features/posts/mockAuthors.ts` | `features/posts/api.ts` | 🟢 **`displayName`/`avatarUrl`/`userId` của `PostListResponse`** — không cần `GET /api/profile/{userId}` nữa |
| `src/features/posts/mockEnrichment.ts` | `features/posts/api.ts` (`enrichListItem`, `getMockActivity` — cấp card) | `GET /api/posts/{id}/related`, `/votes`. Phần tác giả xoá được ngay |
| `src/features/categories/mocks.ts` | `features/admin/dashboardApi.ts` | xoá cùng dashboard mock |
| `src/shared/utils/delay.ts` | `features/admin/dashboardApi.ts`, `src/test/fakeLocationService.ts` | — |
