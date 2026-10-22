# VEGALIFE Frontend — Context for Claude

React SPA cho nền tảng VEGALIFE (lối sống thực vật). File này là **bản đồ tra cứu**: đọc xong biết sửa gì thì mở file nào, không cần khảo sát lại repo.

## Stack & Tooling

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 qua `@tailwindcss/vite`; design token khai báo trong `src/index.css` (`@theme`)
- **State**: Zustand (auth, ui) + TanStack React Query 5 (server state)
- **Forms**: Formik + Yup
- **HTTP**: Axios, interceptor 401/refresh trong `src/shared/api/client.ts`
- **i18n**: i18next + react-i18next — **11 namespace**: `common`, `auth`, `admin`, `validation`, `profile`, `home`, `explore`, `post`, `nearby`, `aiNutrition`, `location`
- **Editor**: TipTap 3 (`src/features/posts/components/editor/`)
- **Toast**: sonner · **Icons**: lucide-react · **Port dev**: 5173
- **Proxy**: `/api` → `https://vegalife-backend.onrender.com`

## Tra cứu nhanh

| Cần gì | File |
|---|---|
| Axios instance, interceptor 401/refresh | `src/shared/api/client.ts` |
| Kiểu dùng chung: `ApiResponse`, `Paginated`, `PageResponse`, `ListParams` | `src/shared/types/common.ts` |
| Đọc lỗi API ra message hiển thị | `src/shared/utils/apiError.ts` → `getApiErrorMessage` |
| Format ngày theo ngôn ngữ | `src/shared/utils/formatDate.ts` → `formatDateLocale`, `estimateReadMinutes` |
| Đăng xuất (revoke token rồi mới xóa state) | `src/features/auth/useAuth.ts` → `useLogout` |
| Map id → tên category (cache dùng chung) | `src/features/categories/usePublicCategories.ts` → `useCategoryNames` |
| State page/filter/search trên URL | `src/shared/hooks/useListParams.ts` |
| Component dùng chung | `src/components/common/` — `PageHeader`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `Pagination`, `TableSkeleton`, `FormField`, `SectionCard`, `StatCard`, `ImageUploader` |
| UI primitive | `src/components/ui/` — Button, Input, Textarea, Select, Dialog, Table, Badge, Avatar, Progress, Skeleton, PillTabs |
| Design token màu/spacing/typography | `src/index.css` (`@theme`) + `DOCS/DESIGN-MASTER.md` |
| Route toàn app | `src/app/routes.tsx` |
| Validate form soạn bài | `src/features/posts/pages/CreatePostPage/schema.ts` |
| Payload gửi API khi tạo/sửa bài | `src/features/posts/pages/CreatePostPage/payload.ts` |
| Service theo domain | `src/features/<feature>/api.ts` — `auth`, `posts`, `categories`, `videos`, `locations` (+`nearbyApi`), `profile`, `admin` (+`dashboardApi`), `nutrition-ai` (+`subscriptionApi`) |
| Trạng thái từng endpoint backend | `DOCS/API-COVERAGE.md` |
| Đặc tả chức năng | `DOCS/SRS.md` (có mục lục ở đầu) |
| Bản đồ file chi tiết | `DOCS/CODE-STRUCTURE.md` |

## Cấu trúc thư mục

```text
src/
  app/              # main.tsx, App.tsx, routes.tsx, NotFoundPage.tsx
    guards/         # ProtectedRoute, AdminRoute, PublicRoute
    layout/         # Layout, Navbar, Footer, LanguageSwitcher
  components/
    ui/             # 11 primitive UI (xem bảng trên)
    common/         # 10 component dùng chung (xem bảng trên)
  features/
    admin/          # AdminShell, api, dashboardApi (mock), types,
                    # pages/{AdminDashboardPage,PostsPage,UsersPage}
    auth/           # api, useAuth, AuthLayout, pages/{Login,Register,VerifyEmail,ForgotPassword}
    categories/     # CategoriesPage, CategoryFormDialog, api, usePublicCategories, types, mocks
    locations/      # api, nearbyApi, geo, openingHours, types, mocks,
                    # components/PlaceMap, pages/{NearbyPage,LocationDetailPage,AdminLocationsPage}
    nutrition-ai/   # AiNutritionPage, ChatPanel, api, subscriptionApi, useAiChat, useSubscription
    posts/          # api, useFeedPosts, types, constants, mockEnrichment, mockAuthors,
                    # components/{PostCard,PostStatusBadge,editor/*},
                    # pages/{Home,Explore,MyPosts,PostDetail,CreatePost}
    profile/        # ProfilePage, api, useProfile
    videos/         # VideosPage, api, constants, types
  i18n/             # index.ts + locales/{en,vi}/<namespace>.json
  shared/
    api/            # client.ts (axios + interceptor), media.ts
    auth/           # authStore.ts
    hooks/          # useListParams, useDebounce
    types/          # common, user, media
    ui/             # uiStore.ts
    utils/          # apiError, formatDate, jwt, delay, cn
  test/             # hạ tầng test (setup, e2eEnv, fakeLocationService, fixtures)
```

**Quy tắc import** (một chiều):

```text
app/         →  features/**, shared/**, components/**
features/X/  →  shared/**, components/**, features/<X phụ thuộc>/**
shared/      →  ✗ KHÔNG import features/**, components/**
components/  →  ✗ KHÔNG import features/**
```

Ngoại lệ đã ghi nhận: `features/profile/ProfilePage.tsx` import `getMyPosts` từ
`features/posts/api` cho thẻ thống kê (có `ponytail:` tại chỗ).

Page nhiều khối đã tách file con cùng thư mục: `CreatePostPage/` (`schema.ts`, `payload.ts`, `ContentFormatSelector.tsx`, `PostSidebar.tsx`), `PostDetailPage/` (`FactStrip`, `IngredientsCard`, `InstructionsCard`, `ChefSecretCard`, `CommentsSection`).

## Auth Flow

1. `RegisterPage` → `register()` → redirect `/verify-email` kèm email.
2. `LoginPage` → `login()` → decode JWT lấy `role` (`src/shared/utils/jwt.ts`), lưu `user`/`accessToken`/`refreshToken` vào `authStore`.
3. `client.ts` tự gắn `Authorization: Bearer <accessToken>`.
4. Gặp 401 → interceptor dùng `refreshToken` gọi `/auth/refresh`; thất bại thì logout + về `/login`.
5. `ProtectedRoute` (cần đăng nhập) · `AdminRoute` (thêm `user.role === "ADMIN"`) · `PublicRoute` (đã đăng nhập thì admin → `/admin/dashboard`, user → `/`).

**Persist**: `rememberMe` → `localStorage["vegalife_auth_persistent"]`; không nhớ → `sessionStorage["vegalife_auth"]`. Xem `src/shared/auth/authStore.ts`.

## Routes

| Route | Ghi chú |
|---|---|
| `/` | Home |
| `/explore` | Danh sách bài viết |
| `/nearby`, `/nearby/:id` | Tìm theo vị trí (API thật) |
| `/ai-nutrition` | Chatbot dinh dưỡng (API thật) |
| `/posts/:id` | Chi tiết bài — public |
| `/posts/create`, `/posts/:id/edit` | `CreatePostPage` — cần đăng nhập |
| `/profile`, `/my-posts` | Cần đăng nhập |
| `/login`, `/register`, `/verify-email`, `/forgot-password` | Public |
| `/admin` → `/admin/dashboard` | Admin |
| `/admin/posts\|videos\|categories\|users\|locations\|profile` | Admin |

## Thật vs mock

- **Gọi API thật**: auth, posts, categories, profile, media, videos, admin users, locations, AI chatbot.
- **Còn mock**: `src/features/admin/dashboardApi.ts` (backend chưa có endpoint dashboard); `src/features/posts/{mockEnrichment,mockAuthors}.ts` (field hiển thị BE chưa trả).
- Trạng thái chi tiết từng endpoint: `DOCS/API-COVERAGE.md`.

## Conventions

- Alias `@/` → `src/`.
- **`ponytail:` comment** đánh dấu chỗ lược bớt **có chủ ý** kèm giới hạn và hướng nâng cấp. Đừng "sửa" chúng nếu không có yêu cầu.
- i18n **en là mặc định**, `vi` là secondary; cả 2 locale đều có đủ 11 namespace. Message validation lấy từ namespace `validation`. Thêm key thì **thêm cho cả `en` và `vi`**.
- API trả wrapper `{ success: boolean, message: string, data: T }`.
- UI primitive ở `src/components/ui/` dùng `class-variance-authority` cho variants.
- Form theo pattern Formik + Yup.

## Lưu ý khi làm việc

- **Đừng thêm dependency mới** nếu thư viện hiện có giải quyết được.
- Verify nhanh bằng `npm run typecheck` (`tsc -b --pretty false`) thay vì `npm run build`.
- `CategoriesPage` hiện có: thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`, phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete.
