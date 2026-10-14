# VEGALIFE Frontend — Context for Claude

React SPA cho nền tảng VEGALIFE (lối sống thực vật). File này là **bản đồ tra cứu**: đọc xong biết sửa gì thì mở file nào, không cần khảo sát lại repo.

## Stack & Tooling

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 qua `@tailwindcss/vite`; design token khai báo trong `src/index.css` (`@theme`)
- **State**: Zustand (auth, ui) + TanStack React Query 5 (server state)
- **Forms**: Formik + Yup
- **HTTP**: Axios, interceptor 401/refresh trong `src/services/api.ts`
- **i18n**: i18next + react-i18next — **10 namespace**: `common`, `auth`, `admin`, `validation`, `profile`, `home`, `explore`, `post`, `nearby`, `aiNutrition`
- **Editor**: TipTap 3 (`src/components/editor/`)
- **Toast**: sonner · **Icons**: lucide-react · **Port dev**: 5173
- **Proxy**: `/api` → `https://vegalife-backend.onrender.com`

## Tra cứu nhanh

| Cần gì | File |
|---|---|
| Axios instance, interceptor 401/refresh | `src/services/api.ts` |
| Kiểu dùng chung: `ApiResponse`, `Paginated`, `PageResponse`, `ListParams` | `src/types/common.ts` |
| Đọc lỗi API ra message hiển thị | `src/utils/apiError.ts` → `getApiErrorMessage` |
| Format ngày theo ngôn ngữ | `src/utils/formatDate.ts` → `formatDateLocale`, `estimateReadMinutes` |
| Đăng xuất (revoke token rồi mới xóa state) | `src/hooks/useAuth.ts` → `useLogout` |
| Map id → tên category (cache dùng chung) | `src/hooks/usePublicCategories.ts` → `useCategoryNames` |
| State page/filter/search trên URL | `src/hooks/useListParams.ts` |
| Component dùng chung | `src/shared/components/` — `PageHeader`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `Pagination`, `TableSkeleton`, `FormField`, `SectionCard`, `StatCard` |
| UI primitive | `src/components/ui/` — Button, Input, Textarea, Select, Dialog, Table, Badge, Avatar, Progress, Skeleton, PillTabs |
| Design token màu/spacing/typography | `src/index.css` (`@theme`) + `DOCS/DESIGN-MASTER.md` |
| Route toàn app | `src/routes/index.tsx` |
| Validate form soạn bài | `src/pages/CreatePostPage/schema.ts` |
| Payload gửi API khi tạo/sửa bài | `src/pages/CreatePostPage/payload.ts` |
| Service theo domain | `src/services/{auth,post,category,video,media,profile,adminUser,dashboard}Service.ts` |
| Trạng thái từng endpoint backend | `DOCS/API-COVERAGE.md` |
| Đặc tả chức năng | `DOCS/SRS.md` (có mục lục ở đầu) |

## Cấu trúc thư mục

```text
src/
  components/
    admin-shell/    # AdminShell — layout admin + nested routes
    auth/           # ProtectedRoute, PublicRoute, AdminRoute, AuthLayout
    blog/           # PostCard, PostCardCompact, PostStatusBadge
    editor/         # RichTextEditor, EditorToolbar, PostContent, editorContent
    layout/         # Layout, Navbar, Footer, LanguageSwitcher
    media/          # ImageUploader
    ui/             # primitive UI (xem bảng trên)
  hooks/            # useAuth, useListParams, useDebounce, useFeedPosts,
                    # usePublicCategories, useProfile
  i18n/             # index.ts + locales/{en,vi}/<namespace>.json
  lib/utils.ts      # cn()
  pages/
    Admin/          # AdminDashboardPage, PostsPage, VideosPage, CategoriesPage, UsersPage
    auth/           # Login, Register, VerifyEmail, ForgotPassword
    AiNutritionPage, CreatePostPage, ExplorePage, HomePage, LocationDetailPage,
    MyPostsPage, NearbyPage, NotFoundPage, PostDetailPage, ProfilePage
  routes/index.tsx
  services/         # api.ts + <domain>Service.ts
  shared/
    components/     # component dùng chung (xem bảng trên)
    constants/      # postStatus, postFlag, videoStatus
    mocks/          # dữ liệu giả làm đầy UI
  stores/           # authStore, uiStore
  types/            # common, user, post, category, video, media, nearby, dashboard
  utils/            # apiError, formatDate, jwt, delay
```

Page nhiều khối đã tách file con cùng thư mục: `CreatePostPage/` (`schema.ts`, `payload.ts`, `ContentFormatSelector.tsx`, `PostSidebar.tsx`), `PostDetailPage/` (`FactStrip`, `IngredientsCard`, `InstructionsCard`, `ChefSecretCard`, `CommentsSection`).

## Auth Flow

1. `RegisterPage` → `register()` → redirect `/verify-email` kèm email.
2. `LoginPage` → `login()` → decode JWT lấy `role` (`src/utils/jwt.ts`), lưu `user`/`accessToken`/`refreshToken` vào `authStore`.
3. `api.ts` tự gắn `Authorization: Bearer <accessToken>`.
4. Gặp 401 → interceptor dùng `refreshToken` gọi `/auth/refresh`; thất bại thì logout + về `/login`.
5. `ProtectedRoute` (cần đăng nhập) · `AdminRoute` (thêm `user.role === "ADMIN"`) · `PublicRoute` (đã đăng nhập thì admin → `/admin/dashboard`, user → `/`).

**Persist**: `rememberMe` → `localStorage["vegalife_auth_persistent"]`; không nhớ → `sessionStorage["vegalife_auth"]`. Xem `src/stores/authStore.ts`.

## Routes

| Route | Ghi chú |
|---|---|
| `/` | Home |
| `/explore` | Danh sách bài viết |
| `/nearby`, `/nearby/:id` | Tìm theo vị trí (mock) |
| `/ai-nutrition` | Chatbot dinh dưỡng (mock) |
| `/posts/:id` | Chi tiết bài — public |
| `/posts/create`, `/posts/:id/edit` | `CreatePostPage` — cần đăng nhập |
| `/profile`, `/my-posts` | Cần đăng nhập |
| `/login`, `/register`, `/verify-email`, `/forgot-password` | Public |
| `/admin` → `/admin/dashboard` | Admin |
| `/admin/posts\|videos\|categories\|users\|profile` | Admin |

## Thật vs mock

- **Gọi API thật**: auth, posts, categories, profile, media, videos, admin users, dashboard.
- **Còn mock**: `src/services/nearbyService.ts` (NearbyPage, LocationDetailPage); `src/pages/AiNutritionPage` (trả lời tĩnh); `src/shared/mocks/{postEnrichment,authors,categories}.ts` (chỉ làm đầy UI).
- Trạng thái chi tiết từng endpoint: `DOCS/API-COVERAGE.md`.

## Conventions

- Alias `@/` → `src/`.
- **`ponytail:` comment** đánh dấu chỗ lược bớt **có chủ ý** kèm giới hạn và hướng nâng cấp (38 chỗ / 23 file). Đừng "sửa" chúng nếu không có yêu cầu.
- i18n **en là mặc định**, `vi` là secondary; cả 2 locale đều có đủ 10 namespace. Message validation lấy từ namespace `validation`. Thêm key thì **thêm cho cả `en` và `vi`**.
- API trả wrapper `{ success: boolean, message: string, data: T }`.
- UI primitive ở `src/components/ui/` dùng `class-variance-authority` cho variants.
- Form theo pattern Formik + Yup.

## Lưu ý khi làm việc

- **Đừng thêm dependency mới** nếu thư viện hiện có giải quyết được.
- Verify nhanh bằng `npm run typecheck` (`tsc -b --pretty false`) thay vì `npm run build`.
- `CategoriesPage` hiện có: thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`, phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete.
