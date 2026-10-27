# Test Coverage — VEGALIFE Frontend

Suite test frontend: **Vitest 5 + Testing Library + jsdom**. Test gọi **backend thật**
(`VITE_API_BASE_URL` trong `.env`), **không mock API** — nhờ vậy test bắt được cả
sai lệch shape response giữa FE và BE.

Cập nhật: 2026-10-24 · branch `feat/recipes`

> Hướng dẫn cài đặt/biến môi trường chi tiết: `src/test/README.md`.

## Cách chạy

```sh
npm test          # chạy 1 lần
npm run test:watch
npm run test:ui   # cần @vitest/ui
```

`npm run typecheck` (`tsc -b --pretty false`) cũng phủ file test vì `tsconfig.app.json`
có `include: ["src"]`.

## Hạ tầng

| File | Vai trò |
|---|---|
| `vitest.config.ts` | Cấu hình riêng, **cố ý KHÔNG merge** `vite.config.ts`: plugin Tailwind không cần cho test và chỉ làm chậm khởi động. Chỉ giữ plugin React + alias `@/` |
| `src/test/setup.ts` | Ép `api.defaults.adapter = "fetch"`. **Không dùng adapter `http`**: bản browser của axios thay `lib/adapters/http.js` bằng `null` (field `"browser"` trong `node_modules/axios/package.json`) nên sẽ ném *"There is no suitable adapter to dispatch the request"*. `fetch` (undici của Node) cũng không có ràng buộc CORS — jsdom dùng XHR và **áp CORS**, backend thật không mở CORS cho origin test |
| `src/test/storageShim.ts` | Cấp `localStorage`/`sessionStorage` cho môi trường `node`. Phải import **trước** `@/i18n` vì `LanguageDetector` đọc `localStorage` ngay lúc init |
| `src/test/domPolyfills.ts` | Polyfill DOM còn thiếu trong jsdom |
| `src/test/renderWithProviders.tsx` | Bọc `QueryClientProvider` + `MemoryRouter`; `retry: false` để lỗi hiện ngay thay vì chờ backoff |
| `src/test/e2eEnv.ts` | Đọc credential từ env, `signInAs`/`signOut`, `httpStatus`, `REMOTE_TIMEOUT_MS = 60_000` |

Test **service** khai báo `// @vitest-environment node` ở đầu file; mặc định là `jsdom`
cho test screen. TipTap/ProseMirror cần layout engine thật nên bị mock ở test screen.

`testTimeout`/`hookTimeout` = 60s vì backend Render free tier có cold start.

## Biến môi trường

Test tự `skip` khi thiếu biến, nên mặc định chạy được ngay.

| Biến | Mở khoá |
|---|---|
| — | endpoint public (`/api/posts/feed`, `/api/categories`, các case login sai) |
| `E2E_USER_IDENTIFIER` / `E2E_USER_PASSWORD` | suite cần JWT user |
| `E2E_ADMIN_IDENTIFIER` / `E2E_ADMIN_PASSWORD` | suite cần JWT admin |
| `E2E_ALLOW_WRITES=1` | test **tạo/xoá dữ liệu thật** (hiện mới là `it.todo`) |

Trong `.env.test.local` (đã gitignore) phải viết **kèm tiền tố `VITE_`** — Vite chỉ đưa
biến có tiền tố đó vào `import.meta.env`. Set trực tiếp trong shell thì dùng tên **không**
tiền tố. `readEnv` trong `e2eEnv.ts` thử `VITE_<key>` → `<key>` → `process.env[key]`.

## Phân tầng

| Tầng | Cần gì | Đặc điểm |
|---|---|---|
| Public | không | Chạy được ngay ở mọi máy/CI |
| Cần JWT user | `E2E_USER_*` | `describe.skipIf(!HAS_USER)` |
| Cần JWT admin | `E2E_ADMIN_*` | `describe.skipIf(!HAS_ADMIN)` |
| Ghi dữ liệu thật | thêm `E2E_ALLOW_WRITES=1` | `describe.skipIf(..., !E2E_ALLOW_WRITES)`, hiện là `it.todo` |

## 24 file test

### Service (`src/features/*/__tests__/`)

| File | Phủ | Tầng |
|---|---|---|
| `auth/authApi.test.ts` | login/register/verifyEmail/forgotPassword/resendVerifyEmail/resetPassword/verifyPasswordReset | public + user |
| `posts/postApi.test.ts` | `getFeedPosts`, `getPostDetail`, `getMyPosts`, `getPosts`, `moderatePost` | public + user + admin + writes |
| `categories/categoryApi.test.ts` | `getPublicCategories`, `getCategories`, `createCategory`, `updateCategory`, `retireCategory`, `exportCategoriesCsv` | public + admin + writes |
| `locations/locationApi.test.ts` | `features/locations/api` — mock `@/shared/api/client` | public |
| `admin/adminServices.test.ts` | `admin/api` (getUsers/suspend/restore), `videos/api` (getVideos/deleteVideo), `admin/dashboardApi` | admin + **mock** |
| `nutrition-ai/aiApi.test.ts` | `nutrition-ai/api` + `subscriptionApi` — mock client | user |
| `nutrition-ai/useAiChat.test.tsx` | `useAiChat` — gửi 2 lần liên tiếp trong một tick chỉ tạo 1 request | user |
| `recipes/adminApi.test.ts` | `getAdminRecipes` — phân trang 1-based → wire 0-based, whitelist `sort` | admin |

### Logic thuần (`src/features/locations/__tests__/`)

| File | Phủ |
|---|---|
| `distance.test.ts` | `distanceKm`, `formatDistance` (Haversine) |
| `maps.test.ts` | `buildDirectionsUrl`, `openDirections` |
| `openingHours.test.ts` | `formatOpeningHours`, `isOpenNow` |

### Screen (`src/features/**/pages/**/__tests__/`)

| File | Phủ | Tầng |
|---|---|---|
| `auth/pages/LoginPage/` | validate identifier/email, sai thông tin thì không lưu token, điều hướng | public + user |
| `auth/pages/RegisterPage/` | validate 4 ô, từng nhóm ký tự mật khẩu, mismatch, hiện/ẩn mật khẩu | public |
| `posts/pages/PostDetailPage/` | bài không tồn tại → EmptyState, breadcrumb/fact strip khi có bài | public |
| `posts/pages/CreatePostPage/CreatePostPage.test.tsx` | chế độ tạo mới + chế độ sửa, nạp category | public |
| `posts/pages/CreatePostPage/payload.test.ts` | `buildValidationSchema`, `buildContentPayload`, `buildPatch` (thuần logic, không React) | public |
| `recipes/pages/CreateRecipePage/schema.test.ts` | `buildRecipeSchema` + `buildRecipePayload` (thuần logic): field bắt buộc, servings ≥1, ingredients 1..50, trùng tên nguyên liệu, amount >0 ≤3 chữ số lẻ, bỏ field rỗng khi build payload | public |
| `profile/__tests__/dietary.test.ts` | `normalizeTags`, `toDietaryValues`, `buildDietaryPatch` (thuần logic): chuẩn hoá tag, copy mảng, chỉ gửi field đã đổi, xoá hết → `[]`, `healthGoal` trắng → `""` | public |
| `menus/__tests__/week.test.ts` | `toISODate`, `parseISODate`, `startOfWeek`, `addDays`, `weekDays`, `shiftWeek` (thuần logic): parse ra ngày **local** không qua UTC, chuỗi rác/ngày không tồn tại → `Invalid Date`, ranh giới tháng/năm, không sửa Date gốc | public |
| `menus/pages/CreateMealPlanPage/__tests__/schema.test.ts` | `emptyWeek`, `moveWeek`, `dishUsage`, `daysWithMeals`, `mostRepeatedDish`, `validate`, `buildCreateMenuPayload` (thuần logic, 21 case): 7 ngày liên tiếp, giữ món theo vị trí khi đổi tuần, ngày trống, servings 0/1.5/abc, <5 món, >3 lần/món (ưu tiên hơn thiếu món), notes quá dài, bỏ ô trống khỏi payload | public |
| `locations/pages/NearbyPage/` | danh sách + bản đồ, đổi vùng, GPS bị từ chối | public |
| `locations/pages/LocationDetailPage/` | chi tiết địa điểm, giờ mở cửa, chỉ đường | public |
| `locations/pages/AdminLocationsPage/` | CRUD địa điểm với `fakeLocationService` | public |
| `admin/pages/adminPages.test.tsx` | PostsPage/CategoriesPage/UsersPage/VideosPage render + ErrorState | public + admin |
| `admin/pages/AdminDashboardPage/` | skeleton → 4 metric card, số liệu mock khớp | public |

## Điểm đáng lưu ý

- **Test gọi backend thật nên phụ thuộc dữ liệu production.** Assertion viết theo hướng
  bất biến (shape, kiểu, thứ tự sắp xếp) chứ không so giá trị cứng, và luôn có nhánh
  thoát khi backend rỗng (`if (page.content.length === 0) return`).
- **`RegisterPage` test "dữ liệu hợp lệ" cố tình KHÔNG bấm Register** — chỉ gõ rồi
  `user.tab()` và khẳng định không còn `alert`. Tránh tạo tài khoản thật trên production.
- **Một field Formik chỉ hiện được MỘT message lỗi.** `yupToFormErrors` giữ lỗi đầu tiên
  cho mỗi `path` (`if (!getIn(errors, err.path))` trong `node_modules/formik/dist/formik.cjs.development.js`).
  Vì vậy mỗi test mật khẩu chỉ khẳng định **một** nhóm ký tự thiếu.
- **`getUsers` nhận `page` 0-based**, khác mọi service khác (gửi `params.page` thẳng, trả
  `page.page + 1`; `UsersPage` truyền `page - 1`). Test phải truyền `page: 0`.
- **`forgotPassword` / `resendVerifyEmail` / `resetPassword` RESOLVE với email không tồn
  tại** (backend chống dò email). Test dùng `.then(() => undefined, (e) => httpStatus(e))`,
  không dùng `.catch(e => e)` — cách đó trả `undefined` và làm `httpStatus` nổ.

## Chỗ còn thiếu

| Việc | Ghi chú |
|---|---|
| Test ghi dữ liệu thật | mới là `it.todo` ở `posts/api`, `categories/api`, `admin/api`; cần `E2E_ALLOW_WRITES=1` |
| `dashboardService` | test đang khẳng định **dữ liệu mock** (`categoriesSeed` + `delay`). Phải viết lại khi backend có endpoint thật |
| `ProfilePage`, `MyPostsPage`, `ExplorePage`, `HomePage` | chưa có test screen (dietary chỉ test logic, chưa test UI) |
| `MealPlanPage` | chưa có test screen — `week.ts` có test logic, phần render 7 cột/badge/empty chưa phủ |
| `mediaService` (upload grant → confirm) | chưa có test (`shared/api/media.ts`) |
| `useAuth` / `useListParams` / `usePublicCategories` | chưa có test hook |
| `nearbyService`, `AiNutritionPage` | đã nối API thật — cần bổ sung test |
| Số liệu lần chạy gần nhất | **chưa ghi** — lệnh `npm test` bị môi trường chặn ở phiên viết tài liệu này. Chạy lại rồi bổ sung |
