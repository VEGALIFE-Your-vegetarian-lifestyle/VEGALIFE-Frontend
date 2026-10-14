# Test Coverage — VEGALIFE Frontend

Suite test frontend: **Vitest 5 + Testing Library + jsdom**. Test gọi **backend thật**
(`VITE_API_BASE_URL` trong `.env`), **không mock API** — nhờ vậy test bắt được cả
sai lệch shape response giữa FE và BE.

Cập nhật: 2026-10-14 · branch `feat/post-management-user`

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

## 11 file test

### Service (`src/services/__tests__/`)

| File | Phủ | Tầng |
|---|---|---|
| `authService.test.ts` | login/register/verifyEmail/forgotPassword/resendVerifyEmail/resetPassword/verifyPasswordReset | public + user |
| `postService.test.ts` | `getFeedPosts`, `getPostDetail`, `getMyPosts`, `getPosts`, `moderatePost` | public + user + admin + writes |
| `categoryService.test.ts` | `getPublicCategories`, `getCategories`, `createCategory`, `updateCategory`, `retireCategory`, `exportCategoriesCsv` | public + admin + writes |
| `adminServices.test.ts` | `adminUserService` (getUsers/suspend/restore), `videoService` (getVideos/deleteVideo), `dashboardService` | admin + **mock** |

### Screen (`src/pages/**/__tests__/`)

| File | Phủ | Tầng |
|---|---|---|
| `auth/LoginPage/LoginPage.test.tsx` | validate identifier/email, sai thông tin thì không lưu token, điều hướng | public + user |
| `auth/RegisterPage/RegisterPage.test.tsx` | validate 4 ô, từng nhóm ký tự mật khẩu, mismatch, hiện/ẩn mật khẩu | public |
| `PostDetailPage/PostDetailPage.test.tsx` | bài không tồn tại → EmptyState, breadcrumb/fact strip khi có bài | public |
| `CreatePostPage/CreatePostPage.test.tsx` | chế độ tạo mới + chế độ sửa, nạp category | public |
| `CreatePostPage/payload.test.ts` | `buildValidationSchema`, `buildContentPayload`, `buildPatch` (thuần logic, không React) | public |
| `Admin/adminPages.test.tsx` | PostsPage/CategoriesPage/UsersPage/VideosPage render + ErrorState | public + admin |
| `Admin/AdminDashboardPage/AdminDashboardPage.test.tsx` | skeleton → 4 metric card, số liệu mock khớp | public |

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
| Test ghi dữ liệu thật | mới là `it.todo` ở `postService`, `categoryService`, `adminServices`; cần `E2E_ALLOW_WRITES=1` |
| `dashboardService` | test đang khẳng định **dữ liệu mock** (`categoriesSeed` + `delay`). Phải viết lại khi backend có endpoint thật |
| `ProfilePage`, `MyPostsPage`, `ExplorePage`, `HomePage` | chưa có test screen |
| `mediaService` (upload grant → confirm) | chưa có test |
| `useAuth` / `useListParams` / `usePublicCategories` | chưa có test hook |
| `nearbyService`, `AiNutritionPage` | mock — chờ API rồi mới test |
| Số liệu lần chạy gần nhất | **chưa ghi** — lệnh `npm test` bị môi trường chặn ở phiên viết tài liệu này. Chạy lại rồi bổ sung |
