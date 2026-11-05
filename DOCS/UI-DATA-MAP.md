# UI Data Map — VEGALIFE Frontend

Bản đồ **page ⇄ field API thật**. Mục đích: khi update UI/UX, biết chính xác field nào
có thật để thiết kế quanh nó — **không mock thêm data mà backend không trả**.

Đọc kèm: `API-COVERAGE.md` (endpoint nào đã gọi / còn thiếu) · `DESIGN-MASTER.md` (§3.4 bảy
data state) · `MOCK-FIELDS.md` (danh sách field đang bịa **theo từng màn hình**, cập nhật
dần khi sửa UI). Cập nhật: 2026-10-29 · branch `update/ui-ux`.

Ký hiệu: **[R]** field thật từ API · **[M]** mock/hardcode · **[D]** suy ra ở client.

---

## 1. Field API KHÔNG trả — đang mock/hardcode

Đừng nhân rộng khi làm UI. Mỗi dòng là chỗ UI đang bịa dữ liệu.

| Chỗ | Thứ đang bịa | Nguồn |
|---|---|---|
| Post card (Home/Explore/Post Detail related) | `authorCard` (username/role/bio/followers/postCount), `durationLabel`, `rating`, `commentCount`, `saveCount` | `posts/mockEnrichment.ts` (`enrichListItem`) + `posts/mockAuthors.ts` |
| Post detail | ✅ **không còn mock** (bỏ hẳn 2026-10-29) — xem `MOCK-FIELDS.md` § Post Detail | — |
| Comment | ✅ đã gọi API thật (`GET/POST /api/posts/{id}/comments`); chỉ **activity feed** ở `/my-posts` còn bịa | `mockEnrichment.ts` (`getMockActivity`) |
| Location detail | review, số ảnh, badge "Farm Direct" / sustainability / dietary transparency | i18n key còn nguyên nhưng **0 chỗ dùng**: `nearby:detail.{farmDirect,verifiedReviews,ethics,ethicsValue,aboutTitle,sustainability.*,photoCount,galleryLabels.*,insiderTip,verifiedNote,parkingNote,transitNote,dishesTitle,dishesSubtitle,communityRecipeMatch,cookAtHome,dietaryTitle,dietarySubtitle,reviewsTitle,totalReviews,helpful}` |
| Nearby | 22 toạ độ quận trong `MOCK_AREAS`, bán kính `RADIUS_KM = 10` cố định, mảng `FILTERS` hardcode, nhãn "Sorted strictly: Closest to Farthest" **tĩnh kể cả khi sort theo rating** | `locations/mocks.ts`, `NearbyPage.tsx` |
| AI Nutrition | 4 ingredient swaps (tiếng Anh, hardcode), BMI input `175`/`67` (profile **có** `heightCm`/`weightKg` mà không dùng), protein max `min + 12` tự chế, model name "GreenHealth 4.2" | `nutrition-ai/AiNutritionPage.tsx`, `ChatPanel.tsx` |
| AuthLayout | "10,000+ Plant Recipes", "4.2" model rating, ảnh Unsplash cứng | `auth/AuthLayout.tsx` |
| CreatePost (dialog) | `summary` (không gửi lên BE), 2 pill tĩnh "Draft autosaved" + "Plant Verified" | `posts/components/composer/PostComposerDialog.tsx` |
| CreateRecipe | `UNIT_SUGGESTIONS`, servings mặc định `"2"` | `CreateRecipePage/IngredientEditor.tsx`, `schema.ts` |
| Admin dashboard | **toàn bộ** số liệu — không HTTP, tính từ seed categories | `admin/dashboardApi.ts` |
| Categories | `contentCount` fake | `categories/mocks.ts` |
| MealRow | render `dish.id` raw (font mono — trông như debug) | `menus/components/MealRow.tsx` |
| Videos | badge "Sample video (mock data)" | `admin:preview.sample` |

---

## 2. Field API CÓ trả nhưng UI chưa dùng

Được phép thiết kế quanh những field này (không cần xin backend).

- `LocationItem`: `websiteUrl`, `openingHours` (UI tự suy `openNow` theo đồng hồ máy),
  `createdAt` / `updatedAt`
- `MenuDetail.createdAt` / `updatedAt`; `Dish.description` (shape đầy đủ), `Dish.createdAt`
- `Category.description`
- `UserProfile`: `heightCm`, `weightKg`, `age`, `gender`, `description`, `avatarUrl` + 5 field
  dietary (BMI tile đang hardcode thay vì đọc). `username`/`email`/`bmi` **có trong type** nhưng
  ProfilePage vẫn đọc username/email từ authStore và tự tính BMI ở client
- `PaymentItem.txnRef` / `provider` / `subscription`; `SubscriptionHistoryItem.cancelledAt` /
  `createdAt` / `planCode`; `AiSubscription.latestPayment`
- `LoginResponse.role` / `status` (đang decode JWT thay vì đọc thẳng),
  `RegisterResponse.userId` / `username`
- Post: `mediaIds`, `recipeIds`, `flag` (PostDetail đã render `featuredImageUrl`, `rawContent`,
  `viewCount`, `publishedAt` từ 2026-10-29; `videoUrl` **không** nằm trong response — xem §4.0)
- `Recipe`: 5 field dinh dưỡng `calories` / `proteinG` / `carbohydrateG` / `fatG` / `fiberG` —
  **không màn nào render** (4 ô macro trên thẻ MyRecipesPage đã bỏ 2026-10-30);
  `dishModerationStatus` hiện ở dialog chi tiết khi recipe đã duyệt mà tên món còn `PENDING`

---

## 3. Page ⇄ endpoint ⇄ field

### 3.1 Bài viết

| Page | Endpoint | Field render |
|---|---|---|
| Home `/` (khách: 3 query JWT `enabled: false`, `HomeWeeklyBar`/`HomeDishes` ẩn hẳn, `HomeNearbyPicks` hiện thẻ mời đăng nhập) | `GET /api/posts/feed` + `GET /api/categories` (public) · `GET /api/dishes` + `GET /api/locations` + `GET /api/menus/details` (**cần JWT**) | feed: title, content, featuredImageUrl, categoryIds, viewCount, createdAt, totalElements · categories: name, id · dishes: name, imageUrl, cuisineType · locations: name, address, placeType, rating, priceLevel · menus: status, `days[].date`, `days[].meals[].{mealType, dish.name, dish.imageUrl}` |
| Explore `/explore` (màn "search" — **không có** `/search` riêng) | `GET /api/posts/feed?page=0&size=60` + `GET /api/categories?page=0&size=100&sort=name,asc` | feed: title, content, featuredImageUrl, categoryIds, viewCount, createdAt, totalElements · categories: name, id (+ đếm client). Lọc keyword/category/tab/sort **client-side** trên feed đã tải, rồi phân trang client 8 card/trang bằng `Pagination` (state `q`/`cat`/`tab`/`sort` trên URL, số trang ở state component). Chi tiết: `MOCK-FIELDS.md` § Explore |
| MyPosts `/my-posts` | `GET /api/posts` (page 0 size 100 → lọc client `q`/`status` rồi cắt trang) | như trên |
| PostDetail `/posts/:id` | `GET /api/posts/{id}` (public) + `GET /api/posts/feed?page=0&size=6` (Related) + `GET /api/posts/{id}/comments` (public, `page`/`size`) + `POST /api/posts/{id}/comments` (JWT) | post: title, content, contentJson (parse từ rawContent), featuredImageUrl, categoryIds, status, viewCount, publishedAt, createdAt · comments: id, username, avatarUrl, content, edited, deleted, createdAt, `replies[]` (lồng sẵn, không phân trang riêng) · Related: cắt từ feed. Chi tiết: `MOCK-FIELDS.md` § Post Detail |
| Create/Edit *(dialog, không route)* | `POST /api/posts` → `PATCH /api/posts/{id}`; media 3 bước | POST chỉ nhận title, content, rawContent, featuredImageUrl — type/category/publish là **PATCH thứ 2** |

Card dùng lại: `PostCard` (`posts/components/PostCard.tsx`) ở Home / Explore / PostDetail related.
`PostStatusBadge` variant ở `posts/constants.ts`; nhãn ở i18n `common:postStatus.*`.

### 3.2 Địa điểm

| Page | Endpoint | Field render |
|---|---|---|
| Nearby `/nearby` | `GET /api/locations/nearby?lat&lng&radius` (radius **mét**, trả mảng phẳng, không phân trang) | placeType, rating, priceLevel, **distance** (chỉ có ở đường này), name, address, phoneNumber, latitude, longitude, websiteUrl, openingHours |
| LocationDetail `/nearby/:id` (**`ProtectedRoute`** — phải đăng nhập mới xem chi tiết) | `GET /api/locations?page=0&size=100` rồi `.find(id)` — **không có** `GET /api/locations/{id}` | như trên **trừ `distance`** |

`openNow` không phải field BE — `nearbyApi.ts` tự suy từ `openingHours` + đồng hồ máy
(`openingHours.ts`). Quá 100 địa điểm thì detail trả "not found" (ponytail có chủ ý).

### 3.3 Thực đơn

| Page | Endpoint | Field render |
|---|---|---|
| MealPlan `/meal-plan` | `GET /api/menus/details?from&to` | id, startDate, endDate, status, notes, createdAt, updatedAt, days[].date, meals[]{mealType, servings, dish{id, name, imageUrl, cuisineType}} |
| CreateMealPlan `/meal-plan/create` | `GET /api/dishes` (size 100, không phân trang) + `POST /api/menus` | Dish: id, name, description, imageUrl, cuisineType, createdAt |

Lưới 7 ngày do client dựng từ `startDate` (`week.ts`); BE chỉ trả `days` có bữa. Nút đổi
trạng thái: `POST /api/menus/{id}/status` (transition table ở `MenuActions.tsx`). Sau khi
ghi luôn `invalidateQueries(["meal-plans"])` — response POST/status **thiếu `dish` đầy đủ**.

### 3.4 Subscription / thanh toán

| Page | Endpoint | Field render |
|---|---|---|
| Subscription `/subscription` | `GET /api/subscriptions` (public), `GET /api/subscriptions/me`, `/me/history`, `GET /api/payments` | plan: name, code, price.amount, price.currency, monthlyRequestLimit, tier · me: status, usage, currentPlan, renewalDate · history: planName, status, startedAt, renewalDate · payment: amount, currency, status, paidAt, createdAt, plan |
| PaymentResult `/payment/result/:paymentId` | `GET /api/payments/{paymentId}` (poll 3s khi `pending`) | paymentId, status, plan.name, amount, currency, createdAt, paidAt |

`POST /api/subscriptions/me/purchase/eligibility` → `POST /api/payments/checkout` →
`window.location.assign(paymentUrl)`. IPN là nguồn sự thật; trang result chỉ hiển thị.

### 3.5 AI Nutrition

| Page | Endpoint | Field render |
|---|---|---|
| AiNutrition `/ai-nutrition` | `/api/ai/conversations`, `/api/ai/conversations/{id}`, `POST /api/ai/messages`, `GET /api/subscriptions/me`, `GET /api/dishes` (DishPicker) | conversation: id, title, updatedAt · message: role, content, createdAt · usage: used, limit, windowEnd/periodEnd · subscription: currentPlan.name |

`POST /api/ai/messages/stream` **chưa dùng** (ponytail). Chat không có endpoint xoá/đổi tên.

### 3.6 Recipe

| Page | Endpoint | Field render |
|---|---|---|
| CreateRecipe `/recipes/create` | `GET /api/ingredients` (size 8), `GET /api/dishes` (size 8) + `POST /api/recipes` | ghi: name, dishName, description, instructions, servings, difficulty, prepTimeMinutes, cookTimeMinutes, ingredients[], calories, proteinG, carbohydrateG, fatG, fiberG · hiển thị thêm: `user.username` (authStore) |
| MyRecipes `/recipes` | `GET /api/recipes/me` (mảng phẳng) | thẻ: name, dishName, description, servings, difficulty, prepTimeMinutes, cookTimeMinutes, ingredients[], moderationStatus, updatedAt (dialog chi tiết thêm dishModerationStatus + instructions) — lọc/tìm/sort/phân trang **client-side**; `null` → `—` |
| AdminRecipes `/admin/recipes` | `GET /api/admin/recipes`, `POST .../approve\|reject`, `POST /api/admin/dishes/{id}/approve` | AdminRecipe: name, description, servings, difficulty, prepTimeMinutes, cookTimeMinutes, instructions, ingredients, status, moderationStatus, score, dishModerationStatus, username, email, categoryIds, createdAt |

`instructions` là `TEXT` thuần (không rich text) — form nhập **mỗi bước một ô**, `joinSteps()`
gộp thành `"tiêu đề — thân"` mỗi bước một dòng trước khi gửi (xem `payload.ts`).
`GET /api/recipes/{id}` **BE đã có** nhưng FE cố ý không gọi — row trong list đủ field cho dialog.

### 3.7 Profile & auth

| Page | Endpoint | Field render |
|---|---|---|
| Profile `/profile` | `GET/PUT /api/profile` | heightCm, weightKg, age, gender, description, avatarUrl, + 5 field dietary (`preferences`, `dislikes`, `allergies`, `restrictions`, `healthGoal` — chưa set thì **vắng hẳn**, không phải `null`/`[]`) · **không render** `username`/`email`/`bmi` (đọc từ authStore; BMI tự tính client) |
| Login `/login` | `POST /api/auth/login` | userId, username, email, role, status, accessToken, refreshToken |
| Register `/register` | `POST /api/auth/register` | userId, username, email |
| VerifyEmail `/verify-email` | `POST /api/auth/verify-email`, `/resend-email` | userId, username, email |
| ForgotPassword `/forgot-password` | `POST /api/auth/forgot-password` → `/verify-password-reset` → `/reset-password` | chỉ success/message |

### 3.8 Admin

| Page | Endpoint | Ghi chú |
|---|---|---|
| Dashboard `/admin/dashboard` | **không có** — `dashboardApi.ts` mock | |
| Posts `/admin/posts` | `GET /api/admin/posts`, `DELETE /api/posts/{id}` | 🔴 nút duyệt còn gọi `POST /api/admin/posts/{id}/moderate` — endpoint **BE đã xoá (ADR-016)** → 404/405 |
| Videos `/admin/videos` | `GET /api/media?type=video` | BE **không** trả `title` (lấy `description`); kéo size 100 rồi lọc client |
| Categories `/admin/categories` | `GET /api/categories` (public) | `deletedAt` hardcode `null`; badge "Active" tĩnh; metric "Active" chỉ đếm dòng trang hiện tại |
| Recipes `/admin/recipes` | `GET /api/admin/recipes` + approve/reject | `?status=` lạ → ép `PENDING`; search lọc client trên trang hiện tại. `GET/PATCH/DELETE /api/admin/recipes/{id}` **BE đã có**, FE cố ý không gọi (row đủ field cho dialog) |
| Users `/admin/users` | `GET /api/admin/users`, suspend/restore | `getUsers` gửi `page` **verbatim** → caller truyền `page - 1`; `sort=createdAt,desc` cứng, không có `q` |
| Locations `/admin/locations` | CRUD `/api/locations` | |
| Profile `/admin/profile` | dùng lại `ProfilePage` (embedded) | |
| Comments `/admin/comments` | **chưa dựng** (`ready: false`) | `GET /api/admin/comments` **có** nhận `status`/`userId`/`postId`/`sort`; `POST .../moderate` `{reason}` bắt buộc |
| Subscription `/subscription` | `GET /api/subscriptions`, `GET/POST /api/subscriptions/me/*`, `POST /api/payments/checkout`, `GET /api/payments` | 2 tab lịch sử mua + lịch sử thanh toán, huỷ gói qua `ConfirmDialog` |
| Payment Result `/payment/result/:paymentId` | `GET /api/payments/{paymentId}` | poll 3s khi `status === "pending"` (IPN có thể tới trễ hơn redirect) |

---

## 4. Cảnh báo khi sửa UI

0. 🔴 **`PostListResponse` live không còn `type` / `videoUrl`** (kiểm tra 2026-10-29, cả feed
   và `GET /api/posts/{id}`): keys thật = `id, title, content, rawContent, featuredImageUrl,
   categoryIds, mediaIds, recipeIds, status, flag, viewCount, publishedAt, createdAt`.
   FE vẫn khai `type`/`videoUrl` trong `posts/types.ts` và dùng ở PostCard / Explore / MyPosts /
   ProfilePage ("videos" count) → mọi bài bị coi là blog, tab Videos rỗng.
   PostDetail **đã bỏ** cả hai field (2026-10-29) — không còn nhánh `<video>` lẫn badge "Video".
1. 🔴 `POST /api/admin/posts/{id}/moderate` backend đã xoá — PostsPage + PostPreviewDialog
   vẫn gọi. **Đừng đánh bóng nút duyệt bài admin** trước khi chốt hướng thay thế.
2. `getUsers` gửi `page` verbatim (mọi service khác tự trừ 1) — sai là lệch trang.
3. `getMyPosts` / `getVideos` / `exportCategoriesCsv` đều kéo `size=100` rồi lọc/cắt ở
   client — đừng vẽ UI phân trang giả trên đó.
4. `LocationDetail` fetch 100 rồi `.find()` — ponytail có chủ ý, không "sửa".
5. `CategoriesPage`, `VideosPage`, `AdminRecipesPage` có filter/sort/search chạy trên trang
   hiện tại (hoặc trên 100 dòng đầu), không phải toàn bộ dữ liệu — copy UI phải phản ánh đúng.
6. `ponytail:` (40 chỗ / 26 file) đánh dấu chỗ lược bớt có chủ ý — không "sửa" nếu không được yêu cầu.
7. i18n: `en` mặc định, `vi` secondary. Thêm key mới → thêm **cả hai**.
