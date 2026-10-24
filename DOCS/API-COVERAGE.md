# API Coverage — VEGALIFE Frontend

Đối chiếu docs/apis (27 nhóm) với code trong `src/features/`, `src/app/routes.tsx`.

Cập nhật: 2026-10-24 · branch `feat/recipes`

> Endpoint nào đã có test tự động: xem `DOCS/TEST-COVERAGE.md`.

## Tổng quan

| Trạng thái | Số endpoint |
|---|---|
| ✅ Đã gọi API thật | 47 |
| ⚠️ Có hàm nhưng chỉ đọc / chưa nối hết UI | 1 |
| ❌ Chưa làm | 23 |

> Đếm lại 2026-10-24 theo đúng các bảng bên dưới (71 dòng endpoint). Mục ⚠️ là
> `GET /api/admin/recipes` — UI đã gọi thật nhưng chỉ đọc. `getMedia` (✅, chưa nơi nào
> gọi) nằm ở mục "Hàm có nhưng chưa nơi nào gọi" cuối file.

## Màn hình đã dựng lại theo UI mới

| Màn hình | Route | Nguồn dữ liệu |
|---|---|---|
| Home | `/` | ✅ `GET /api/posts/feed` + `GET /api/categories` |
| Explore | `/explore` | ✅ feed (search/sort/filter lọc client-side) |
| Post Detail | `/posts/:id` | ✅ `GET /api/posts/{id}` + feed cho "bài liên quan" |
| Create Post | `/posts/create` | ✅ `POST /api/posts` → `PATCH /api/posts/{id}` |
| Edit Post | `/posts/:id/edit` | ✅ `GET /api/posts/{id}` → `PATCH` |
| My Posts | `/my-posts` | ✅ `GET /api/posts` + publish/unpublish/delete |
| Profile | `/profile` | ✅ `GET/PUT /api/profile` (gồm 5 field dietary) + `GET /api/posts` (stats) |
| Login / Register | `/login`, `/register` | ✅ auth (Google OAuth ❌) |
| Nearby | `/nearby` | ✅ `GET /api/locations/nearby` |
| Location Detail | `/nearby/:id` | ✅ `GET /api/locations` (lọc theo id ở client) |
| AI Nutrition | `/ai-nutrition` | ✅ `POST /api/ai/messages` + lịch sử hội thoại + `GET /api/subscriptions/me` |
| Create Recipe | `/recipes/create` | ✅ `POST /api/recipes` + `GET /api/dishes`, `GET /api/ingredients` (gợi ý) |
| Admin Recipes | `/admin/recipes` | ✅ `GET /api/admin/recipes` (chỉ đọc) |
| Meal Plan | `/meal-plan` | ✅ `GET /api/menus/details` (chỉ đọc) |

---

## 1. Register — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/register | `features/auth/api` `register` | RegisterPage |
| POST /api/auth/verify-email | `features/auth/api` `verifyEmail` | VerifyEmailPage |
| POST /api/auth/resend-email | `features/auth/api` `resendVerifyEmail` | VerifyEmailPage |

## 2. Login — ✅ đủ (thiếu OAuth)

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/auth/login | `login` | decode role từ JWT ở LoginPage |
| POST /api/auth/refresh | `refreshAccessToken` | interceptor + timer 14 phút |
| POST /api/auth/logout | `logout` | retry sau refresh khi 401 |
| Google OAuth | ❌ | nút "Continue with Google" chỉ báo `featureDeveloping` |

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
| GET /api/profile/{userId} | ❌ | Chưa có — cần cho trang profile công khai của member khác |
| PUT /api/profile | ✅ `updateProfile` | map camelCase; nhận cả 5 field dietary |

`PUT /api/profile` merge từng field: vắng mặt = giữ nguyên, `[]` = xoá sạch. Nhờ vậy
`DietaryPreferencesSection` (đã mount trong `ProfilePage`, có nút lưu riêng) chỉ gửi
field đã đổi (`buildDietaryPatch`), không đụng height/weight/age của form hồ sơ.
`healthGoal` xoá trắng thì gửi `""`.

ProfilePage stats (`published`/`videos`/`saved`/`contributions`) suy từ `GET /api/posts` 100 bài gần nhất; `saved` luôn 0 vì chưa có API favorites.

## 5. Admin users — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/users | `getUsers` | UsersPage. Gửi `page`/`size`/`sort=createdAt,desc`/`status`; `role` + `createdFrom`/`createdTo` khai báo sẵn nhưng UI chưa dùng |
| POST /api/admin/users/{id}/suspend | `suspendUser` | UsersPage |
| POST /api/admin/users/{id}/restore | `restoreUser` | UsersPage |

⚠️ **`getUsers` nhận `page` 0-based**, khác mọi service khác trong repo: service gửi
thẳng `params.page` và trả `page.page + 1`, nên `UsersPage` phải truyền `page - 1`
(`features/admin/api.ts`, `features/admin/pages/UsersPage/UsersPage.tsx`). Truyền 1-based như các service khác sẽ
lặng lẽ lấy sai trang.

Search `q` lọc client-side **trong trang hiện tại** — backend chưa có tham số tìm kiếm, nên kết quả không đủ nếu user nằm ở trang khác.

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

## 8. Post moderation (Admin) — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/admin/posts | ✅ `getPosts` | PostsPage. Mọi status, có `flag`/`username`/`email`. Hỗ trợ `status`, `flag`, `userId`, `categoryId`, `createdFrom/To`, `sort`. **Luôn gửi `flag=all`** — BE mặc định `NEEDS_REVIEW` nên bỏ trống sẽ giấu hết bài đã duyệt |
| POST /api/admin/posts/{id}/moderate | ✅ `moderatePost` | PostsPage + PostPreviewDialog. `PUBLISH` = Duyệt (mọi status trừ `published`), `UNPUBLISH` = Từ chối (bài `processed`, kèm `reason`) hoặc Ngừng đăng (bài `published`, không reason). `flag` không đổi |
| PATCH /api/posts/{id}/visibility | ❌ bỏ | `hidePost`/`republishPost` đã xoá — `hidden` không còn trong state machine, ẩn bài dùng `UNPUBLISH` |
| DELETE /api/posts/{id} | ✅ `deletePost` | |

→ `q` (tìm kiếm) lọc **trong trang hiện tại** — BE chưa có tham số search cho `/api/admin/posts`.

## 9. Video moderation (Admin) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/videos | `getVideos` | VideosPage |
| DELETE /api/media/{mediaId} | `deleteVideo` | VideosPage |

## 10. Recipe moderation (Admin) — ⚠️ chỉ đọc

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/recipes | `getAdminRecipes` | AdminRecipesPage |

Route `/admin/recipes`. Phân trang thật ở server (`page`/`size`/`sort` + lọc `userId`,
`categoryId`, `createdFrom`, `createdTo`). Backend trả **cả** recipe đã xoá mềm với
`status: "DELETED"` và **không** có tham số lọc theo status hay tìm theo tên — `q` lọc
client-side trên trang hiện tại (xem `ponytail:` trong `features/recipes/adminApi.ts`).

Chưa có (nên không làm UI): sửa / xoá / khôi phục / duyệt – từ chối recipe.
Không có `GET /api/recipes/{id}` → chi tiết recipe render từ row đã tải, không gọi thêm API.

## 10b. Weekly menu — 🟡 chỉ đọc

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/menus/details | ✅ `getMealPlans` | MealPlanPage. Trả **mảng phẳng**, không phân trang |
| GET /api/menus | ❌ | Dành cho trang lịch sử (chưa làm). `page` **0-based**, lọc được `status` |
| POST /api/menus | ❌ | Form tự tạo menu (chưa làm) |
| PATCH /api/menus/{menuId} | ❌ | Sửa menu `drafted`/`scheduled` (chưa làm) |
| POST /api/menus/{menuId}/status | ❌ | schedule/cancel/complete (chưa làm) |

Route `/meal-plan` (cần đăng nhập). Luôn gửi `from`/`to` tường minh — bỏ trống thì
backend lấy tuần hiện tại theo **giờ UTC**, lệch ngày với người dùng múi giờ dương.
`days` trong response **chỉ chứa ngày có bữa** nên UI dựng đủ 7 ô từ `startDate` thay vì
lặp theo `days`. Endpoint không lọc được `status`; `menuId` của user khác trả **404**
(không phải 403, cố ý giấu sự tồn tại — BR-MENU-001).

Việc tạo menu do chatbot AI lo (`MenuTools`: `get_menu`, `get_meal_plan`, `create_menu`,
`update_menu`, `schedule_menu`); prompt AI đã nạp sẵn dietary + BMI từ profile.

## 11. Comment moderation (Admin) — ❌ chưa làm
| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/comments | ❌ |

## 12. Payment / subscription moderation (Admin) — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/payments | ❌ |

## 13. Home feeds — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/posts/feed | `getFeedPosts` | HomePage, ExplorePage, PostDetailPage (related) |

## 14. Post detail — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId} | ✅ `getPostDetail` | PostDetailPage, CreatePostPage (edit mode) |

Bài chỉ trả `categoryIds` → PostDetailPage tra tên qua `GET /api/categories` (fallback hiện UUID).
Nhãn trạng thái dùng `PostStatusBadge` (i18n `common:postStatus.*`).

## 15–17. Search / Comment / Vote — ⚠️ chỉ có tạo comment

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| POST /api/posts/{postId}/comments | ✅ `createComment` | PostDetailPage — form chỉ hiện khi đăng nhập |
| GET comment public | ❌ (issue #41) | Danh sách vẫn mock; comment vừa gửi chỉ hiện tạm ở client |
| Search / Vote | ❌ backend chưa có API | |

ExplorePage: `q` / tab / sort lọc **client-side** trên 60 bài feed (xem `ponytail:` trong `ExplorePage.tsx`). Nút bookmark là UI tĩnh.
Reply lồng (`parentId`) đã có ở service, UI chưa mở — chờ GET để hiển thị cây comment.

## 18. My posts — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts | ✅ `getMyPosts` | MyPostsPage, ProfilePage. Lọc `q`/`status` client-side trên 100 bài |
| GET /api/users/{userId}/posts | ❌ | Chưa có — cần cho profile công khai |
| PATCH /api/posts/{id} `{publish}` | ✅ `unpublishPost` | MyPostsPage. `publishPost` không dùng — hệ thống tự publish |
| DELETE /api/posts/{postId} | ✅ `deletePost` | MyPostsPage, Admin PostsPage |

MyPostsPage: draft (`created`) không sửa/xoá được — chỉ chờ hệ thống tự kiểm tra và publish; sửa/xoá/ngừng đăng chỉ mở khi `status === "published"`.

MyPostsPage tabs My Videos / Saved Recipes / My Activity → `unsupported` (chờ API).

## 19. My videos — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| (chưa có trong docs) | ❌ |

## 20. My favorite recipe — ✅ tạo công thức

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/recipes | ✅ `createRecipe` | CreateRecipePage |
| GET /api/dishes | ✅ `searchDishes` | gợi ý tên món trong form |
| GET /api/ingredients | ✅ `searchIngredients` | gợi ý tên nguyên liệu trong form |

Route `/recipes/create` (`ProtectedRoute`). Chưa có: sửa/xoá recipe, trang danh sách/chi tiết
recipe công khai (thiếu `GET /api/recipes`), gán recipe vào bài viết (`POST /api/posts/{id}/recipes`).
Admin xem danh sách recipe qua `GET /api/admin/recipes` — xem §10.

## 21. Create/edit post — ✅ đủ luồng chính

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/posts | ✅ `createPost` | CreatePostPage (bước 5) |
| PATCH /api/posts/{postId} | ✅ `updatePost` | CreatePostPage (tạo + sửa) |
| POST /api/media/upload | ✅ `createUploadGrant` | `components/common/ImageUploader` |
| (upload thẳng provider) | ✅ `uploadFileToProvider` | |
| POST /api/media/{id}/confirm | ✅ `confirmUpload` | |
| GET /api/media/{id} | ✅ `getMedia` | chưa nơi nào gọi |

Wizard 5 bước: Content Format → Title → Categorization → Cover Media → Article Content, kèm sidebar Publishing Checklist + AI Nutrition Snapshot (số liệu tĩnh).

Còn thiếu: **upload video thật** — form vẫn nhập tay `videoUrl` / `mediaId`.

## 22–23. Nearby location / Location detail — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/locations/nearby | `getNearbyLocations` | NearbyPage |
| GET /api/locations | `getLocations` | AdminLocationsPage |
| GET /api/admin/locations/{id} | ❌ backend chưa có | LocationDetailPage dùng `getLocationById` = lấy 100 địa điểm rồi lọc ở client (`ponytail:` trong `api.ts`) |
| POST /api/admin/locations | `createLocation` | AdminLocationsPage |
| PATCH /api/admin/locations/{id} | `updateLocation` | AdminLocationsPage |
| DELETE /api/admin/locations/{id} | `deleteLocation` | AdminLocationsPage |

Bản đồ: react-leaflet (`features/locations/components/PlaceMap.tsx`).

## 24. AI Chatbot — 🟡 UI + API xong, SSE chưa

| Endpoint | Trạng thái |
|---|---|
| POST /api/ai/messages | ✅ `sendAiMessage` |
| POST /api/ai/messages/stream | ❌ chưa dùng — cần `fetch` + `getReader()`, xem `ponytail:` trong `features/nutrition-ai/api.ts` |
| GET /api/ai/conversations | ✅ `getAiConversations` |
| GET /api/ai/conversations/{id} | ✅ `getAiConversation` |

`useAiChat` giữ state chat; khách chưa đăng nhập bị chặn ở ô nhập (mọi endpoint cần JWT).

## 25. AI Subscription — 🟡 chỉ đọc gói hiện tại

| Endpoint | Trạng thái |
|---|---|
| GET /api/subscriptions | ❌ chưa dùng |
| GET /api/subscriptions/me | ✅ `getMySubscription` |
| GET /api/subscriptions/me/history | ❌ chưa làm |
| POST /api/subscriptions/me/cancel | ❌ chưa làm |
| POST /api/subscriptions/me/purchase/eligibility | ❌ chưa làm |

## 26. Payment (VNPay) — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| POST /api/payments/checkout | ❌ |
| GET /api/payments | ❌ |
| GET /api/payments/{paymentId} | ❌ |
| GET/POST /api/payments/vnpay/ipn | — backend-only, FE không gọi |

---

## Việc cần làm trước (theo thứ tự đề xuất)

1. **Upload video thật** — thay 2 ô nhập tay `videoUrl`/`mediaId` bằng luồng grant → upload → confirm.
2. **GET comment public (issue #41)** — mở cây reply lồng, bỏ mock `getPostComments`.
3. **Backend thêm filter cho `GET /api/posts`** (`q`, `status`, `type`, sort) — bỏ lọc client-side ở ExplorePage / MyPostsPage.
4. **GET /api/profile/{userId} + GET /api/users/{userId}/posts** — trang profile công khai.
5. **Dashboard stats** — `features/admin/dashboardApi.ts` còn mock `categoriesSeed`.
6. **Recipe còn thiếu** — `GET /api/recipes` (danh sách công khai), `GET /api/recipes/{id}`,
   `PUT`/`DELETE` recipe, `POST /api/posts/{id}/recipes` (gán recipe vào bài).
7. Các nhóm 11–12, 19, 26: chưa có service, làm mới từ đầu.

## Hàm có nhưng chưa nơi nào gọi

| Hàm | Ghi chú |
|---|---|
| `getMedia` | `GET /api/media/{id}` — đã viết, chưa màn hình nào gọi |

## File mock cần xoá khi nối API thật

| File | Dùng bởi |
|---|---|
| `src/features/categories/mocks.ts` | `features/admin/dashboardApi.ts` |
| `src/features/posts/mockAuthors.ts` | `features/posts/api.ts` |
| `src/features/posts/mockEnrichment.ts` | `features/posts/api.ts` (`enrichListItem`, `enrichDetail`, `getMockComments`, `getMockActivity`) |
| `src/shared/utils/delay.ts` | **2** file: `features/admin/dashboardApi.ts`, `src/test/fakeLocationService.ts` |

`src/shared/mocks/posts.ts` và `src/shared/mocks/videos.ts` đã xoá khỏi repo.
