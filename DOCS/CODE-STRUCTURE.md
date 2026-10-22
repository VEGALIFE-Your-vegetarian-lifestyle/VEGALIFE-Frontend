# Cấu trúc source code — VEGALIFE Frontend

> Cập nhật: 2026-10-22 · Branch: `refactor/source-structure`
> Kiến trúc **feature-based**. **148 file `.ts`/`.tsx`** trong **61 thư mục** dưới `src/`.
> Plan gốc: [PLAN-REFACTOR.md](PLAN-REFACTOR.md).

## 1. Cây thư mục

```text
VEGALIFE-Frontend/
├── DOCS/                        tài liệu dự án (SRS, API coverage, design, plan, test)
├── public/                      tài nguyên tĩnh, Vite copy nguyên sang dist/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── index.css                Tailwind v4 + design token (@theme)
│   │
│   ├── app/                     hạ tầng khởi động — KHÔNG chứa nghiệp vụ
│   │   ├── main.tsx             entry: StrictMode + QueryClientProvider + BrowserRouter + Toaster
│   │   ├── App.tsx              chỉ render <AppRoutes />
│   │   ├── routes.tsx           toàn bộ route (Layout / public auth / admin)
│   │   ├── NotFoundPage.tsx     404
│   │   ├── guards/
│   │   │   ├── ProtectedRoute.tsx   cần đăng nhập
│   │   │   ├── AdminRoute.tsx       cần role ADMIN
│   │   │   └── PublicRoute.tsx      đã đăng nhập thì đá về trang chủ/admin
│   │   └── layout/
│   │       ├── Layout.tsx           khung chung: Navbar + <Outlet/> + Footer
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── LanguageSwitcher.tsx
│   │
│   ├── components/              dùng chung, KHÔNG biết gì về domain
│   │   ├── ui/                  11 primitive (CVA variants) — không đụng khi refactor
│   │   │   ├── button.tsx       variants primary/secondary/outline/ghost/destructive/soft/white
│   │   │   ├── input.tsx        có leadingIcon + trailing
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── pill-tabs.tsx
│   │   └── common/              10 component ghép sẵn theo pattern của app
│   │       ├── PageHeader.tsx       tiêu đề trang + slot action
│   │       ├── SectionCard.tsx      khối nội dung có tiêu đề
│   │       ├── StatCard.tsx         ô số liệu
│   │       ├── EmptyState.tsx       trạng thái rỗng
│   │       ├── ErrorState.tsx       trạng thái lỗi + nút thử lại
│   │       ├── TableSkeleton.tsx    skeleton cho bảng
│   │       ├── Pagination.tsx       phân trang
│   │       ├── ConfirmDialog.tsx    hộp thoại xác nhận
│   │       ├── FormField.tsx        label + control + message lỗi
│   │       └── ImageUploader.tsx    upload + preview + progress
│   │
│   ├── features/                nghiệp vụ theo domain
│   │   ├── admin/               xem mục 3.1
│   │   ├── auth/                xem mục 3.2
│   │   ├── categories/          xem mục 3.3
│   │   ├── locations/           xem mục 3.4
│   │   ├── nutrition-ai/        xem mục 3.5
│   │   ├── posts/               xem mục 3.6
│   │   ├── profile/             xem mục 3.7
│   │   └── videos/              xem mục 3.8
│   │
│   ├── i18n/
│   │   ├── index.ts             khởi tạo i18next, đăng ký 11 namespace
│   │   └── locales/{en,vi}/     11 namespace mỗi thứ tiếng, key phải khớp nhau
│   │       admin · aiNutrition · auth · common · explore · home ·
│   │       location · nearby · post · profile · validation
│   │
│   ├── shared/                  hạ tầng dùng chung, KHÔNG import features/ hay components/
│   │   ├── api/
│   │   │   ├── client.ts            axios instance + interceptor 401/refresh + refresh chủ động
│   │   │   └── media.ts             xin thông tin upload + upload file
│   │   ├── auth/authStore.ts        user/accessToken/refreshToken, persist theo rememberMe
│   │   ├── hooks/
│   │   │   ├── useListParams.ts     page/filter/search ↔ URL query
│   │   │   └── useDebounce.ts       debounce giá trị (mặc định 300ms)
│   │   ├── types/
│   │   │   ├── common.ts            ApiResponse, Paginated, PageResponse, ListParams
│   │   │   ├── user.ts              User, UserProfile, role, status, gender
│   │   │   └── media.ts
│   │   ├── ui/uiStore.ts            ngôn ngữ, state UI toàn cục
│   │   └── utils/
│   │       ├── apiError.ts          getApiErrorMessage(error, fallback)
│   │       ├── formatDate.ts        formatDateLocale, estimateReadMinutes
│   │       ├── jwt.ts               decode JWT lấy role
│   │       ├── delay.ts             giả lập độ trễ cho mock
│   │       └── cn.ts                cn() — ghép className
│   │
│   └── test/                    hạ tầng test (xem mục 4)
│
├── index.html                   script src → /src/app/main.tsx
├── vite.config.ts               alias @/ → src/, proxy /api, plugin tailwind
├── vitest.config.ts             jsdom mặc định, setup src/test/setup.ts
├── tsconfig.json / .app.json / .node.json
├── eslint.config.js
├── tailwind.config.js
└── package.json                 dev · build · typecheck · test · lint
```

## 2. Quy tắc import

```text
app/         →  features/**, shared/**, components/**
features/X/  →  shared/**, components/**, features/<X phụ thuộc>/**
shared/      →  ✗ KHÔNG import features/**, components/**
components/  →  ✗ KHÔNG import features/**
```

Phụ thuộc giữa feature, một chiều:

```text
admin          → posts, categories, videos, locations, profile
posts          → categories, auth
profile        → auth
nutrition-ai, videos, categories, locations → auth
```

**Ngoại lệ đã ghi nhận**: `features/profile/ProfilePage.tsx` import `getMyPosts`
từ `features/posts/api` cho thẻ thống kê (backend chưa có endpoint thống kê hồ sơ).
Có `ponytail:` tại chỗ; gỡ khi backend bổ sung endpoint.

## 3. Features

### 3.1 `features/admin/`

| File | Vai trò |
|---|---|
| `AdminShell.tsx` | layout admin: header + sidebar + nested `<Outlet/>` |
| `api.ts` | danh sách/khoá/mở user |
| `dashboardApi.ts` | số liệu dashboard — **mock** (`categoriesSeed`), backend chưa có endpoint |
| `types.ts` | `DashboardStats` |
| `pages/AdminDashboardPage/` | `AdminDashboardPage.tsx`, `__tests__/` |
| `pages/PostsPage/` | `PostsPage.tsx` (duyệt/từ chối), `PostPreviewDialog.tsx`, `RejectPostDialog.tsx` |
| `pages/UsersPage/` | `UsersPage.tsx` — danh sách/khoá user |
| `pages/__tests__/adminPages.test.tsx` | test chung vài trang admin |
| `__tests__/adminServices.test.ts` | test `api.ts` + `dashboardApi.ts` |

### 3.2 `features/auth/`

| File | Vai trò |
|---|---|
| `api.ts` | register/login/verify/forgot/reset/refresh/revoke |
| `useAuth.ts` | đọc authStore, `useLogout` (revoke token trước khi xoá state) |
| `AuthLayout.tsx` | khung 2 cột cho login/register/verify/forgot |
| `pages/LoginPage/` | `LoginPage.tsx`, `__tests__/` |
| `pages/RegisterPage/` | `RegisterPage.tsx`, `__tests__/` |
| `pages/VerifyEmailPage/` | `VerifyEmailPage.tsx` |
| `pages/ForgotPasswordPage/` | `ForgotPasswordPage.tsx` |
| `__tests__/authApi.test.ts` | test service auth |

> `authStore` nằm ở `shared/auth/` chứ không ở đây — tránh vòng import
> `shared/api/client ↔ authStore` lan sang feature.

### 3.3 `features/categories/`

| File | Vai trò |
|---|---|
| `CategoriesPage.tsx` | đếm, tìm, sort, phân trang, retire, export CSV |
| `CategoryFormDialog.tsx` | tạo/sửa category |
| `api.ts` | category công khai + admin |
| `usePublicCategories.ts` | danh sách category công khai + `useCategoryNames` (cache dùng chung) |
| `types.ts`, `mocks.ts` | kiểu + dữ liệu seed cho dashboard mock |
| `__tests__/categoryApi.test.ts` | test service category |

### 3.4 `features/locations/`

| File | Vai trò |
|---|---|
| `api.ts` | CRUD địa điểm + nearby |
| `nearbyApi.ts` | bọc `api.ts`, thêm giờ mở cửa đã format |
| `nearbyTypes.ts` | `NearbyPlaceDetail = LocationItem + giờ mở cửa` |
| `openingHours.ts` | `formatOpeningHours`, `isOpenNow` |
| `geo.ts` | `useGeolocation`, `distanceKm`, `formatDistance`, `buildDirectionsUrl`, `openDirections`, `Coordinates` |
| `mocks.ts` | `MOCK_AREAS` — toạ độ tâm các quận TP.HCM để chọn khi chưa cấp GPS |
| `types.ts` | `LocationItem`, `LocationType`, `OpeningHours`, payload, params |
| `components/PlaceMap.tsx` | react-leaflet, divIcon, marker địa điểm |
| `pages/NearbyPage.tsx` | tìm địa điểm theo vị trí |
| `pages/LocationDetailPage.tsx` | chi tiết địa điểm + chỉ đường |
| `pages/AdminLocationsPage/` | `LocationsPage.tsx`, `LocationFormDialog.tsx` |
| `__tests__/` | `distance`, `maps`, `openingHours`, `locationApi` |
| `pages/__tests__/` | `NearbyPage`, `LocationDetailPage` |
| `pages/AdminLocationsPage/__tests__/` | `LocationsPage` |

### 3.5 `features/nutrition-ai/`

| File | Vai trò |
|---|---|
| `AiNutritionPage.tsx` | header + sidebar (lịch sử, BMI, swaps, quota) |
| `ChatPanel.tsx` | khung chat, ô nhập, đếm ký tự, banner lỗi |
| `api.ts` | gửi tin, danh sách, chi tiết hội thoại |
| `subscriptionApi.ts` | gói AI hiện tại |
| `useAiChat.ts` | state khung chat + query hội thoại + mutation gửi |
| `useSubscription.ts` | `useQuery` gói AI hiện tại |
| `types.ts` | `AiUsage`, hội thoại, plan, subscription, `MAX_MESSAGE_LENGTH` |
| `__tests__/` | `useAiChat.test.tsx`, `aiApi.test.ts` |

### 3.6 `features/posts/`

| File | Vai trò |
|---|---|
| `api.ts` | feed, CRUD bài, duyệt/từ chối, bình luận |
| `useFeedPosts.ts` | `useQuery` cho feed |
| `types.ts` | `Post`, `PostStatus`, `PostFlag`, `JSONContent`, kiểu request/response |
| `constants.ts` | `POST_STATUS_VARIANT`, `POST_FLAG_VARIANT`, `canPublish`, `canUnpublish` |
| `mockEnrichment.ts` | điền field mock (dinh dưỡng, nguyên liệu, bước, tip) |
| `mockAuthors.ts` | thẻ tác giả giả |
| `components/PostCard.tsx` | card bài (có `PostCardCompact`) |
| `components/PostStatusBadge.tsx` | badge trạng thái |
| `components/editor/` | `RichTextEditor.tsx`, `EditorToolbar.tsx`, `PostContent.tsx`, `editorContent.ts` |
| `pages/HomePage/` | trang chủ |
| `pages/ExplorePage/` | danh sách bài, filter + phân trang |
| `pages/MyPostsPage/` | bài của tôi |
| `pages/PostDetailPage/` | `PostDetailPage.tsx` + `FactStrip`, `IngredientsCard`, `InstructionsCard`, `ChefSecretCard`, `CommentsSection`, `__tests__/` |
| `pages/CreatePostPage/` | `CreatePostPage.tsx`, `schema.ts`, `payload.ts`, `ContentFormatSelector.tsx`, `PostSidebar.tsx`, `__tests__/` |
| `__tests__/postApi.test.ts` | test service post |

### 3.7 `features/profile/`

| File | Vai trò |
|---|---|
| `ProfilePage.tsx` | hồ sơ (`embedded` để nhúng vào admin) |
| `api.ts` | đọc/cập nhật profile (chuẩn hoá snake_case ↔ camelCase) |
| `useProfile.ts` | query + mutation cập nhật profile |

### 3.8 `features/videos/`

| File | Vai trò |
|---|---|
| `VideosPage.tsx` | quản lý video (admin) |
| `api.ts` | video công khai + admin |
| `constants.ts` | `VIDEO_STATUS_VARIANT`, `VIDEO_STATUSES` |
| `types.ts` | `Video`, `VideoStatus` |

## 4. Hạ tầng test (`src/test/`)

| File | Vai trò |
|---|---|
| `setup.ts` | setup toàn cục: polyfill, ép axios sang adapter `fetch` (jsdom áp CORS, backend không mở) |
| `README.md` | hướng dẫn chạy test + biến môi trường E2E |
| `e2eEnv.ts` | đọc credential E2E, tự `skip` khi thiếu |
| `renderWithProviders.tsx` | `createTestQueryClient`, `renderWithProviders` |
| `domPolyfills.ts` | bù API jsdom thiếu (`matchMedia`…) |
| `storageShim.ts` | `localStorage`/`sessionStorage` cho môi trường `node` |
| `fakeLocationService.ts` | bản giả `features/locations/api`, cùng chữ ký hàm |
| `locationFixtures.ts` | 12 địa điểm mẫu quanh TP.HCM |

Test service chạy `node` (`// @vitest-environment node`), test screen chạy `jsdom`.
Chi tiết phân tầng: [src/test/README.md](../src/test/README.md).

## 5. Đường đi của một request

```text
features/<X>/pages/* hoặc components/*
  → features/<X>/use*.ts (React Query)
    → features/<X>/api.ts    unwrap { success, message, data }
      → shared/api/client.ts  gắn Bearer, gặp 401 thì refresh rồi gọi lại
        → /api/*              proxy Vite → vegalife-backend.onrender.com
```

Lỗi hiển thị: `getApiErrorMessage(error, t("..."))` — đọc `errors[]` → `message` → fallback.

## 6. Thật vs mock

- **Gọi API thật**: auth, posts, categories, profile, media, videos, admin users, locations.
- **Còn mock**: `features/admin/dashboardApi.ts` (backend chưa có endpoint dashboard);
  `features/posts/{mockEnrichment,mockAuthors}.ts` (field hiển thị BE chưa trả).
- `features/locations/mocks.ts` **không phải** mock API — chỉ là toạ độ tâm các quận
  TP.HCM để chọn vùng khi người dùng chưa cấp GPS.
- Trạng thái chi tiết từng endpoint: [API-COVERAGE.md](API-COVERAGE.md).

## 7. Tài liệu liên quan

| File | Nội dung |
|---|---|
| [SRS.md](SRS.md) | đặc tả chức năng, có mục lục đầu file |
| [API-COVERAGE.md](API-COVERAGE.md) | trạng thái từng endpoint backend |
| [DESIGN-MASTER.md](DESIGN-MASTER.md) | design token, màu, spacing, typography |
| [TEST-COVERAGE.md](TEST-COVERAGE.md) | đã test cái gì, còn thiếu gì |
| [PLAN-REFACTOR.md](PLAN-REFACTOR.md) | plan refactor feature-based đã thực thi |
| [PLAN-AI-CHATBOT.md](PLAN-AI-CHATBOT.md) | plan + quyết định của feature AI chatbot |
| [../GETSTARTED.md](../GETSTARTED.md) | cài đặt, chạy dev, quy ước commit |
