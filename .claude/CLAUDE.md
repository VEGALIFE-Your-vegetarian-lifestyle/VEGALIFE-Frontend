# VEGALIFE Frontend — Context for Claude

React SPA cho nền tảng VEGALIFE (lối sống thực vật). File này là **bản đồ tra cứu**: đọc xong biết sửa gì thì mở file nào, không cần khảo sát lại repo.

## Stack & Tooling

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 qua `@tailwindcss/vite`; design token khai báo trong `src/index.css` (`@theme`)
- **State**: Zustand (auth, ui) + TanStack React Query 5 (server state)
- **Forms**: Formik + Yup
- **HTTP**: Axios, interceptor 401/refresh trong `src/shared/api/client.ts`
- **i18n**: i18next + react-i18next — **13 namespace**: `common`, `auth`, `admin`, `validation`, `profile`, `home`, `explore`, `post`, `nearby`, `aiNutrition`, `location`, `recipe`, `menu`
- **Editor**: TipTap 3 (`src/features/posts/components/editor/`)
- **Map**: react-leaflet + leaflet (`src/features/locations/components/PlaceMap.tsx`)
- **Toast**: sonner · **Icons**: lucide-react · **Port dev**: 5173
- **Proxy**: `/api` → `https://vegalife-backend.onrender.com`

## Tra cứu nhanh

| Cần gì | File |
|---|---|
| Axios instance, interceptor 401/refresh, refresh chủ động | `src/shared/api/client.ts` |
| Upload ảnh (xin thông tin upload + PUT file) | `src/shared/api/media.ts` |
| Kiểu dùng chung: `ApiResponse`, `Paginated`, `PageResponse`, `ListParams` | `src/shared/types/common.ts` |
| Đọc lỗi API ra message hiển thị | `src/shared/utils/apiError.ts` → `getApiErrorMessage` |
| Format ngày theo ngôn ngữ | `src/shared/utils/formatDate.ts` → `formatDateLocale`, `estimateReadMinutes` |
| Đăng xuất (revoke token rồi mới xóa state) | `src/features/auth/useAuth.ts` → `useLogout` |
| Map id → tên category (cache dùng chung) | `src/features/categories/usePublicCategories.ts` → `useCategoryNames` |
| State page/filter/search trên URL | `src/shared/hooks/useListParams.ts` |
| Debounce giá trị | `src/shared/hooks/useDebounce.ts` |
| Component dùng chung | `src/components/common/` — `PageHeader`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `Pagination`, `TableSkeleton`, `FormField`, `SectionCard`, `StatCard`, `ImageUploader` |
| UI primitive (11, CVA variants) | `src/components/ui/` — Button, Input, Textarea, Select, Dialog, Table, Badge, Avatar, Progress, Skeleton, PillTabs |
| Design token màu/spacing/typography | `src/index.css` (`@theme`) + `DOCS/DESIGN-MASTER.md` |
| Route toàn app | `src/app/routes.tsx` |
| Validate + payload form soạn bài | `src/features/posts/pages/CreatePostPage/{schema,payload}.ts` |
| Validate + payload form soạn recipe | `src/features/recipes/pages/CreateRecipePage/{schema,payload}.ts` |
| Validate + payload form tạo thực đơn tuần | `src/features/menus/pages/CreateMealPlanPage/{schema,validate,payload}.ts` |
| Service theo domain | `src/features/<feature>/api.ts` — `auth`, `posts`, `categories`, `videos`, `locations` (+`nearbyApi`), `profile`, `admin` (+`dashboardApi`), `nutrition-ai` (+`subscriptionApi`), `recipes` (+`adminApi`), `menus` |
| Tìm món (`GET /api/dishes`) — dùng chung 3 feature | `src/shared/api/dishes.ts` → `searchDishes` |
| Trạng thái từng endpoint backend | `DOCS/API-COVERAGE.md` |
| Đặc tả chức năng | `DOCS/SRS.md` (có mục lục ở đầu) |
| Bản đồ file chi tiết | `DOCS/CODE-STRUCTURE.md` |
| Đã test gì / còn thiếu gì | `DOCS/TEST-COVERAGE.md` |

## Cấu trúc thư mục

Kiến trúc **feature-based**: `app/` khởi động, `features/<domain>/` nghiệp vụ, `shared/` hạ tầng, `components/` không biết domain.

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
    menus/          # api, useMealPlans, week.ts (tính tuần local), types,
                    # components/{MenuCard,DayColumn,MealRow,WeekNavigator,MenuActions},
                    # pages/MealPlanPage (xem + đổi trạng thái),
                    # pages/CreateMealPlanPage/ (schema, validate, payload,
                    #   DayEditor, DishSlotPicker)
    nutrition-ai/   # AiNutritionPage, ChatPanel, api, subscriptionApi, useAiChat, useSubscription
    posts/          # api, useFeedPosts, types, constants, mockEnrichment, mockAuthors,
                    # components/{PostCard,PostStatusBadge,editor/*},
                    # pages/{Home,Explore,MyPosts,PostDetail,CreatePost}
    profile/        # ProfilePage, api, useProfile,
                    # DietaryPreferencesSection, TagInput, dietary.ts (helper patch dietary)
    recipes/        # api (create + gợi ý dish/ingredient), adminApi (admin list), types,
                    # pages/CreateRecipePage/ (schema, payload, IngredientEditor,
                    #   AutocompleteField, RecipeSidebar),
                    # pages/AdminRecipesPage/ (AdminRecipesPage, RecipeDetailDialog)
    videos/         # VideosPage, api, constants, types
  i18n/             # index.ts + locales/{en,vi}/<namespace>.json
  shared/
    api/            # client.ts (axios + interceptor), media.ts, dishes.ts (GET /api/dishes)
    auth/           # authStore.ts
    hooks/          # useListParams, useDebounce
    types/          # common, user, media, dish
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

Phụ thuộc giữa feature: `admin → posts, categories, videos, locations, profile, recipes`;
`posts → categories, auth`; `recipes → categories` (chỉ `useCategoryNames`); `profile → auth`;
`menus → auth`.

Ngoại lệ đã ghi nhận: `features/profile/ProfilePage.tsx` import `getMyPosts` từ
`features/posts/api` cho thẻ thống kê (có `ponytail:` tại chỗ).

Page nhiều khối đã tách file con cùng thư mục: `CreatePostPage/`, `PostDetailPage/`,
`CreateRecipePage/`, `CreateMealPlanPage/`, `AdminLocationsPage/`, `AdminRecipesPage/`.

## Auth Flow

1. `RegisterPage` → `register()` → redirect `/verify-email` kèm email.
2. `LoginPage` → `login()` → decode JWT lấy `role` (`src/shared/utils/jwt.ts`), lưu `user`/`accessToken`/`refreshToken` vào `authStore`.
3. `client.ts` tự gắn `Authorization: Bearer <accessToken>`.
4. Gặp 401 → interceptor dùng `refreshToken` gọi `/auth/refresh`; thất bại thì logout + về `/login`. Ngoài ra có refresh chủ động theo timer (`scheduleTokenRefresh`).
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
| `/recipes/create` | `CreateRecipePage` — cần đăng nhập |
| `/meal-plan` | `MealPlanPage` — thực đơn tuần + nút đổi trạng thái — cần đăng nhập |
| `/meal-plan/create` | `CreateMealPlanPage` — tự lập thực đơn — cần đăng nhập |
| `/profile`, `/my-posts` | Cần đăng nhập |
| `/login`, `/register`, `/verify-email`, `/forgot-password` | Public |
| `/admin` → `/admin/dashboard` | Admin |
| `/admin/dashboard\|posts\|videos\|categories\|recipes\|users\|locations\|profile` | Admin |

Sidebar admin khai báo ở `src/features/admin/AdminShell.tsx` (`navItems`, cờ `ready` cho mục chưa dựng — hiện chỉ `comments`).

## Thật vs mock

- **Gọi API thật**: auth, posts, categories, profile (kể cả 5 field dietary), media, videos, admin users, locations, AI chatbot, recipes (`POST /api/recipes`, `GET /api/dishes`, `GET /api/ingredients`, `GET /api/admin/recipes`), menus (`GET /api/menus/details`, `POST /api/menus`, `POST /api/menus/{id}/status`).
- **Còn mock**: `src/features/admin/dashboardApi.ts` (backend chưa có endpoint dashboard); `src/features/posts/{mockEnrichment,mockAuthors}.ts` (field hiển thị BE chưa trả).
- `src/features/locations/mocks.ts` **không phải** mock API — chỉ là toạ độ tâm các quận TP.HCM.
- Trạng thái chi tiết từng endpoint: `DOCS/API-COVERAGE.md`.

## Conventions

- Alias `@/` → `src/`.
- **`ponytail:` comment** đánh dấu chỗ lược bớt **có chủ ý** kèm giới hạn và hướng nâng cấp (40 chỗ / 26 file). Đừng "sửa" chúng nếu không có yêu cầu.
- i18n **en là mặc định**, `vi` là secondary; cả 2 locale đều có đủ 13 namespace. Message validation dùng chung lấy từ namespace `validation`; message riêng của form recipe nằm trong namespace `recipe` (`errors.*`). Thêm key thì **thêm cho cả `en` và `vi`**.
- API trả wrapper `{ success: boolean, message: string, data: T }`.
- UI primitive ở `src/components/ui/` dùng `class-variance-authority` cho variants.
- Form theo pattern Formik + Yup.
- Backend nhận **camelCase** ở profile/recipe (không phải snake_case).

## Lưu ý khi làm việc

- **Đừng thêm dependency mới** nếu thư viện hiện có giải quyết được.
- Verify nhanh bằng `npm run typecheck` (`tsc -b --pretty false`) thay vì `npm run build`; test bằng `npm test` (gọi backend thật, tự skip khi thiếu env).
- `CategoriesPage` hiện có: thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`, phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete.
- `AdminRecipesPage`: đọc (`GET /api/admin/recipes`) + duyệt/từ chối (`POST .../approve|reject`). Lọc `moderationStatus` (mặc định `PENDING` qua `?status=`), `userId`/`categoryId`/khoảng ngày, sort whitelist `createdAt,desc` · `updatedAt,desc` · `name,asc`. Nút duyệt nằm trong dialog chi tiết, xác nhận qua `ConfirmDialog`. Không có sửa/xoá recipe. Duyệt recipe **không** duyệt dish/ingredient của nó. Không có `GET /api/recipes/{id}` → chi tiết render từ row đã tải.
- `CreateRecipePage`: `instructions` là `TEXT` thuần → dùng `Textarea`, **không** dùng `RichTextEditor`. Không có field ảnh bìa (endpoint không nhận). Chưa có trang danh sách/chi tiết recipe công khai (thiếu `GET /api/recipes`).
- `CreateMealPlanPage`: 7 ngày × 3 ô bữa cố định (`BREAKFAST`/`LUNCH`/`DINNER`), ô trống không gửi. `validate.ts` thuần (không Yup) vì luật BR-MENU-005 là quan hệ giữa các ô: **≥5 món khác nhau**, **≤3 lần/món**. Nút Lưu khoá tới khi hết lỗi. Chỉ tạo `drafted`; đổi trạng thái bằng nút trên `MenuCard` (`MenuActions`) qua `POST /api/menus/{id}/status`. Không có endpoint xoá menu — `cancelled` là đường bỏ duy nhất. Không có ai/cron nào khác đổi status hộ user.
- `POST`/`PATCH`/`status` của menu trả shape khác `GET /api/menus/details` (thiếu `dish` đầy đủ) → sau khi ghi luôn `invalidateQueries(["meal-plans"])`, đừng render từ response.
