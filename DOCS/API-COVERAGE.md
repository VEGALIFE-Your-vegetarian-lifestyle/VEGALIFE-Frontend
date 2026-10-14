# API Coverage — VEGALIFE Frontend

Đối chiếu docs/apis (26 nhóm) với code trong `src/services/`, `src/pages/`, `src/routes/`.

Cập nhật: 2026-10-14 · branch `feat/post-management-user`

> Endpoint nào đã có test tự động: xem `DOCS/TEST-COVERAGE.md`.

## Tổng quan

| Trạng thái | Số endpoint |
|---|---|
| ✅ Đã gọi API thật | 35 |
| ⚠️ Có hàm nhưng chưa nối UI / còn mock | 3 |
| ❌ Chưa làm | 23 |

> Con số ✅ trước đây ghi 28, không khớp với chính các bảng trong tài liệu này
> (cộng lại ra 35). Đã đếm lại theo bảng bên dưới.

## Màn hình đã dựng lại theo UI mới

| Màn hình | Route | Nguồn dữ liệu |
|---|---|---|
| Home | `/` | ✅ `GET /api/posts/feed` + `GET /api/categories` |
| Explore | `/explore` | ✅ feed (search/sort/filter lọc client-side) |
| Post Detail | `/posts/:id` | ✅ `GET /api/posts/{id}` + feed cho "bài liên quan" |
| Create Post | `/posts/create` | ✅ `POST /api/posts` → `PATCH /api/posts/{id}` |
| Edit Post | `/posts/:id/edit` | ✅ `GET /api/posts/{id}` → `PATCH` |
| My Posts | `/my-posts` | ✅ `GET /api/posts` + publish/unpublish/delete |
| Profile | `/profile` | ✅ `GET/PUT /api/profile` + `GET /api/posts` (stats) |
| Login / Register | `/login`, `/register` | ✅ auth (Google OAuth ❌) |
| Nearby | `/nearby` | 🟡 mock `nearbyService` |
| Location Detail | `/nearby/:id` | 🟡 mock `nearbyService` |
| AI Nutrition | `/ai-nutrition` | 🟡 trả lời tĩnh |

---

## 1. Register — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/register | `authService.register` | RegisterPage |
| POST /api/auth/verify-email | `authService.verifyEmail` | VerifyEmailPage |
| POST /api/auth/resend-email | `authService.resendVerifyEmail` | VerifyEmailPage |

## 2. Login — ✅ đủ (thiếu OAuth)

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/auth/login | `authService.login` | decode role từ JWT ở LoginPage |
| POST /api/auth/refresh | `api.refreshAccessToken` | interceptor + timer 14 phút |
| POST /api/auth/logout | `authService.logout` | retry sau refresh khi 401 |
| Google OAuth | ❌ | nút "Continue with Google" chỉ báo `featureDeveloping` |

LoginPage + RegisterPage dùng chung tab switcher; AuthLayout dùng namespace `auth` (`split.*`, `tabs.*`, `google`, `guest`).

## 3. Forgot password — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| POST /api/auth/forgot-password | `authService.forgotPassword` | ForgotPasswordPage |
| POST /api/auth/verify-password-reset | `authService.verifyPasswordReset` | ForgotPasswordPage |
| POST /api/auth/reset-password | `authService.resetPassword` | ForgotPasswordPage |

## 4. User profile management — ⚠️ thiếu 1

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/profile | ✅ `profileService.getProfile` | ProfilePage, MyPostsPage (header) |
| GET /api/profile/{userId} | ❌ | Chưa có — cần cho trang profile công khai của member khác |
| PUT /api/profile | ✅ `profileService.updateProfile` | map snake_case ↔ camelCase |

ProfilePage stats (`published`/`videos`/`saved`/`contributions`) suy từ `GET /api/posts` 100 bài gần nhất; `saved` luôn 0 vì chưa có API favorites.

## 5. Admin users — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/admin/users | `adminUserService.getUsers` | UsersPage. Gửi `page`/`size`/`sort=createdAt,desc`/`status`; `role` + `createdFrom`/`createdTo` khai báo sẵn nhưng UI chưa dùng |
| POST /api/admin/users/{id}/suspend | `adminUserService.suspendUser` | UsersPage |
| POST /api/admin/users/{id}/restore | `adminUserService.restoreUser` | UsersPage |

⚠️ **`getUsers` nhận `page` 0-based**, khác mọi service khác trong repo: service gửi
thẳng `params.page` và trả `page.page + 1`, nên `UsersPage` phải truyền `page - 1`
(`adminUserService.ts:18`, `UsersPage.tsx:37`). Truyền 1-based như các service khác sẽ
lặng lẽ lấy sai trang.

Search `q` lọc client-side **trong trang hiện tại** — backend chưa có tham số tìm kiếm, nên kết quả không đủ nếu user nằm ở trang khác.

## 6. Category management (Admin) — ✅ đủ theo backend

| Endpoint | Hàm | Ghi chú |
|---|---|---|
| POST /api/admin/categories | `categoryService.createCategory` | |
| PATCH /api/admin/categories/{id} | `categoryService.updateCategory` | |
| DELETE /api/admin/categories/{id} | `categoryService.retireCategory` | soft delete |
| GET /api/admin/categories | ❌ (backend chưa có) | `getCategories` dùng tạm `GET /api/categories` rồi tự sort ở client (`categoryService.ts:51-76`) → **không thấy được category đã retire** |

CategoriesPage hiện có: 2 thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`,
phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete —
backend chưa có endpoint (`ponytail:` ở `categoryService.ts:104`).

## 7. Content categories (public) — ✅ đủ

| Endpoint | Hàm | UI |
|---|---|---|
| GET /api/categories | `categoryService.getPublicCategories` | HomePage, ExplorePage, CreatePostPage, CategoriesPage |

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
| GET /api/admin/videos | `videoService.getVideos` | VideosPage |
| DELETE /api/media/{mediaId} | `videoService.deleteVideo` | VideosPage |

## 10. Recipe moderation (Admin) — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| GET /api/admin/recipes | ❌ |

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
| GET /api/posts/feed | `postService.getFeedPosts` | HomePage, ExplorePage, PostDetailPage (related) |

## 14. Post detail — ✅ đủ

| Endpoint | Trạng thái | Ghi chú |
|---|---|---|
| GET /api/posts/{postId} | ✅ `postService.getPostDetail` | PostDetailPage, CreatePostPage (edit mode) |

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
| GET /api/posts | ✅ `postService.getMyPosts` | MyPostsPage, ProfilePage. Lọc `q`/`status` client-side trên 100 bài |
| GET /api/users/{userId}/posts | ❌ | Chưa có — cần cho profile công khai |
| PATCH /api/posts/{id} `{publish}` | ✅ `unpublishPost` | MyPostsPage. `publishPost` không dùng — hệ thống tự publish |
| DELETE /api/posts/{postId} | ✅ `deletePost` | MyPostsPage, Admin PostsPage |

MyPostsPage: draft (`created`) không sửa/xoá được — chỉ chờ hệ thống tự kiểm tra và publish; sửa/xoá/ngừng đăng chỉ mở khi `status === "published"`.

MyPostsPage tabs My Videos / Saved Recipes / My Activity → `unsupported` (chờ API).

## 19. My videos — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| (chưa có trong docs) | ❌ |

## 20. My favorite recipe — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| POST /api/recipes | ❌ |
| GET /api/dishes | ❌ |
| GET /api/ingredients | ❌ |

## 21. Create/edit post — ✅ đủ luồng chính

| Endpoint | Trạng thái | UI |
|---|---|---|
| POST /api/posts | ✅ `createPost` | CreatePostPage (bước 5) |
| PATCH /api/posts/{postId} | ✅ `updatePost` | CreatePostPage (tạo + sửa) |
| POST /api/media/upload | ✅ `mediaService.createUploadGrant` | `ImageUploader` |
| (upload thẳng provider) | ✅ `uploadFileToProvider` | |
| POST /api/media/{id}/confirm | ✅ `confirmUpload` | |
| GET /api/media/{id} | ✅ `getMedia` | chưa nơi nào gọi |

Wizard 5 bước: Content Format → Title → Categorization → Cover Media → Article Content, kèm sidebar Publishing Checklist + AI Nutrition Snapshot (số liệu tĩnh).

Còn thiếu: **upload video thật** — form vẫn nhập tay `videoUrl` / `mediaId`.

## 22–23. Nearby location / Location detail — 🟡 UI xong, chờ API

`nearbyService.ts` mock 5 địa điểm + 1 chi tiết; đổi phần thân service là xong, UI không phải sửa.
Bản đồ là placeholder (`ponytail:` trong `NearbyPage.tsx`).

## 24. AI Chatbot — 🟡 UI xong, chờ API

| Endpoint | Trạng thái |
|---|---|
| POST /api/ai/messages | ❌ |
| POST /api/ai/messages/stream | ❌ |
| GET /api/ai/conversations | ❌ |
| GET /api/ai/conversations/{id} | ❌ |

`AiNutritionPage` trả lời bằng chuỗi tĩnh; BMI & protein target tính client-side.

## 25. AI Subscription — ❌ chưa làm

| Endpoint | Trạng thái |
|---|---|
| GET /api/subscriptions | ❌ |
| GET /api/subscriptions/me | ❌ |
| GET /api/subscriptions/me/history | ❌ |
| POST /api/subscriptions/me/cancel | ❌ |
| POST /api/subscriptions/me/purchase/eligibility | ❌ |

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
5. **Dashboard stats** — `dashboardService` còn mock `categoriesSeed`.
6. Các nhóm 10–12, 19–20, 24–26: chưa có service, làm mới từ đầu.

## Hàm có nhưng chưa nơi nào gọi

| Hàm | Ghi chú |
|---|---|
| `mediaService.getMedia` | `GET /api/media/{id}` — đã viết, chưa màn hình nào gọi |

## File mock cần xoá khi nối API thật

| File | Dùng bởi |
|---|---|
| `src/shared/mocks/categories.ts` | `dashboardService.ts` |
| `src/shared/mocks/authors.ts` | `postService.ts` |
| `src/shared/mocks/postEnrichment.ts` | `postService.ts` (`enrichListItem`, `enrichDetail`, `getMockComments`, `getMockActivity`) |
| `src/services/nearbyService.ts` | NearbyPage, LocationDetailPage (chờ API nhóm 22–23) |
| `src/utils/delay.ts` | **3** service: `dashboardService`, `postService`, `nearbyService` |

`src/shared/mocks/posts.ts` và `src/shared/mocks/videos.ts` đã xoá khỏi repo.
