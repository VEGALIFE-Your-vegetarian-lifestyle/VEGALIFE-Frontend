# API Coverage — VEGALIFE Frontend

Đối chiếu backend đang chạy (`https://vegalife-backend.onrender.com/v3/api-docs`, 109 operation)
với code trong `src/features/`, `src/app/routes.tsx`.

Cập nhật: 2026-11-02 · branch `update/ui-ux` · backend `dev` @ `e8db8a4`

> **Nguồn lần này**: bảng spec mới của team backend (2026-11-02). Bảng đó bị cắt ở §12b
> `PATCH /api/admin/plans/{planId}` → **§1–§12 của file này đã đối chiếu lại**, các mục còn
> lại (comment public, vote, feed, search, my posts, recipe public, nearby, AI, subscription,
> dashboard — §13–§27) giữ nguyên kết quả lần trước.

> Endpoint nào đã có test tự động: xem `DOCS/TEST-COVERAGE.md`.

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

Hệ quả UI: **nút "Ngừng đăng" biến mất**. `canUnpublish` → `canReject`, chỉ trả `true` cho
bài `processed` ([constants.ts:17-23](src/features/posts/constants.ts#L17-L23)). Bài đã
`published` giờ chỉ còn nút Xoá — ADR-016 không để lại endpoint admin nào bỏ bài xuống;
`PATCH /api/posts/{id}/visibility` là ẩn hẳn (chủ bài phải tự đăng lại), việc khác.

Kèm theo: `hidden` **vẫn còn** trong state machine backend (`PostListRequest.status` nhận
`created|processed|published|unpublished|hidden`, `PATCH /api/posts/{id}/visibility` vẫn sống).
Doc cũ ghi "đã bỏ" là sai — FE bỏ UI, backend chưa bỏ.

## Tổng quan

| Trạng thái | Số endpoint |
|---|---|
| ✅ Đã gọi API thật | 61 |
| ❌ Chưa làm (backend đã có) | 46 |
| — Backend-only, FE không gọi | 2 (`/api/payments/vnpay/ipn` GET+POST) |

> 109 operation từ OpenAPI live. 61 + 46 + 2 = 109. Endpoint FE gọi mà backend **không có**: 0
> (sau khi chuyển `/moderate` → `/approve` + `/reject`).
>
> **+4 ngày 2026-11-02**: `GET /api/posts/{id}/related` + `GET /api/recipes/{id}` (Post Detail),
> `GET`+`PUT /api/posts/{id}/votes` (card Explore — §13).
>
> `getMedia` (`GET /api/media/{id}`) tính ✅ nhưng chưa nơi nào gọi — xem mục cuối file.
>
> **Spec 2026-11-02 không đổi số nào**: không endpoint mới, không endpoint nào chết thêm.
> Nó bổ sung chi tiết (thứ tự resolve của Google login, shape `components[]`, lỗi từng
> endpoint) và làm lộ 1 chỗ FE gửi tham số backend không mô tả — xem ⚠️ ở §10.

> **Cập nhật 2026-10-30**: §24/25 (subscription + payment) trước đây đánh ❌ toàn bộ — sai,
> `src/features/subscription/` đã dựng xong và wired vào `/subscription` +
> `/payment/result/:paymentId` (commit `a5fe977`). Đã sửa lại; 7 endpoint chuyển ❌ → ✅.
> §12 sửa lại: `GET /api/admin/comments` **có** nhận `status`/`userId`/`postId`/`sort`.
> §10 sửa lại: `GET/PATCH/DELETE /api/admin/recipes/{id}` **backend đã có** — trước ghi
> "không cần"/để trống, dễ đọc thành "backend không có".

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
| Login / Register | `/login`, `/register` | ✅ auth (Google OAuth ❌) |
| Nearby | `/nearby` | ✅ `GET /api/locations/nearby` |
| Location Detail | `/nearby/:id` | ✅ `GET /api/locations` (lọc theo id ở client) |
| AI Nutrition | `/ai-nutrition` | ✅ `POST /api/ai/messages` + lịch sử hội thoại + `GET /api/subscriptions/me` |
| Create Recipe | `/recipes/create` | ✅ `POST /api/recipes` + `GET /api/dishes`, `GET /api/ingredients` |
| My Recipes | `/recipes` | ✅ `GET /api/recipes/me` (lọc/sort/phân trang client-side) |
| Admin Recipes | `/admin/recipes` | ✅ `GET /api/admin/recipes` + approve/reject |
| Meal Plan | `/meal-plan` | ✅ `GET /api/menus/details` + `POST .../status` |
| Create Meal Plan | `/meal-plan/create` | ✅ `POST /api/menus` + `GET /api/dishes` (chọn món) |
| Subscription | `/subscription` | ✅ `GET /api/subscriptions` + `me/history` + `POST me/cancel` + `POST payments/checkout` + `GET /api/payments` |
| Payment Result | `/payment/result/:paymentId` | ✅ `GET /api/payments/{paymentId}` (poll 3s khi `pending`) |

---

## 1. Register — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/register | `features/auth/api` `register` | RegisterPage |
| POST /api/auth/verify-email | `verifyEmail` | VerifyEmailPage |
| POST /api/auth/resend-email | `resendVerifyEmail` | VerifyEmailPage |

## 2. Login — ⚠️ thiếu Google OAuth (backend đã có)

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/auth/login | `login` | decode role từ JWT ở LoginPage |
| POST /api/auth/refresh | `refreshAccessToken` | interceptor + timer 14 phút |
| POST /api/auth/logout | `logout` | retry sau refresh khi 401 |
| POST /api/auth/google | ❌ | **Mới có ở backend**: `{code}` → cùng shape `LoginResponse`. Nút "Continue with Google" vẫn chỉ báo `featureDeveloping` |

Chi tiết ADR-017 (spec 2026-11-02): BE tự đổi `code` → `id_token`, verify RS256 qua JWKS
Google (`aud = GOOGLE_CLIENT_ID`, `iss`, `exp`, `email_verified`), không session, không thêm
dependency. Thứ tự resolve: (1) có `user_identity(GOOGLE, sub)` → vào đúng user đó, không
tra email; (2) email khớp tài khoản đã verify + activated → auto-link; (3) chưa có → tạo tài
khoản mới (`emailVerified=true`, `activated`, `password_hash=null`, không gửi OTP, username
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

Response đọc được (`UserProfile` trong `src/shared/types/user.ts`):
`id, userId, username, email, heightCm, weightKg, bmi, age, gender, description, avatarUrl, updatedAt`
+ 5 field dietary.

⚠️ **Spec 2026-11-02 tự mâu thuẫn chỗ `bmi`**: response schema của `PUT /api/profile` **có**
`bmi`, nhưng note viết "Không nhận và không trả bmi — server tự tính lại từ
heightCm/weightKg". File này ghi schema làm chuẩn (`bmi` có mặt) — FE map vào
`UserProfile.bmi` nên cả hai chiều đều không vỡ. `PUT` còn chốt: **≥ 1 field bắt buộc**
(một field dietary cũng tính), 400 `At least one profile field must be provided` khi body rỗng.

**Ghi được** chỉ 11 field (`PROFILE_FIELDS` trong `api.ts`): height/weight/age/gender/description/
avatarUrl + 5 field dietary. `username`, `email`, `bmi` là **chỉ-đọc** — backend trả trong
response nhưng không nhận khi ghi.

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

## 8. Post moderation (Admin) — 🔴 vỡ 1, thiếu 3

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/posts | ✅ `getPosts` | PostsPage. Hỗ trợ `status`, `flag`, `userId`, `categoryId`, `createdFrom/To`, `sort`. **Luôn gửi `flag=all`** — BE mặc định `NEEDS_REVIEW` |
| GET /api/admin/posts/{id} | ❌ | Trả `contentScore` + `components[]` (`{id, type: RECIPE\|DISH\|INGREDIENT, name, moderationStatus, score}`) để duyệt theo từng tên |
| POST /api/admin/posts/{id}/approve | ✅ `approvePost` | `{reason?}`. 400 nếu bài chưa có category hoặc đang `hidden`; 404 nếu không có / xoá mềm. **Duyệt luôn các component PENDING** mà bài tham chiếu |
| POST /api/admin/posts/{id}/reject | ✅ `rejectPost` | `{reason?}`. 400 nếu đang `hidden`; 404. **Chỉ từ chối các component còn `PENDING`** |
| ~~POST /api/admin/posts/{id}/moderate~~ | 🟢 **đã chuyển sang 2 endpoint trên** | `moderatePost` đã xoá khỏi `features/posts/api.ts`. Xem mục đầu file |
| PATCH /api/posts/{id}/visibility | ❌ (FE bỏ, backend còn) | `{hidden: boolean}`. Ẩn → `hidden` + xoá `publishedAt`; bỏ ẩn → về `created` (draft riêng tư, chủ bài phải tự đăng lại). 400 `Post is not hidden` khi bỏ ẩn bài không hidden. Ghi `moderation_log` HIDE_POST/UNHIDE_POST |
| DELETE /api/posts/{id} | ✅ `deletePost` | |

→ `q` (tìm kiếm) lọc **trong trang hiện tại** — BE chưa có tham số search cho `/api/admin/posts`.

⚠️ **Bẫy OpenAPI**: `/api/admin/posts` và `/api/posts` cùng tham chiếu schema tên
`PostListRequest` (hai class khác package trùng tên). Bản sinh ra trong `/v3/api-docs` chỉ
còn `page`/`size`. Bộ lọc thật nằm ở
`dto/request/admin/PostListRequest.java` — đọc source, đừng tin swagger.

## 9. Video moderation (Admin) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/videos | `getVideos` | VideosPage. BE có `sort`/`userId`/`createdFrom`/`createdTo`, UI chưa dùng. Row có thêm `posts[{id, title, status}]` |
| DELETE /api/media/{mediaId} | `deleteVideo` | VideosPage |

`q` lọc client-side trên tối đa 100 row (`ponytail:` ở [videos/api.ts:41](src/features/videos/api.ts#L41)).

Spec 2026-11-02 bổ sung: `sort` whitelist là `createdAt|updatedAt|durationSeconds|fileSizeBytes`
(và `getVideos` đang gửi `page: 0, size: 100` rồi tự cắt trang ở client — sai nhưng vô hại vì
BE tối đa 100). Chỉ MIME video được liệt kê (`image/*` bị bỏ); **mọi** upload state
(`uploading`/`failed`) đều hiện, để admin thấy upload bỏ dở. `durationSeconds`/`fileSizeBytes`/
`mimeType`/`width`/`height`/`externalId` **chỉ có ở đây**, không có ở response của upload grant.

## 10. Recipe moderation (Admin) — ✅ đọc + duyệt/từ chối

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/recipes | ✅ `getAdminRecipes` | AdminRecipesPage. **⚠️ spec 2026-11-02 không liệt kê param `moderationStatus`** (chỉ `page`/`size`/`sort`/`userId`/`categoryId`/`createdFrom`/`createdTo`) — FE vẫn gửi. Verify trước khi tin bộ lọc `PENDING` |
| GET /api/admin/recipes/{id} | ❌ | **Backend đã có**, và là nơi duy nhất spec mô tả `moderationStatus`/`score`/`dishModerationStatus` + `ingredients[].moderationStatus`. FE cố ý không gọi — row list (spec cũ) đủ field dialog render. **Nếu bộ lọc `moderationStatus` ở list thật sự bị bỏ, phải gọi endpoint này** |
| PATCH /api/admin/recipes/{id} | ❌ | **Backend đã có.** `name`/`description`/`instructions`/`prepTimeMinutes`/`cookTimeMinutes`/`servings`/`difficulty` — UI không có màn sửa. 400 khi name/instructions blank hoặc `difficulty` lạ; 404 khi không có / xoá mềm |
| DELETE /api/admin/recipes/{id} | ❌ | **Backend đã có** — UI không có nút xoá |
| POST /api/admin/recipes/{id}/approve | ✅ `approveRecipe` | `{reason?}`, idempotent. **Chỉ đổi recipe** — không đổi dish/ingredient của nó |
| POST /api/admin/recipes/{id}/reject | ✅ `rejectRecipe` | `{reason?}`, idempotent. Không xoá gì; tên bị chặn tạo lại |

Route `/admin/recipes`. Phân trang thật ở server (`page`/`size`/`sort` + lọc `userId`,
`categoryId`, `moderationStatus`, `createdFrom`, `createdTo`). Backend trả **cả** recipe đã
xoá mềm với `status: "DELETED"` và **không** có tham số lọc theo status hay tìm theo tên —
`q` lọc client-side trên trang hiện tại (xem `ponytail:` trong `features/recipes/adminApi.ts`).

UI: cột "Duyệt" + `<Select>` lọc 4 lựa chọn (Pending/Approved/Rejected/All). Nút Duyệt/Từ
chối nằm trong dialog chi tiết (admin phải đọc nội dung trước), xác nhận qua `ConfirmDialog`.
Lý do chưa nhập được → `moderation_log.reason` luôn `null` cho recipe.

Duyệt recipe **không** làm dish/ingredient của nó hiện ra — xem §10b.

⚠️ **Cần verify**: spec 2026-11-02 bỏ `moderationStatus` khỏi cả query **và** row của
`GET /api/admin/recipes` (chỉ `GET /{recipeId}` mới có field này). Nếu đúng, `<Select>` lọc
Pending/Approved/Rejected ở `AdminRecipesPage` phải chuyển sang lọc client-side hoặc gọi
`GET /api/admin/recipes/{id}` — bộ lọc server hiện tại sẽ chết lặng (trả về mọi trạng thái).

## 10b. Dish & Ingredient management (Admin) — ❌ chưa làm

Cùng một khuôn cho hai resource (`/api/admin/dishes`, `/api/admin/ingredients`):

| Endpoint | Ghi chú |
|---|---|
| GET `/api/admin/{dishes\|ingredients}` | `page`/`size`/`sort`/`name`/`moderationStatus` |
| GET `/{id}` | |
| POST `/` | Tạo tay → `moderationStatus: APPROVED` ngay |
| PATCH `/{id}` | Dish: 400 blank name hoặc rename row đã REJECTED; 409 tên trùng row khác |
| DELETE `/{id}` | |
| POST `/{id}/approve` | `{reason?}` |
| POST `/{id}/reject` | `{reason?}` — reject **vĩnh viễn** với member, không tạo lại được tên đó |

Dish có thêm `description`/`imageUrl`/`cuisineType`. Ingredient chỉ có `name`.

Tên do member tạo qua `POST /api/recipes` bắt đầu ở `PENDING`. Duyệt/từ chối bài sẽ duyệt/từ
chối luôn các tên nó tham chiếu (chỉ các tên còn `PENDING`).

## 10c. Weekly menu — ✅ đọc + tạo + đổi trạng thái

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/menus/details | ✅ `getMealPlans` | MealPlanPage. Trả **mảng phẳng**, không phân trang |
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
| GET /api/posts/{postId}/comments | ✅ `getPostComments` | **public**, `page` (0-based, default 0) / `size` (default 20, 1–100). Spring page của comment **gốc**, mỗi phần tử mang sẵn cả cây `replies[]` (không phân trang riêng). Item: `id, userId, username, avatarUrl, content, edited, deleted, createdAt, updatedAt, replies[]`; xoá mềm → `content: "[deleted]"` + author null, reply vẫn nằm trong cây. Sort `createdAt ASC` |
| POST /api/posts/{postId}/comments | ✅ `createComment` | PostDetailPage — form chỉ hiện khi đăng nhập, `parentId` luôn `null` (UI chưa mở reply) |
| PATCH /api/posts/{postId}/comments/{commentId} | ❌ | `{content}` — chủ comment |
| DELETE /api/posts/{postId}/comments/{commentId} | ❌ | chủ comment hoặc admin |
| POST /api/posts/{postId}/comments/{commentId}/report | ❌ | |

`CommentsSection` phân trang 20 root/trang; `POST` trả `CommentResponse` (thiếu `username`/`replies`)
nên sau khi gửi phải `invalidateQueries(["post-comments", postId])` để đọc lại từ GET —
đừng render thẳng từ response.

## 12. Comment moderation (Admin) — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/comments | Nhận `page`/`size` **+ `status`** (`active`\|`removed`) **+ `userId` + `postId` + `sort`**. Row có `status` + `reportCount` |
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
| GET /api/search | `q`, `type=post\|video\|recipe`, `categoryId`, `dateFrom`, `dateTo`, `page`, `size` → `[{type, id, title, snippet, categoryIds, createdAt}]` |

Search trên Navbar hiện điều hướng sang `/explore?q=`, lọc client-side 60 bài feed.

## 17. My posts — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts | ✅ `getMyPosts` | MyPostsPage, ProfilePage. Lọc `q`/`status` client-side trên 100 bài |
| GET /api/users/{userId}/posts | ❌ | Public chỉ trả bài published; owner/Admin thấy cả draft. Cần cho profile công khai |
| PATCH /api/posts/{id} `{publish}` | ✅ `unpublishPost` | MyPostsPage. `publishPost` không dùng — hệ thống tự publish |
| DELETE /api/posts/{postId} | ✅ `deletePost` | MyPostsPage, Admin PostsPage |

MyPostsPage: draft (`created`) **xoá được** — `DELETE /api/posts/{id}` chỉ kiểm chủ bài + `deletedAt IS NULL`, không xét `status` (backend `PostService.deletePost`). Sửa draft cũng **mở được**: `GET /api/posts/{id}` trả mọi status (BR-POST-011, `findDetailById` chỉ lọc `deletedAt`) và `PATCH /api/posts/{id}` nhận owner với mọi status (`findManageablePost`). Chỉ "ngừng đăng" (`unpublishPost`) mới cần `status === "published"`.

MyPostsPage tabs My Videos / Saved Recipes / My Activity → `unsupported` (chờ API).

## 18. My videos — ❌ chưa làm

Không có endpoint riêng; dùng `GET /api/admin/videos?userId=` (ADMIN) hoặc chờ backend mở cho user.

## 19. Recipe — ✅ tạo + danh sách của mình + gợi ý

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/recipes | ✅ `createRecipe` | CreateRecipePage |
| GET /api/dishes | ✅ `searchDishes` | gợi ý tên món (CreateRecipePage, DishPicker) |
| GET /api/ingredients | ✅ `searchIngredients` | gợi ý tên nguyên liệu trong form |
| GET /api/recipes/me | ✅ `getMyRecipes` | MyRecipesPage — **mảng phẳng**, không phân trang/lọc → client tự lọc |
| GET /api/recipes/{recipeId} | ✅ `getRecipe` | **Dùng ở Post Detail** (`AttachedRecipes`, 2026-11-02) để render `post.recipeIds`. MyRecipesPage vẫn cố ý không gọi — row trong list đủ field cho dialog |
| GET /api/dishes/{dishId} | ❌ | |
| GET /api/dishes/suggestions | ❌ | Gợi ý theo cuisine/difficulty/thời gian/calo/protein + `recipesPerDish` |

`POST /api/recipes` nhận thêm 5 field dinh dưỡng optional: `calories`, `proteinG`,
`carbohydrateG`, `fatG`, `fiberG` (number ≥ 0). **UI đã bỏ ô nhập** (2026-10-30, mockup không có);
`schema.ts`/`payload.ts` vẫn validate + gửi được — payload bỏ field rỗng nên mặc định không gửi gì.
Cả 5 có mặt trong `RecipeResponse` — **chưa màn nào render** (thẻ MyRecipesPage đã bỏ 4 ô macro
2026-10-30, mockup không có).

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

## 24. AI Subscription — ✅ đã làm (UI `/subscription`)

| Endpoint | Trạng thái | Hàm |
|---|---|---|
| GET /api/subscriptions | ✅ | `getPlans` — public, plain array theo `sort_order` |
| GET /api/subscriptions/me | ✅ | `getMySubscription` (`nutrition-ai/subscriptionApi`) |
| GET /api/subscriptions/me/history | ✅ | `getSubscriptionHistory` — `{planCode, planName, status, startedAt, renewalDate, cancelledAt, createdAt}[]` |
| POST /api/subscriptions/me/cancel | ✅ | `cancelSubscription` — huỷ ngay, gọi lần 2 → 409 |
| POST /api/subscriptions/me/purchase/eligibility | ✅ | `checkPurchaseEligibility` — 200 nếu được mua, 400/409 kèm lý do |

## 25. Payment (VNPay) — ✅ đã làm (UI `/subscription` + `/payment/result/:paymentId`)

| Endpoint | Trạng thái | Hàm |
|---|---|---|
| POST /api/payments/checkout | ✅ | `createCheckout` → `{paymentId, txnRef, planCode, amount, currency, status, paymentUrl}` |
| GET /api/payments | ✅ | `getPayments` — lịch sử của chính mình, mới nhất trước |
| GET /api/payments/{paymentId} | ✅ | `getPayment` — `PaymentResultPage` poll 3s khi còn `pending` |
| GET/POST /api/payments/vnpay/ipn | — | backend-only, FE không gọi. IPN là nguồn sự thật, redirect chỉ để hiển thị |

## 26. Admin payments / plans / settings — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/payments | `page`/`size`/`userId`/`status=pending\|succeeded\|failed\|refunded`/`createdFrom`/`createdTo`. Row có `userId`, `subscription{id,status,startedAt,renewalDate}`, `plan{code,name,monthlyRequestLimit,price{amount,currency}}` (cả hai `null` được). Pure ledger read, không gọi gateway, sort `createdAt desc` |
| GET /api/admin/plans | Trả mảng, không phân trang. `{id, code, name, monthlyRequestLimit, priceAmount, priceCurrency, active, sortOrder, createdAt, updatedAt}` |
| POST /api/admin/plans | `code` bất biến sau khi tạo, tự uppercase; 409 nếu trùng (so case-insensitive) |
| PATCH /api/admin/plans/{planId} | 400 khi không gửi field nào; 404 plan không tồn tại; 409 khi tắt `active` của plan FREE |
| DELETE /api/admin/plans/{planId} | Thực chất là deactivate. 409 với FREE |
| GET /api/admin/settings | Trả nhóm `{category, items[{key, value, updatedAt}]}` |
| PATCH /api/admin/settings | `{settings}` — mỗi thay đổi ghi `moderation_log` |

Plan FREE **không bao giờ** tắt được (`PATCH .../active=false` lẫn `DELETE` đều 409) — nó là
fallback mặc định của BR-SUBS-003.

## 27. Admin dashboard — ❌ còn mock

| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/dashboard | ❌ **backend đã có**. `?range`/`from`/`to` → `{range, users{total,newInRange,activeInRange}, content{totalPosts,newPosts,totalRecipes,newRecipes,totalComments,newComments}, engagement{votesInRange,commentsInRange}, moderationQueue{pendingPosts,pendingRecipes,reportedComments}}` |

`features/admin/dashboardApi.ts` vẫn trả số giả — **xoá được ngay**.

---

## Việc cần làm trước (theo thứ tự đề xuất)

1. ~~🔴 **Sửa `moderatePost` → `approvePost`/`rejectPost`**~~ — ✅ xong 2026-11-02.
   Nút "Ngừng đăng" đã bỏ khỏi `/admin/posts` (không còn endpoint admin để bỏ bài đã publish).
2. **Dashboard thật** — `GET /api/admin/dashboard` đã có, bỏ mock `dashboardApi.ts`.
3. **Comment** — ✅ GET đã gọi (2026-10-29). Còn: mở UI trả lời (`parentId`), sửa/xoá comment.
4. **Upload video thật** — thay ô nhập tay `videoUrl` bằng grant → upload → confirm →
   `POST /api/posts/{id}/media`.
5. **Trang profile công khai** — `GET /api/profile/{userId}` + `GET /api/users/{userId}/posts`.
6. **Recipe công khai** — còn `GET /api/recipes/{id}` (BE đã có, dùng khi cần trang chi tiết riêng).
7. **Sửa nội dung menu** — `PATCH /api/menus/{menuId}` (giai đoạn B2; tạo + đổi status đã xong).
8. **Admin moderation mới** — `GET /api/admin/posts/{id}` (component list), quản lý
   dish/ingredient (§10b), comment moderation. (Recipe approve/reject đã xong.)
9. **Vote + Search** — `PUT/GET /api/posts/{id}/votes`, `GET /api/search`.
10. ~~**Subscription + Payment**~~ — ✅ xong: history/cancel/eligibility + checkout VNPay
    (`/subscription`, `/payment/result/:paymentId`). Còn §26 (admin payments/plans/settings) chưa làm.
11. **Google OAuth** — `POST /api/auth/google` đã có ở backend.
12. **Xác nhận tham số FE gửi mà spec 2026-11-02 không mô tả** — `moderationStatus` ở
    `GET /api/admin/recipes` (§10). Query của spec chỉ có `page`/`size`/`sort`/`userId`/
    `categoryId`/`createdFrom`/`createdTo`, và row cũng không có `moderationStatus` — nếu
    đúng vậy thì `<Select>` Pending/Approved/Rejected ở `AdminRecipesPage` **chết lặng**
    (trả về mọi trạng thái, không báo lỗi). Verify trước, đây là chỗ nặng nhất.

## Hàm có nhưng chưa nơi nào gọi

| Hàm | Ghi chú |
|---|---|
| `getMedia` | `GET /api/media/{id}` — đã viết, chưa màn hình nào gọi |

## File mock cần xoá khi nối API thật

| File | Dùng bởi | Thay bằng |
|---|---|---|
| `src/features/admin/dashboardApi.ts` | `AdminDashboardPage` | `GET /api/admin/dashboard` |
| `src/features/posts/mockAuthors.ts` | `features/posts/api.ts` | `GET /api/profile/{userId}` |
| `src/features/posts/mockEnrichment.ts` | `features/posts/api.ts` (`enrichListItem`, `getMockActivity` — cấp card; `getMockComments`/`enrichDetail` đã xoá 2026-10-29) | `GET /api/posts/{id}/related`, `/votes` |
| `src/features/categories/mocks.ts` | `features/admin/dashboardApi.ts` | xoá cùng dashboard mock |
| `src/shared/utils/delay.ts` | `features/admin/dashboardApi.ts`, `src/test/fakeLocationService.ts` | — |
