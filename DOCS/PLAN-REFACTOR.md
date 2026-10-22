# Plan — Refactor cấu trúc source code (feature-based)

> Trạng thái: **chờ duyệt** — chưa sửa file nào.
> Ngày lập: 2026-10-22 · Branch: `refactor/source-structure` (cắt từ `dev`, working tree sạch)
> Bản đồ code hiện tại: [CODE-STRUCTURE.md](CODE-STRUCTURE.md)

## A. Tóm tắt

Cấu trúc hiện tại chia **theo layer** (`pages/`, `services/`, `hooks/`, `types/`, `components/`).
Sửa 1 feature phải mở 4–5 thư mục. Đề xuất chuyển sang **feature-based có kiểm soát**:
`app/` + `components/` + `features/` (8 feature) + `shared/` + `i18n/` + `test/`.

Không chia mỗi feature thành 5 thư mục con — chỉ tách thư mục con khi feature có >12 file.

**Cảnh báo**: repo có 10 remote branch đang mở (`feat/*`, `feature/*`). Di chuyển 179 file
sẽ làm mọi PR đang mở conflict. Xem mục I.

## B. Hiện trạng (đã kiểm tra bằng grep, không đoán)

### B.1 Số liệu

| Hạng mục | Giá trị |
|---|---|
| File trong `src/` | 179 file / 56 thư mục |
| File `.ts`/`.tsx` | 151 file, 14.428 dòng |
| i18n namespace | 11 |
| Route | 20 page, **0 lazy import** |
| Axios client | 1 (`services/api.ts`) — không có client thứ hai |
| Service | 12 file + 6 file test |

### B.2 Vấn đề đã xác minh

1. **Feature trải rộng**: "posts" nằm ở `pages/{Home,Explore,PostDetail,CreatePost,MyPosts}`,
   `services/postService.ts`, `types/post.ts`, `components/blog/`, `components/editor/`,
   `shared/mocks/postEnrichment.ts`, `shared/constants/post*`, `hooks/useFeedPosts.ts`
   → **25 file, 8 thư mục**.
2. **Component trông như dùng chung nhưng chỉ 1 feature dùng**: `components/blog/`,
   `components/editor/`, `shared/mocks/postEnrichment.ts`.
3. **Hai tầng "dùng chung" trùng vai trò**: `components/ui/` và `shared/components/` —
   không rõ đặt component mới vào đâu.
4. **Dependency vòng thật**: `services/api.ts:2` import `stores/authStore`;
   `stores/authStore.ts:2` import `services/api`. Chạy được chỉ nhờ cả hai chỉ gọi hàm
   ở thời điểm dùng.
5. **Dependency ngược tầng**: `utils/maps.ts:1` và `components/map/PlaceMap.tsx:7`
   import type `Coordinates` từ `hooks/useGeolocation` — util phụ thuộc hook.
6. **File chết**: `src/App.css`, `src/assets/*` (3 file), `src/layouts/` + `src/providers/`
   (rỗng). **Package chết**: `jszip`, `next-themes` — khai trong `package.json`, không
   import ở đâu trong `src/`.
7. **Không có lazy loading**: `routes/index.tsx` import tĩnh 20 page.
8. **`CLAUDE.md` lỗi thời**: ghi "`nearbyService` còn mock" — thực tế đã gọi
   `locationService` thật.

### B.3 Đồ thị phụ thuộc

```text
pages/**  ──┬─→ services/*Service.ts ─→ services/api.ts ─→ stores/authStore  ⟲ VÒNG
            ├─→ hooks/*                └→ types/*
            ├─→ types/*, utils/*
            ├─→ shared/components/*  ─→ components/ui/*
            └─→ components/{blog,editor,map,media}/*

services/postService.ts      ─→ shared/mocks/postEnrichment.ts  (mock lẫn vào service thật)
services/dashboardService.ts ─→ shared/mocks/categories.ts      (toàn bộ là mock)
shared/mocks/postEnrichment  ─→ components/editor/editorContent  (shared → components)
utils/maps.ts                ─→ hooks/useGeolocation (type)      (ngược tầng)
test/e2eEnv.ts               ─→ services/authService             (test infra → feature)
```

### B.4 Ranh giới feature (suy ra từ import, không từ tên thư mục)

| Feature | Số file | Vị trí hiện tại |
|---|---|---|
| **posts** | 25 | `pages/{Home,Explore,PostDetail,CreatePost,MyPosts}`, `services/postService`, `types/post`, `components/blog`, `components/editor`, `shared/mocks/postEnrichment`, `shared/constants/post*`, `hooks/useFeedPosts` |
| **locations** | 15 | `pages/{Nearby,LocationDetail}`, `pages/Admin/LocationsPage`, `services/{locationService,nearbyService}`, `types/{location,nearby}`, `components/map`, `hooks/useGeolocation`, `utils/{distance,maps,openingHours}`, `shared/mocks/locations` |
| **auth** | 12 | `pages/auth/*` (4), `components/auth/*` (4), `services/authService`, `stores/authStore`, `hooks/useAuth`, `types/user` |
| **admin** | 8 | `components/admin-shell`, `pages/Admin/{Dashboard,Users}`, `services/{adminUserService,dashboardService}`, `types/dashboard` |
| **nutrition-ai** | 9 | `pages/AiNutritionPage` (2), `services/{aiService,subscriptionService}`, `hooks/{useAiChat,useSubscription}`, `types/ai`, 2 test |
| **categories** | 4 | `pages/Admin/CategoriesPage` (2), `services/categoryService`, `types/category`, `hooks/usePublicCategories` |
| **videos** | 3 | `pages/Admin/VideosPage`, `services/videoService`, `types/video`, `shared/constants/videoStatus` |
| **profile** | 4 | `pages/ProfilePage`, `services/profileService`, `hooks/useProfile`, `types/user` (dùng chung auth) |

**Xung đột ranh giới cần quyết**:

- `types/user.ts` — auth + profile + admin dùng → **`shared/types/`**.
- `hooks/usePublicCategories` — categories + posts dùng → **`features/categories`**,
  posts import từ đó.
- `components/media/ImageUploader` — posts + profile dùng → **`components/common/`**.
- `shared/constants/post*` — posts + admin/PostsPage dùng → **`features/posts`**,
  admin import từ đó.
- i18n namespace `admin` bị `CreatePostPage` dùng
  (`useTranslation(["admin","validation","common","post"])`) → i18n chưa theo feature.
  **Không đổi trong refactor này.**

## C. Kiến trúc đích

```text
src/
├── app/                         khởi tạo ứng dụng — KHÔNG chứa nghiệp vụ
│   ├── App.tsx                  (từ src/App.tsx)
│   ├── main.tsx                 (từ src/main.tsx)
│   ├── routes.tsx               (từ src/routes/index.tsx)
│   ├── providers.tsx            QueryClient + Router + Toaster (tách khỏi main.tsx)
│   └── guards/                  ProtectedRoute, AdminRoute, PublicRoute
│
├── components/                  component KHÔNG thuộc feature nào
│   ├── ui/                      11 primitive (giữ nguyên, không di chuyển)
│   ├── layout/                  Layout, Navbar, Footer, LanguageSwitcher
│   └── common/                  PageHeader, SectionCard, StatCard, EmptyState,
│                                ErrorState, TableSkeleton, Pagination,
│                                ConfirmDialog, FormField, ImageUploader
│
├── features/
│   ├── posts/
│   │   ├── pages/               HomePage, ExplorePage, PostDetailPage(+5 con),
│   │   │                        CreatePostPage(+5 con), MyPostsPage
│   │   ├── components/          PostCard, PostStatusBadge, editor/* (4)
│   │   ├── api.ts               (từ services/postService.ts)
│   │   ├── types.ts             (từ types/post.ts)
│   │   ├── constants.ts         (gộp shared/constants/post{Status,Flag}.ts)
│   │   ├── mocks.ts             (gộp shared/mocks/postEnrichment.ts + authors.ts)
│   │   ├── useFeedPosts.ts
│   │   └── __tests__/
│   │
│   ├── locations/
│   │   ├── pages/               NearbyPage, LocationDetailPage, AdminLocationsPage
│   │   ├── components/          PlaceMap
│   │   ├── api.ts               (gộp locationService + nearbyService, 128 dòng)
│   │   ├── types.ts             (gộp location.ts + nearby.ts, 69 dòng)
│   │   ├── geo.ts               useGeolocation + distance + maps
│   │   │                        (Coordinates về đây → hết ngược tầng)
│   │   ├── openingHours.ts
│   │   └── __tests__/
│   │
│   ├── auth/
│   │   ├── pages/               Login, Register, VerifyEmail, ForgotPassword
│   │   ├── AuthLayout.tsx
│   │   ├── api.ts               (từ services/authService.ts)
│   │   ├── useAuth.ts
│   │   └── __tests__/
│   │
│   ├── admin/
│   │   ├── AdminShell.tsx
│   │   ├── pages/               AdminDashboardPage, UsersPage
│   │   ├── api.ts               (gộp adminUserService + dashboardService)
│   │   └── __tests__/
│   │
│   ├── categories/              4 file, KHÔNG thư mục con
│   │   ├── CategoriesPage.tsx, CategoryFormDialog.tsx
│   │   ├── api.ts, usePublicCategories.ts
│   │
│   ├── videos/                  3 file, KHÔNG thư mục con
│   │   ├── VideosPage.tsx, api.ts, constants.ts
│   │
│   ├── profile/                 4 file, KHÔNG thư mục con
│   │   ├── ProfilePage.tsx, api.ts, useProfile.ts
│   │
│   └── nutrition-ai/            6 file, KHÔNG thư mục con
│       ├── AiNutritionPage.tsx, ChatPanel.tsx
│       ├── api.ts (ai + subscription), types.ts
│       ├── useAiChat.ts, useSubscription.ts
│
├── shared/
│   ├── api/client.ts            (từ services/api.ts — client DUY NHẤT)
│   ├── auth/authStore.ts        (tách khỏi feature vì client cần)
│   ├── ui/uiStore.ts
│   ├── types/                   common.ts, user.ts
│   ├── utils/                   apiError, formatDate, jwt, delay, cn
│   ├── hooks/                   useListParams, useDebounce
│   └── mocks/                   categories.ts, locations.ts
│
├── i18n/                        giữ nguyên (11 namespace)
├── test/                        giữ nguyên
└── assets/                      (xoá nếu rỗng)
```

### C.1 Quy tắc import

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

### C.2 Nguyên tắc chống over-engineering

- Không tạo `features/X/hooks/`, `features/X/types/` khi chỉ có 1 file → để phẳng.
- Không tạo `index.ts` barrel export (gây vòng import, làm chậm HMR).
- Không gộp 2 file chỉ vì cùng feature nếu mỗi file >150 dòng.
- `components/ui/` giữ nguyên 11 file — code ổn định nhất, không đụng.

## D. File mapping

Rủi ro: **T** thấp (move thuần) · **M** trung bình (nhiều importer) ·
**C** cao (đổi ranh giới / cần sửa logic).

### D.1 Khởi tạo & dọn dẹp

| Hiện tại | Đề xuất | Lý do | Ảnh hưởng | Rủi ro |
|---|---|---|---|---|
| `src/App.tsx` | `src/app/App.tsx` | gom khởi tạo | `main.tsx` | T |
| `src/main.tsx` | `src/app/main.tsx` | gom khởi tạo | `index.html` | T |
| `src/routes/index.tsx` | `src/app/routes.tsx` | route là hạ tầng app | 20 import page | T |
| *(mới)* | `src/app/providers.tsx` | `main.tsx` đang gánh 3 provider | `main.tsx` | T |
| `components/auth/{Protected,Admin,Public}Route.tsx` | `src/app/guards/` | guard thuộc app | `routes.tsx` | T |
| `src/App.css` | **xoá** | không import ở đâu | — | T |
| `src/assets/{hero.png,react.svg,vite.svg}` | **xoá** | không import ở đâu | — | T |
| `src/layouts/`, `src/providers/` | **xoá thư mục** | rỗng | — | T |
| `package.json`: `jszip`, `next-themes` | **xoá dependency** | không import trong `src/` | lockfile | T |

### D.2 Shared / components

| Hiện tại | Đề xuất | Lý do | Ảnh hưởng | Rủi ro |
|---|---|---|---|---|
| `services/api.ts` | `shared/api/client.ts` | 1 client duy nhất | 12 service + `test/setup.ts` | M |
| `stores/authStore.ts` | `shared/auth/authStore.ts` | client cần, không thuộc feature | 8 file | M |
| `stores/uiStore.ts` | `shared/ui/uiStore.ts` | 6 page + 2 layout | 8 file | T |
| `types/{common,user}.ts` | `shared/types/` | dùng chéo nhiều feature | 20+ file | M |
| `utils/{apiError,formatDate,jwt,delay}.ts` | `shared/utils/` | dùng chéo | 25 file | M |
| `lib/utils.ts` | `shared/utils/cn.ts` | gộp vào shared/utils | 30 file | M |
| `hooks/{useListParams,useDebounce}.ts` | `shared/hooks/` | 5 admin page | 6 file | T |
| `shared/mocks/{categories,locations}.ts` | `shared/mocks/` (giữ) | mock còn dùng | 3 file | T |
| `shared/components/*` (9 file) | `components/common/` | gộp 1 chỗ với `ui/` | 25 file | M |
| `components/media/ImageUploader.tsx` | `components/common/` | posts + profile dùng | 2 file | T |
| `components/layout/*`, `components/ui/*` | **giữ nguyên** | đã đúng chỗ | — | — |

### D.3 Features

| Hiện tại | Đề xuất | Lý do | Ảnh hưởng | Rủi ro |
|---|---|---|---|---|
| `pages/{Home,Explore,MyPosts}Page/`, `pages/PostDetailPage/*`, `pages/CreatePostPage/*` | `features/posts/pages/` | 5 page 1 feature | `routes.tsx` + 6 test | M |
| `components/blog/*`, `components/editor/*` | `features/posts/components/` | chỉ posts dùng | 6 page + 2 test | M |
| `services/postService.ts` | `features/posts/api.ts` | — | 8 file | M |
| `types/post.ts` | `features/posts/types.ts` | — | 15 file | M |
| `shared/constants/post{Status,Flag}.ts` | `features/posts/constants.ts` (gộp) | 12 + 19 dòng → 31 dòng | 3 file | T |
| `shared/mocks/{postEnrichment,authors}.ts` | `features/posts/mocks.ts` (gộp) | 194 + 67 dòng | `postService` | M |
| `hooks/useFeedPosts.ts` | `features/posts/useFeedPosts.ts` | — | 3 page | T |
| `pages/{NearbyPage,LocationDetailPage}`, `pages/Admin/LocationsPage/*` | `features/locations/pages/` | — | `routes.tsx` + 4 test | M |
| `services/{locationService,nearbyService}.ts` | `features/locations/api.ts` (gộp) | nearby chỉ 13 dòng bọc location | 6 file + **`test/fakeLocationService.ts`** | M |
| `types/{location,nearby}.ts` | `features/locations/types.ts` (gộp) | 61 + 8 dòng | 12 file | M |
| `components/map/PlaceMap.tsx` | `features/locations/components/` | — | 2 page + 2 test mock | M |
| `hooks/useGeolocation.ts` + `utils/{distance,maps}.ts` | `features/locations/geo.ts` | sửa dep ngược tầng | 5 file | **C** |
| `utils/openingHours.ts` | `features/locations/openingHours.ts` | — | 2 file | T |
| `pages/auth/*` (4) | `features/auth/pages/` | — | `routes.tsx` + 2 test | M |
| `components/auth/AuthLayout.tsx` | `features/auth/AuthLayout.tsx` | 4 auth page dùng | 4 file | T |
| `services/authService.ts` | `features/auth/api.ts` | — | 6 file | M |
| `hooks/useAuth.ts` | `features/auth/useAuth.ts` | — | 10 file | M |
| `components/admin-shell/AdminShell.tsx` | `features/admin/AdminShell.tsx` | — | `routes.tsx` | T |
| `pages/Admin/{AdminDashboardPage,UsersPage}/*` | `features/admin/pages/` | — | `routes.tsx` + 2 test | M |
| `services/{adminUserService,dashboardService}.ts` | `features/admin/api.ts` (gộp) | 48 + 18 dòng | 2 page + 1 test | T |
| `types/dashboard.ts` | `features/admin/types.ts` | — | 1 file | T |
| `pages/Admin/CategoriesPage/*` | `features/categories/` | — | `routes.tsx` | T |
| `services/categoryService.ts` | `features/categories/api.ts` | — | 3 file | T |
| `hooks/usePublicCategories.ts` | `features/categories/usePublicCategories.ts` | posts import từ đây | 3 page | M |
| `types/category.ts` | `features/categories/types.ts` | — | 5 file | T |
| `pages/Admin/VideosPage/` | `features/videos/VideosPage.tsx` | — | `routes.tsx` | T |
| `services/videoService.ts` | `features/videos/api.ts` | — | 2 file | T |
| `types/video.ts` + `shared/constants/videoStatus.ts` | `features/videos/{types,constants}.ts` | — | 3 file | T |
| `pages/ProfilePage/` | `features/profile/ProfilePage.tsx` | — | `routes.tsx` (2 chỗ, có `embedded`) | T |
| `services/profileService.ts` | `features/profile/api.ts` | — | 2 file | T |
| `hooks/useProfile.ts` | `features/profile/useProfile.ts` | — | 1 file | T |
| `pages/AiNutritionPage/*` | `features/nutrition-ai/` | — | `routes.tsx` | T |
| `services/{aiService,subscriptionService}.ts` | `features/nutrition-ai/api.ts` (gộp) | 29 + 9 dòng | 3 file + 1 test | T |
| `types/ai.ts` | `features/nutrition-ai/types.ts` | — | 4 file | T |
| `hooks/{useAiChat,useSubscription}.ts` | `features/nutrition-ai/` | — | 3 file | T |
| `test/e2eEnv.ts` | **giữ `src/test/`** | hạ tầng test; đổi import sang `@/features/auth/api` | 8 test | T |
| `test/fakeLocationService.ts` | **giữ `src/test/`** | mock `@/features/locations/api`, cùng chữ ký | 3 test | M |

**Không di chuyển**: `src/i18n/**`, `src/components/ui/**`,
`src/test/{setup,domPolyfills,storageShim,renderWithProviders,locationFixtures}.ts`,
`src/index.css`.

## E. Các phase

Mỗi phase = commit riêng. Không phase nào sửa logic nghiệp vụ.

### Phase 0 — Baseline

- **Mục tiêu**: chốt trạng thái xanh trước khi đụng code.
- **Việc**: `git status` (hiện có `?? DOCS/CODE-STRUCTURE.md` — commit riêng hoặc bỏ),
  chạy 4 lệnh kiểm tra, ghi số test pass/skip vào PR description.
- **Xong khi**: `typecheck` + `lint` + `test` + `build` xanh, đã ghi lại số test.

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

> `npm run test` gọi backend thật (Render free tier, timeout 60s). Test cần JWT tự
> `skip` khi thiếu env. Baseline ghi rõ **số skip** — sau refactor số skip tăng là
> dấu hiệu đứt import.

### Phase 1 — Dọn file chết

| | |
|---|---|
| Mục tiêu | Bỏ 7 file/thư mục không dùng + 2 dependency |
| File | xoá `src/App.css`, `src/assets/*`, `src/layouts/`, `src/providers/`; bỏ `jszip`, `next-themes` |
| Ảnh hưởng | `package-lock.json`; không import nào |
| Phụ thuộc | Phase 0 |
| Rủi ro | Xoá nhầm `assets` nếu `index.html`/`index.css` tham chiếu → grep lần cuối |
| Xong khi | `npm ci && npm run build` xanh |
| Rollback | `git revert <sha>` |

### Phase 2 — `app/` + `shared/`

| | |
|---|---|
| Mục tiêu | Dựng khung đích, di chuyển hạ tầng |
| File | `App.tsx`, `main.tsx`, `routes/index.tsx` → `app/`; tách `app/providers.tsx`; guards → `app/guards/`; `services/api.ts` → `shared/api/client.ts`; `stores/*` → `shared/{auth,ui}/`; `types/{common,user}.ts` → `shared/types/`; `utils/{apiError,formatDate,jwt,delay}` + `lib/utils.ts` → `shared/utils/`; `hooks/{useListParams,useDebounce}` → `shared/hooks/`; `shared/components/*` → `components/common/` |
| Ảnh hưởng | **~90 file** đổi import; `index.html` (script src). `vitest.config.ts` `setupFiles` **không** đổi |
| Phụ thuộc | Phase 1 |
| Rủi ro | Nhiều file chạm nhất dù logic không đổi. `test/setup.ts` import `@/services/api` → `@/shared/api/client` (tsc bắt được) |
| Xong khi | 4 lệnh kiểm tra xanh, số test pass/skip khớp baseline |
| Rollback | `git revert <sha>` |

> **Không** sửa vòng `client ↔ authStore` ở phase này. Ghi `ponytail:` để xử lý riêng.

### Phase 3 — videos, categories, profile, nutrition-ai

| | |
|---|---|
| Mục tiêu | 4 feature nhỏ (~20 file), làm mẫu pattern |
| File | theo D.3, mỗi feature 1 commit |
| Ảnh hưởng | `routes.tsx` (4 import), 3 test service |
| Phụ thuộc | Phase 2 |
| Rủi ro | `usePublicCategories` được posts import → đổi cả 3 page posts (Home, Explore, CreatePost) |
| Xong khi | typecheck + lint + test xanh; mở `/admin/videos`, `/admin/categories`, `/profile`, `/ai-nutrition` thấy render |
| Rollback | revert từng commit |

### Phase 4 — auth

| | |
|---|---|
| Mục tiêu | Đưa auth vào feature |
| File | `pages/auth/*`, `AuthLayout`, `authService`, `useAuth` |
| Ảnh hưởng | `test/e2eEnv.ts` (import `login`), 10 file dùng `useAuth`, `routes.tsx`, 2 test page |
| Rủi ro | `authStore` **giữ ở `shared/auth/`** từ phase 2 — đưa vào feature sẽ tái tạo vòng lặp |
| Xong khi | login → logout → refresh chạy tay được; `LoginPage.test.tsx` pass |
| Rollback | revert |

### Phase 5 — locations

| | |
|---|---|
| Mục tiêu | Feature lớn thứ 2 |
| File | theo D.3, gồm **sửa dep ngược tầng**: `Coordinates` chuyển sang `features/locations/geo.ts` |
| Ảnh hưởng | `test/fakeLocationService.ts` + `vi.mock` path trong 3 test — **string path, tsc không bắt, vitest sẽ báo** |
| Rủi ro | `utils/maps.ts` + `utils/openingHours.ts` có test riêng → di chuyển kéo theo test |
| Xong khi | `/nearby`, `/nearby/:id`, `/admin/locations` render; 3 test page + 3 test util pass |
| Rollback | revert |

### Phase 6 — posts

| | |
|---|---|
| Mục tiêu | 25 file, 8 thư mục → 1 feature |
| File | theo D.3 |
| Ảnh hưởng | `routes.tsx` (5 import); `shared/mocks/postEnrichment` → `features/posts/mocks.ts`; `shared/constants/post*` gộp |
| Rủi ro | `postService` → `shared/mocks/postEnrichment` → `components/editor/editorContent`: **phải di chuyển cả 3 cùng commit** |
| Xong khi | 5 page render; `PostDetailPage.test`, `CreatePostPage.test`, `payload.test`, `postService.test` pass |
| Rollback | revert |

### Phase 7 — admin

| | |
|---|---|
| Mục tiêu | Gom admin shell + dashboard + users |
| File | `AdminShell`, `AdminDashboardPage`, `UsersPage`, `adminUserService`, `dashboardService`, `types/dashboard` |
| Ảnh hưởng | `routes.tsx`; `services/__tests__/adminServices.test.ts` test 3 service thuộc 3 feature → **tách file test** |
| Rủi ro | admin import từ posts/categories/videos → phase 3, 6 phải xong trước |
| Xong khi | 5 trang admin render; test admin pass |
| Rollback | revert |

### Phase 8 — Chốt

| | |
|---|---|
| Mục tiêu | Hưởng lợi từ cấu trúc mới |
| Việc | (a) `React.lazy` cho 20 route + `<Suspense>` — **chỉ làm nếu đo bundle thấy đáng**; (b) cập nhật `CODE-STRUCTURE.md`; (c) viết lại "Tra cứu nhanh" trong `.claude/CLAUDE.md`; (d) sửa ghi sai "nearbyService còn mock" |
| Rủi ro | Lazy route đổi hành vi tải trang → **commit riêng**, không trộn vào move |
| Xong khi | Build xanh, bundle chính giảm, mọi route render |

### Việc tách riêng — phá vòng `api.ts ↔ authStore.ts`

Cần sửa logic, không phải move:

- **Hướng 1 (đề xuất)**: chuyển `scheduleTokenRefresh` / `clearScheduledTokenRefresh`
  khỏi `api.ts` sang `shared/auth/tokenRefresh.ts`; `api.ts` import từ đó. Diff ~30 dòng,
  không đổi API công khai.
- Hướng 2: `authStore` nhận callback qua `setAuth` thay vì import trực tiếp.

Làm ở **phase riêng sau phase 8**, có test riêng cho refresh.

## F. Kiểm thử và rollback

### F.1 Checklist

| # | Kiểm tra | Lệnh / cách | Phase |
|---|---|---|---|
| 1 | TypeScript | `npm run typecheck` | **mọi** |
| 2 | ESLint | `npm run lint` | **mọi** |
| 3 | Unit test nhanh (không cần backend) | `npx vitest run src/services/__tests__/aiService.test.ts src/hooks src/utils` | mọi |
| 4 | Test feature vừa đụng | `npx vitest run <path>` | tương ứng |
| 5 | Toàn bộ test | `npm run test` | 0, 2, 8 |
| 6 | Production build | `npm run build` | 0, 1, 2, 8 |
| 7 | Route render | `npm run dev` + mở từng route | tương ứng |
| 8 | Login → logout → refresh | tay | 2, 4 |
| 9 | Protected/Admin route | `/my-posts` chưa login → `/login`; `/admin` với user thường → `/` | 2, 4, 7 |
| 10 | API request/response | test service (mock axios) | tương ứng |
| 11 | i18n | đổi EN ↔ VI, không thấy key thô | 2, 6 |

### F.2 Điều kiện "phase xong"

- `typecheck` 0 lỗi, `lint` 0 lỗi.
- Số test **pass ≥ baseline**, số **skip = baseline**.
- Không còn import path cũ: `grep -r "@/pages/\|@/services/\|@/stores/" src` rỗng (theo phase).
- Route của feature render (mở tay ít nhất 1 lần).

### F.3 Rollback

| Tình huống | Cách |
|---|---|
| Lỗi, chưa push | `git reset --hard HEAD` **chỉ khi** working tree chỉ chứa thay đổi phase đó (kiểm `git status` trước) |
| Lỗi, đã push | `git revert <sha>` |
| Lỗi, đã merge `dev` | `git revert -m 1 <merge-sha>` trên `dev`, mở PR revert |
| 1 file sai | `git checkout <sha>~1 -- <path>` |

**Không bao giờ** `git push --force` lên `dev`.

## G. Git / team workflow

### G.1 Trạng thái đã kiểm

```text
branch: refactor/source-structure  (dev là ancestor → cắt từ dev, sạch)
working tree: 1 file untracked — DOCS/CODE-STRUCTURE.md
remote: dev, main, + 10 branch feat/* / feature/* đang mở
```

### G.2 Quy trình

1. **Trước mỗi phase**: `git status` + `git fetch origin` + `git log --oneline origin/dev -3`.
   Nếu `dev` đi trước → merge `dev` vào nhánh refactor **trước khi** bắt đầu phase.
2. **Commit theo phase**, theo format đang dùng trong repo:

```text
refactor(app): move bootstrap into src/app
refactor(shared): colocate api client, stores, utils under src/shared
refactor(videos): move videos page and service into features/videos
refactor(auth): move auth pages, service and hook into features/auth
refactor(posts): move posts pages, editor and blog components into features/posts
chore(deps): remove unused jszip and next-themes
```

3. **Mỗi commit chỉ move + sửa import.** Không trộn đổi logic, không trộn lazy loading,
   không format lại code.
4. **PR**: `refactor/source-structure` → `dev`. Đề xuất **tách 3 PR**
   (phase 1–2 / 3–5 / 6–8) — review 179 file move trong 1 PR là không thực tế.
5. **Đồng bộ `dev`**: dùng `git merge origin/dev`, **không rebase** — nhánh dài, rebase
   sẽ phải force-push và làm hỏng review comment.
6. **Xung đột với feature branch đang mở**: báo team **trước** khi merge PR refactor vào
   `dev`, để họ merge `dev` → branch của họ ngay sau đó. Hoặc hẹn 1 ngày "freeze".
7. **`main`**: chỉ merge từ `dev` theo quy trình release. Refactor này không đụng `main`.

## H. Tối ưu cho Claude Code

### H.1 `CLAUDE.md` — thay phần "Tra cứu nhanh" + "Cấu trúc thư mục"

Giữ ~60 dòng, **không chép cây thư mục** (sẽ lỗi thời ngay). Cây đầy đủ ở
`DOCS/CODE-STRUCTURE.md`.

```markdown
## Kiến trúc

Feature-based. Sửa feature X thì chỉ đọc trong `src/features/X/` + `src/shared/`.

src/
  app/          bootstrap, routes, guards — không chứa nghiệp vụ
  components/   ui/ (primitive), layout/, common/ (composite dùng chung)
  features/     posts, locations, auth, admin, categories, videos, profile, nutrition-ai
  shared/       api/client.ts (axios duy nhất), auth/ (authStore), types/, utils/, hooks/
  i18n/ test/

## Quy tắc import

- features/X → shared/**, components/**, features/<X phụ thuộc>
- shared/, components/ → KHÔNG import features/**
- Chỉ MỘT axios client: `shared/api/client.ts`. Không tạo client thứ hai.
- Chỉ MỘT cơ chế refresh token: trong `shared/api/client.ts`.
- Thêm key i18n thì thêm cho CẢ `en` và `vi`.

## Đọc gì khi làm task

| Task | Đọc |
|---|---|
| Sửa UI một feature | `features/<X>/**` + `components/ui/` file liên quan |
| Thêm endpoint | `features/<X>/api.ts` + `features/<X>/types.ts` + `DOCS/API-COVERAGE.md` |
| Sửa auth/refresh | `shared/api/client.ts` + `shared/auth/authStore.ts` |
| Sửa route | `app/routes.tsx` + `app/guards/` |
| Sửa i18n | `i18n/locales/{en,vi}/<ns>.json` (cả hai) |

Không đọc toàn bộ `src/` trừ khi task yêu cầu rõ.

## Kiểm tra

npm run typecheck   # tsc -b --pretty false — chạy cái này, không cần build
npm run lint
npx vitest run <path>   # test nhanh, không cần backend
```

### H.2 Quy tắc xác định phạm vi đọc

1. Task nêu tên feature → glob `src/features/<x>/**` trước, mở rộng khi thấy import ra ngoài.
2. Task nêu tên page → tìm trong `features/*/pages/`.
3. Task nêu endpoint → `grep -r "<path>" src/features/*/api.ts`.
4. Task nêu lỗi runtime → đọc `shared/api/client.ts` trước (interceptor là nơi 80% lỗi
   auth phát sinh).

### H.3 Tránh trùng lặp tài liệu

| File | Chứa | Không chứa |
|---|---|---|
| `CLAUDE.md` | **quy tắc** (import, lệnh, đọc gì) | cây thư mục, danh sách file |
| `DOCS/CODE-STRUCTURE.md` | **bản đồ** (cây + mô tả từng file) | quy tắc, lệnh |
| `DOCS/SRS.md` | **đặc tả chức năng** | vị trí code |
| `DOCS/API-COVERAGE.md` | **trạng thái endpoint** | vị trí service (chỉ tên file) |

Cập nhật `CODE-STRUCTURE.md` **cuối mỗi phase**, không phải mỗi commit.

### H.4 Ghi lại cho phiên sau

- Vòng `client ↔ authStore` là **có chủ ý chưa sửa** — ghi `ponytail:` ở
  `shared/api/client.ts`.
- `test/fakeLocationService.ts` phải giữ **cùng chữ ký** với `features/locations/api.ts`
  — ghi chú trong chính file đó.
- i18n namespace không theo feature (namespace `admin` bị CreatePostPage dùng) — ghi
  nhận, **không** đổi trong refactor này.

## I. Rủi ro và câu hỏi mở

### I.1 Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| **10 remote branch đang mở** — move 179 file làm mọi PR conflict | **Cao** | Hẹn freeze `dev` 1 ngày; hoặc chia PR nhỏ, merge nhanh từng phase |
| `vi.mock("@/services/...")` là string path, tsc không bắt | Cao | Chạy `npm run test` sau mỗi phase; grep `vi.mock` trước merge |
| `vitest.config.ts setupFiles` là string path | Trung bình | Không đổi `src/test/setup.ts` trong suốt refactor |
| `test/fakeLocationService` phải khớp chữ ký `locations/api.ts` | Trung bình | Gộp 2 service thành 1 file nhưng **giữ nguyên tên hàm export** |
| `index.html` trỏ `/src/main.tsx` | Thấp | tsc không bắt; build sẽ báo — kiểm ở phase 2 |
| Bundle không đổi → review "không thấy lợi ích" | Trung bình | Lợi ích là **thời gian đọc code**, không phải runtime; đo bằng số thư mục phải mở cho 1 task |

### I.2 Câu hỏi chưa đủ thông tin (không tự quyết)

1. **Team có thực sự muốn full feature-based?** Diff ~179 file trong khi 10 branch đang mở.
   Phương án rẻ hơn: giữ cấu trúc layer, chỉ **thêm** `features/` cho 2 feature lớn nhất
   (posts, locations), phần còn lại để yên. **Cần chọn trước khi bắt đầu.**
2. **`dashboardService` còn mock** (`categoriesSeed`) — backend đã có endpoint dashboard
   chưa? Nếu có thì nối API trước khi refactor.
3. **`shared/mocks/postEnrichment` + `authors`** — có kế hoạch thay bằng API thật không?
   Nếu có, xoá luôn thay vì di chuyển.
4. **Lazy route** — có yêu cầu performance cụ thể không? Nếu không, bỏ phase 8a.
5. **`jszip` / `next-themes`** — ai thêm, có định dùng không? (`SRS.md:1882` và
   `GETSTARTED.md` ghi next-themes cho dark mode nhưng chưa implement.)
6. **CI** — có pipeline chạy test không? Test cần backend thật + credential; nếu CI
   không có thì test chỉ chạy local.

## J. Phase đầu tiên đề xuất

**Phase 1 — Dọn file chết.**

Lý do:

- 7 file/thư mục + 2 dependency, **0 import**, không thể vỡ logic.
- Diff ~10 dòng, review 2 phút, merge được ngay cả khi `dev` đang bận.
- Chứng minh quy trình (commit → verify → PR nhỏ) hoạt động trước khi đụng 90 file ở phase 2.

Phạm vi chính xác:

```text
xoá  src/App.css
xoá  src/assets/hero.png, react.svg, vite.svg   (+ thư mục src/assets/)
xoá  src/layouts/            (rỗng)
xoá  src/providers/          (rỗng)
sửa  package.json            bỏ "jszip", "next-themes"
```

Xác minh thành công:

1. `grep -r "hero.png\|react.svg\|vite.svg\|App.css" src index.html` → rỗng.
2. `npm run typecheck` → 0 lỗi.
3. `npm run lint` → 0 lỗi.
4. `npm run build` → xanh, `dist/assets/*.js` không tăng kích thước.
5. `npm run test` → số pass/skip = baseline phase 0.
6. `npm run dev` → `/`, `/explore`, `/login`, `/admin/dashboard` render bình thường.

Rollback: `git revert <sha>`.
