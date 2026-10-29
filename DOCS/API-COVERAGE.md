# API Coverage — VEGALIFE Frontend

Đối chiếu backend đang chạy (`https://vegalife-backend.onrender.com/v3/api-docs`, 109 operation)
với code trong `src/features/`, `src/app/routes.tsx`.

Cập nhật: 2026-10-26 · branch `feat/meal-plan` · backend `dev` @ `e8db8a4`

> Endpoint nào đã có test tự động: xem `DOCS/TEST-COVERAGE.md`.

## 🔴 Vỡ: `POST /api/admin/posts/{id}/moderate` không còn tồn tại

Backend ADR-016 đã **xoá** `/moderate` (nó gộp hai câu hỏi khác nhau — "bài có được chấp nhận
không" và "bài có hiện không" — và không diễn đạt được quyết định theo từng component).
Thay bằng hai endpoint không đối xứng:

| Cũ | Mới |
|---|---|
| `POST /api/admin/posts/{id}/moderate` `{action: PUBLISH\|UNPUBLISH, reason?}` | `POST /api/admin/posts/{id}/approve` `{reason?}` |
| | `POST /api/admin/posts/{id}/reject` `{reason?}` |

Approve → publish + approve các component (dish/ingredient/recipe) mà bài tham chiếu.
Reject → unpublish + reject các component **còn PENDING**. Cả hai **không** đổi `flag`.
`reason` optional — body rỗng vẫn 200.

**Đang gãy:** `moderatePost` ([api.ts:166](src/features/posts/api.ts#L166)) vẫn gọi
`/moderate`, dùng bởi `PostsPage` và `PostPreviewDialog`. Nút Duyệt / Từ chối hiện trả
404/405. Cần đổi sang `approvePost` / `rejectPost`.

Kèm theo: `hidden` **vẫn còn** trong state machine backend (`PostListRequest.status` nhận
`created|processed|published|unpublished|hidden`, `PATCH /api/posts/{id}/visibility` vẫn sống).
Doc cũ ghi "đã bỏ" là sai — FE bỏ UI, backend chưa bỏ.

## Tổng quan

| Trạng thái | Số endpoint |
|---|---|
| ✅ Đã gọi API thật | 48 |
| ❌ Chưa làm (backend đã có) | 59 |
| — Backend-only, FE không gọi | 2 (`/api/payments/vnpay/ipn` GET+POST) |

> 109 operation từ OpenAPI live. 48 + 59 + 2 = 109. Endpoint FE gọi mà backend **không có**:
> 1 (`/moderate`) — xem mục 🔴 trên.
>
> `getMedia` (`GET /api/media/{id}`) tính ✅ nhưng chưa nơi nào gọi — xem mục cuối file.

## Màn hình đã dựng lại theo UI mới

| Màn hình | Route | Nguồn dữ liệu |
|---|---|---|
| Home | `/` | ✅ `GET /api/posts/feed` + `GET /api/categories` |
| Explore | `/explore` | ✅ feed (search/sort/filter lọc client-side) |
| Post Detail | `/posts/:id` | ✅ `GET /api/posts/{id}` + feed cho "bài liên quan" |
| Create Post | `/posts/create` | ✅ `POST /api/posts` → `PATCH /api/posts/{id}` |
| Edit Post | `/posts/:id/edit` | ✅ `GET /api/posts/{id}` → `PATCH` |
| My Posts | `/my-posts` | ✅ `GET /api/posts` + unpublish/delete |
| Profile | `/profile` | ✅ `GET/PUT /api/profile` (gồm 5 field dietary) + `GET /api/posts` (stats) |
| Login / Register | `/login`, `/register` | ✅ auth (kể cả Google OAuth) |
| Nearby | `/nearby` | ✅ `GET /api/locations/nearby` |
| Location Detail | `/nearby/:id` | ✅ `GET /api/locations` (lọc theo id ở client) |
| AI Nutrition | `/ai-nutrition` | ✅ `POST /api/ai/messages` + lịch sử hội thoại + `GET /api/subscriptions/me` |
| Create Recipe | `/recipes/create` | ✅ `POST /api/recipes` + `GET /api/dishes`, `GET /api/ingredients` |
| Admin Recipes | `/admin/recipes` | ✅ `GET /api/admin/recipes` + approve/reject |
| Meal Plan | `/meal-plan` | ✅ `GET /api/menus/details` + `POST .../status` |
| Create Meal Plan | `/meal-plan/create` | ✅ `POST /api/menus` + `GET /api/dishes` (chọn món) |

---

## 1. Register — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/register | `features/auth/api` `register` | RegisterPage |
| POST /api/auth/verify-email | `verifyEmail` | VerifyEmailPage |
| POST /api/auth/resend-email | `resendVerifyEmail` | VerifyEmailPage |

## 2. Login — ✅ đủ

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/auth/login | `login` | decode role từ JWT ở LoginPage |
| POST /api/auth/refresh | `refreshAccessToken` | interceptor + timer 14 phút |
| POST /api/auth/logout | `logout` | retry sau refresh khi 401 |
| POST /api/auth/google | ✅ `loginWithGoogle` | GIS code client (`useGoogleLogin`) trên LoginPage + RegisterPage |


LoginPage + RegisterPage dùng chung tab switcher; AuthLayout dùng namespace `auth` (`split.*`, `tabs.*`, `google`, `guest`).

## 3. Forgot password — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/forgot-password | `forgotPassword` | ForgotPasswordPage |
| POST /api/auth/verify-password-reset | `verifyPasswordReset` | ForgotPasswordPage |
| POST /api/auth/reset-password | `resetPassword` | ForgotPasswordPage |

## 4. User profile management — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/profile | ✅ `features/profile/api` `getProfile` | ProfilePage, MyPostsPage (header) |
| GET /api/profile/{userId} | ❌ | Public (không cần JWT), trả cả `email`. Cần cho trang profile công khai |
| PUT /api/profile | ✅ `updateProfile` | map camelCase; nhận cả 5 field dietary |

`PUT /api/profile` merge từng field: vắng mặt = giữ nguyên, `[]` = xoá sạch. Nhờ vậy
`DietaryPreferencesSection` (đã mount trong `ProfilePage`, có nút lưu riêng) chỉ gửi
field đã đổi (`buildDietaryPatch`), không đụng height/weight/age của form hồ sơ.
`healthGoal` xoá trắng thì gửi `""`.

Response có `bmi` (server tính `weightKg/(heightCm/100)^2`, 1 số lẻ HALF_UP, null khi thiếu
height/weight). FE **không đọc** — `ProfilePage` tự tính ở client để số đổi ngay khi gõ
(`ponytail:` tại [ProfilePage.tsx:113](src/features/profile/ProfilePage.tsx#L113)).

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
| GET /api/categories | `getPublicCategories` | HomePage, ExplorePage, CreatePostPage, CategoriesPage |

## 8. Post moderation (Admin) — 🔴 vỡ 1, thiếu 3

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/posts | ✅ `getPosts` | PostsPage. Hỗ trợ `status`, `flag`, `userId`, `categoryId`, `createdFrom/To`, `sort`. **Luôn gửi `flag=all`** — BE mặc định `NEEDS_REVIEW` |
| GET /api/admin/posts/{id} | ❌ | Trả `contentScore` + `components[]` (recipe/dish/ingredient kèm `moderationStatus`) để duyệt theo từng tên |
| POST /api/admin/posts/{id}/approve | ❌ | `{reason?}`. 400 nếu bài chưa có category hoặc đang `hidden` |
| POST /api/admin/posts/{id}/reject | ❌ | `{reason?}`. 400 nếu bài đang `hidden` |
| ~~POST /api/admin/posts/{id}/moderate~~ | 🔴 **backend xoá** | `moderatePost` vẫn gọi → 404/405. Xem mục 🔴 đầu file |
| PATCH /api/posts/{id}/visibility | ❌ (FE bỏ, backend còn) | `{hidden: boolean}`. Ẩn → `hidden` + xoá `publishedAt`; bỏ ẩn → về `created` |
| DELETE /api/posts/{id} | ✅ `deletePost` | |

→ `q` (tìm kiếm) lọc **trong trang hiện tại** — BE chưa có tham số search cho `/api/admin/posts`.

⚠️ **Bẫy OpenAPI**: `/api/admin/posts` và `/api/posts` cùng tham chiếu schema tên
`PostListRequest` (hai class khác package trùng tên). Bản sinh ra trong `/v3/api-docs` chỉ
còn `page`/`size`. Bộ lọc thật nằm ở
`dto/request/admin/PostListRequest.java` — đọc source, đừng tin swagger.

## 9. Video moderation (Admin) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/videos | `getVideos` | VideosPage. BE có `sort`/`userId`/`createdFrom`/`createdTo`, UI chưa dùng |
| DELETE /api/media/{mediaId} | `deleteVideo` | VideosPage |

`q` lọc client-side trên tối đa 100 row (`ponytail:` ở [videos/api.ts:41](src/features/videos/api.ts#L41)).

## 10. Recipe moderation (Admin) — ✅ đọc + duyệt/từ chối

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/recipes | ✅ `getAdminRecipes` | AdminRecipesPage. Có param `moderationStatus`; UI mặc định lọc `PENDING` (`?status=` trên URL) |
| GET /api/admin/recipes/{id} | ❌ | Không cần — row trong list đã đủ field dialog render |
| PATCH /api/admin/recipes/{id} | ❌ | `name`/`description`/`instructions`/`prepTimeMinutes`/`cookTimeMinutes`/`servings`/`difficulty` |
| DELETE /api/admin/recipes/{id} | ❌ | |
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

## 10b. Dish & Ingredient management (Admin) — ❌ chưa làm

Cùng một khuôn cho hai resource (`/api/admin/dishes`, `/api/admin/ingredients`):

| Endpoint | Ghi chú |
|---|---|
| GET `/api/admin/{dishes\|ingredients}` | `page`/`size`/`sort`/`name`/`moderationStatus` |
| GET `/{id}` | |
| POST `/` | Tạo tay → `moderationStatus: APPROVED` ngay |
| PATCH `/{id}` | |
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

## 11. Comment — ⚠️ chỉ tạo

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId}/comments | ❌ | **Backend đã có** (issue #41 xong). Trả cây `CommentThreadResponse[]` với `replies[]`, cờ `edited`/`deleted` |
| POST /api/posts/{postId}/comments | ✅ `createComment` | PostDetailPage — form chỉ hiện khi đăng nhập |
| PATCH /api/posts/{postId}/comments/{commentId} | ❌ | `{content}` — chủ comment |
| DELETE /api/posts/{postId}/comments/{commentId} | ❌ | chủ comment hoặc admin |
| POST /api/posts/{postId}/comments/{commentId}/report | ❌ | |

`getPostComments` vẫn trả mock (`getMockComments`) — comment vừa gửi chỉ hiện tạm ở client.
Reply lồng (`parentId`) đã có ở service, UI chưa mở vì chưa có GET.

## 12. Comment moderation (Admin) — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/comments | `page`/`size` (BE **chưa** nhận `status`/`userId`/`postId`/sort). Row có `status: active\|removed` + `reportCount` |
| POST /api/admin/comments/{commentId}/moderate | `{reason}` bắt buộc, ≤1000 ký tự. Soft-delete, reply giữ `parentId` |

## 13. Vote — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| PUT /api/posts/{postId}/votes | `{voteType: "UPVOTE"\|"DOWNVOTE"}` → `{postId, likeCount, dislikeCount, userVote}` |
| GET /api/posts/{postId}/votes | Cùng shape |

ExplorePage hiện hiện `post.viewCount` gắn nhãn "votes" — số liệu sai nguồn.

## 14. Home feeds — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/posts/feed | `getFeedPosts` | HomePage, ExplorePage, PostDetailPage (related) |

## 15. Post detail — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId} | ✅ `getPostDetail` | PostDetailPage, CreatePostPage (edit mode) |
| GET /api/posts/{postId}/related | ❌ | `?limit=` → `[{post, similarityScore}]`. PostDetailPage tự lọc từ feed thay vì gọi |

Bài chỉ trả `categoryIds` → PostDetailPage tra tên qua `GET /api/categories` (fallback hiện UUID).
Nhãn trạng thái dùng `PostStatusBadge` (i18n `common:postStatus.*`).

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

MyPostsPage: draft (`created`) không sửa/xoá được — chỉ chờ hệ thống tự kiểm tra và publish; sửa/xoá/ngừng đăng chỉ mở khi `status === "published"`.

MyPostsPage tabs My Videos / Saved Recipes / My Activity → `unsupported` (chờ API).

## 18. My videos — ❌ chưa làm

Không có endpoint riêng; dùng `GET /api/admin/videos?userId=` (ADMIN) hoặc chờ backend mở cho user.

## 19. Recipe — ⚠️ chỉ tạo + gợi ý

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/recipes | ✅ `createRecipe` | CreateRecipePage |
| GET /api/dishes | ✅ `searchDishes` | gợi ý tên món (CreateRecipePage, DishPicker) |
| GET /api/ingredients | ✅ `searchIngredients` | gợi ý tên nguyên liệu trong form |
| GET /api/recipes/me | ❌ | Recipe của chính mình |
| GET /api/recipes/{recipeId} | ❌ | |
| GET /api/dishes/{dishId} | ❌ | |
| GET /api/dishes/suggestions | ❌ | Gợi ý theo cuisine/difficulty/thời gian/calo/protein + `recipesPerDish` |

`POST /api/recipes` giờ nhận thêm 5 field dinh dưỡng optional: `calories`, `proteinG`,
`carbohydrateG`, `fatG`, `fiberG`. Form chưa có ô nhập.

Chưa có trang danh sách/chi tiết recipe công khai. Chưa gán recipe vào bài:
`POST /api/posts/{postId}/recipes` `{recipeIds[]}` (❌).

## 20. Create/edit post — ✅ đủ luồng chính

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/posts | ✅ `createPost` | CreatePostPage (bước 5) |
| PATCH /api/posts/{postId} | ✅ `updatePost` | CreatePostPage (tạo + sửa) |
| POST /api/media/upload | ✅ `createUploadGrant` | `components/common/ImageUploader` |
| (upload thẳng provider) | ✅ `uploadFileToProvider` | |
| POST /api/media/{id}/confirm | ✅ `confirmUpload` | |
| GET /api/media/{id} | ✅ `getMedia` | chưa nơi nào gọi |
| POST /api/posts/{postId}/media | ❌ | `{mediaIds[]}` — gắn media có sẵn vào bài |

⚠️ `PostCreateRequest` / `PostUpdateRequest` **không** có `type`, `videoUrl`, `mediaId`.
`buildPatch` vẫn gửi `videoUrl` khi type = video ([payload.ts:36](src/features/posts/pages/CreatePostPage/payload.ts#L36))
→ backend bỏ qua. Post type được suy từ media gắn vào, không phải field nhập tay.
`PostListResponse` cũng đã bỏ `type`/`videoUrl` (thay bằng `recipeIds`).

Wizard 5 bước: Content Format → Title → Categorization → Cover Media → Article Content, kèm sidebar Publishing Checklist + AI Nutrition Snapshot (số liệu tĩnh).

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

## 24. AI Subscription — 🟡 chỉ đọc gói hiện tại

| Endpoint | Trạng thái |
|---|---|
| GET /api/subscriptions | ❌ |
| GET /api/subscriptions/me | ✅ `getMySubscription` |
| GET /api/subscriptions/me/history | ❌ → `{planCode, planName, status, startedAt, renewalDate, cancelledAt, createdAt}[]` |
| POST /api/subscriptions/me/cancel | ❌ |
| POST /api/subscriptions/me/purchase/eligibility | ❌ `{planCode}` |

## 25. Payment (VNPay) — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| POST /api/payments/checkout | ❌ `{planCode}` → `{paymentId, txnRef, paymentUrl, ...}` |
| GET /api/payments | ❌ lịch sử của chính mình |
| GET /api/payments/{paymentId} | ❌ |
| GET/POST /api/payments/vnpay/ipn | — backend-only, FE không gọi |

## 26. Admin payments / plans / settings — ❌ chưa làm

| Endpoint | Ghi chú |
|---|---|
| GET /api/admin/payments | `page`/`size`/`userId`/`status`/`createdFrom`/`createdTo`. Row có `userId`, `subscription`, `plan` |
| GET /api/admin/plans | Trả mảng, không phân trang |
| POST /api/admin/plans | `code` bất biến sau khi tạo, tự uppercase |
| PATCH /api/admin/plans/{planId} | 409 nếu tắt `active` của plan FREE |
| DELETE /api/admin/plans/{planId} | Thực chất là deactivate. 409 với FREE |
| GET /api/admin/settings | Trả nhóm `{category, items[{key, value, updatedAt}]}` |
| PATCH /api/admin/settings | `{settings}` — mỗi thay đổi ghi `moderation_log` |

## 27. Admin dashboard — ❌ còn mock

| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/dashboard | ❌ **backend đã có**. `?range`/`from`/`to` → `{range, users{total,newInRange,activeInRange}, content{totalPosts,newPosts,totalRecipes,newRecipes,totalComments,newComments}, engagement{votesInRange,commentsInRange}, moderationQueue{pendingPosts,pendingRecipes,reportedComments}}` |

`features/admin/dashboardApi.ts` vẫn trả số giả — **xoá được ngay**.

---

## Việc cần làm trước (theo thứ tự đề xuất)

1. 🔴 **Sửa `moderatePost` → `approvePost`/`rejectPost`** — hiện nút Duyệt/Từ chối ở
   `/admin/posts` gọi endpoint đã bị xoá.
2. **Dashboard thật** — `GET /api/admin/dashboard` đã có, bỏ mock `dashboardApi.ts`.
3. **Comment thật** — `GET /api/posts/{postId}/comments` đã có, bỏ mock + mở cây reply.
4. **Upload video thật** — thay ô nhập tay `videoUrl` bằng grant → upload → confirm →
   `POST /api/posts/{id}/media`.
5. **Trang profile công khai** — `GET /api/profile/{userId}` + `GET /api/users/{userId}/posts`.
6. **Recipe công khai** — `GET /api/recipes/me`, `GET /api/recipes/{id}`.
7. **Sửa nội dung menu** — `PATCH /api/menus/{menuId}` (giai đoạn B2; tạo + đổi status đã xong).
8. **Admin moderation mới** — `GET /api/admin/posts/{id}` (component list), quản lý
   dish/ingredient (§10b), comment moderation. (Recipe approve/reject đã xong.)
9. **Vote + Search** — `PUT/GET /api/posts/{id}/votes`, `GET /api/search`.
10. **Subscription + Payment** — history/cancel/eligibility, checkout VNPay.
11. **Google OAuth** — `POST /api/auth/google` đã có ở backend.

## Hàm có nhưng chưa nơi nào gọi

| Hàm | Ghi chú |
|---|---|
| `getMedia` | `GET /api/media/{id}` — đã viết, chưa màn hình nào gọi |

## File mock cần xoá khi nối API thật

| File | Dùng bởi | Thay bằng |
|---|---|---|
| `src/features/admin/dashboardApi.ts` | `AdminDashboardPage` | `GET /api/admin/dashboard` |
| `src/features/posts/mockAuthors.ts` | `features/posts/api.ts` | `GET /api/profile/{userId}` |
| `src/features/posts/mockEnrichment.ts` | `features/posts/api.ts` (`enrichListItem`, `enrichDetail`, `getMockComments`, `getMockActivity`) | `GET /api/posts/{id}/comments`, `/related`, `/votes` |
| `src/features/categories/mocks.ts` | `features/admin/dashboardApi.ts` | xoá cùng dashboard mock |
| `src/shared/utils/delay.ts` | `features/admin/dashboardApi.ts`, `src/test/fakeLocationService.ts` | — |
