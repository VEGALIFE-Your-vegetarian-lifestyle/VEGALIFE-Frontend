# VEGALIFE Frontend — Context for Claude

React SPA cho nền tảng VEGALIFE (lối sống thực vật). File này là **bản đồ tra cứu**: đọc xong biết sửa gì thì mở file nào, không cần khảo sát lại repo.

## Stack & Tooling

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Routing**: react-router-dom v7
- **Styling**: TailwindCSS v4 qua `@tailwindcss/vite`; design token khai báo trong `src/index.css` (`@theme`)
- **State**: Zustand (auth, ui) + TanStack React Query 5 (server state)
- **Forms**: Formik + Yup
- **HTTP**: Axios, interceptor 401/refresh trong `src/shared/api/client.ts`
- **i18n**: i18next + react-i18next — **14 namespace**: `common`, `auth`, `admin`, `validation`, `profile`, `home`, `explore`, `post`, `nearby`, `aiNutrition`, `location`, `subscription`, `recipe`, `menu`
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
| Dialog soạn bài (create + edit) | `src/features/posts/components/composer/PostComposerDialog.tsx` — mở bằng `useUiStore().openComposer(postId?)`, mount một lần ở `Layout` |
| Validate + payload form soạn bài | `src/features/posts/components/composer/{schema,payload}.ts` |
| Validate + payload form soạn recipe | `src/features/recipes/pages/CreateRecipePage/{schema,payload}.ts` |
| Validate + payload form tạo thực đơn tuần | `src/features/menus/pages/CreateMealPlanPage/{schema,validate,payload}.ts` |
| Service theo domain | `src/features/<feature>/api.ts` — `auth`, `posts`, `categories`, `videos`, `locations` (+`nearbyApi`), `profile`, `admin` (+`dashboardApi`), `nutrition-ai` (+`subscriptionApi`), `recipes` (+`adminApi`), `menus`, `subscription` |
| Gói AI + thanh toán VNPay (hook) | `src/features/subscription/useBilling.ts` |
| Tìm món (`GET /api/dishes`) — dùng chung 3 feature | `src/shared/api/dishes.ts` → `searchDishes` |
| Trạng thái từng endpoint backend | `DOCS/API-COVERAGE.md` |
| Page nào render field nào của API + chỗ đang mock | `DOCS/UI-DATA-MAP.md` |
| Field đang mock theo từng màn hình (cập nhật khi sửa UI) | `DOCS/MOCK-FIELDS.md` |
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
                    # components/{MenuCard,DayColumn,MealRow,DishDetailDialog,
                    #   WeekNavigator,MenuActions},
                    # pages/MealPlanPage (xem + đổi trạng thái),
                    # pages/CreateMealPlanPage/ (schema, validate, payload,
                    #   DayEditor, DishSlotPicker)
    nutrition-ai/   # AiNutritionPage, ChatPanel, api, subscriptionApi, useAiChat, useSubscription
    posts/          # api, useFeedPosts, types, constants, mockEnrichment, mockAuthors,
                    # components/{PostCard,PostStatusBadge,editor/*,composer/*},
                    # pages/{Home,Explore,MyPosts,PostDetail}
    profile/        # ProfilePage (rail danh tính + 1 form gộp), api, useProfile,
                    # TagInput, dietary.ts (hằng số + toDietaryValues/normalizeTags)
    recipes/        # api (create + gợi ý dish/ingredient), adminApi (admin list), types,
                    # components/RecipeDetailDialog (tờ công thức, MyRecipesPage dùng),
                    # pages/CreateRecipePage/ (schema, payload, IngredientEditor,
                    #   StepEditor, AutocompleteField, RecipeSidebar, RecipePreviewCard),
                    # pages/AdminRecipesPage/ (AdminRecipesPage, RecipeDetailDialog)
    subscription/   # api (gói + mua + huỷ + thanh toán), useBilling (6 hook), types,
                    # pages/SubscriptionPage (2 tab: lịch sử mua / thanh toán),
                    # pages/PaymentResultPage (poll trạng thái VNPay)
    videos/         # VideosPage, api, constants, types
  i18n/             # index.ts + locales/{en,vi}/<namespace>.json — 14 namespace
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
`menus` không phụ thuộc feature nào (dialog chi tiết món dựng từ chính response
`GET /api/menus/details` — xem `DishDetailDialog.tsx`).

Page nhiều khối đã tách file con cùng thư mục: `PostDetailPage/`, `ExplorePage/`, `HomePage/`,
`CreateRecipePage/`, `CreateMealPlanPage/`, `AdminLocationsPage/`, `AdminRecipesPage/`.
Soạn bài (create + edit) **không còn route riêng** — là một dialog
`posts/components/composer/PostComposerDialog.tsx`.

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
| `/nearby` | Tìm theo vị trí (API thật) — public |
| `/nearby/:id` | Chi tiết địa điểm — cần đăng nhập (`ProtectedRoute`) |
| `/ai-nutrition` | Chatbot dinh dưỡng (API thật) |
| `/posts/:id` | Chi tiết bài — public |
| `/recipes` | `MyRecipesPage` — công thức của tôi (lọc/sort client-side) — cần đăng nhập |
| `/recipes/create` | `CreateRecipePage` — cần đăng nhập |
| `/meal-plan` | `MealPlanPage` — thực đơn tuần + nút đổi trạng thái — cần đăng nhập |
| `/meal-plan/create` | `CreateMealPlanPage` — tự lập thực đơn — cần đăng nhập |
| `/profile`, `/my-posts` | Cần đăng nhập |
| `/subscription`, `/payment/result/:paymentId` | Gói AI + thanh toán VNPay — `subscription` feature |
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
- i18n **en là mặc định**, `vi` là secondary; cả 2 locale đều có đủ 14 namespace. Message validation dùng chung lấy từ namespace `validation`; message riêng của form recipe nằm trong namespace `recipe` (`errors.*`). Thêm key thì **thêm cho cả `en` và `vi`**.
- API trả wrapper `{ success: boolean, message: string, data: T }`.
- UI primitive ở `src/components/ui/` dùng `class-variance-authority` cho variants.
- Form theo pattern Formik + Yup.
- Backend nhận **camelCase** ở profile/recipe (không phải snake_case).

## Lưu ý khi làm việc

- **Đừng thêm dependency mới** nếu thư viện hiện có giải quyết được.
- Verify nhanh bằng `npm run typecheck` (`tsc -b --pretty false`) thay vì `npm run build`; test bằng `npm test` (gọi backend thật, tự skip khi thiếu env).
- `CategoriesPage` hiện có: thẻ đếm All/Active, tìm kiếm theo tên/UUID, sort `newest`/`name`, phân trang, retire (soft delete), export CSV. **Không** có restore hay permanent delete.
- `AdminRecipesPage`: đọc (`GET /api/admin/recipes`) + duyệt/từ chối (`POST .../approve|reject`). Lọc `moderationStatus` (mặc định `PENDING` qua `?status=`), `userId`/`categoryId`/khoảng ngày, sort whitelist `createdAt,desc` · `updatedAt,desc` · `name,asc`. Nút duyệt nằm trong dialog chi tiết, xác nhận qua `ConfirmDialog`. Không có sửa/xoá recipe. Duyệt recipe **không** duyệt dish/ingredient của nó. `GET`/`PATCH`/`DELETE /api/admin/recipes/{id}` **backend đã có** nhưng FE cố ý không gọi — row trong list đủ field cho dialog, gọi thêm là request thừa.
- `AdminRecipesPage` chưa có, nhưng backend **đã đủ** cho comment moderation: `GET /api/admin/comments` nhận `page`/`size`/`status`/`userId`/`postId`/`sort`; `POST .../moderate` `{reason}` bắt buộc ≤1000 ký tự. Mục sidebar `/admin/comments` còn `ready: false`.
- `subscription` feature (route `/subscription` + `/payment/result/:paymentId`) **đã dựng xong**, không phải mock: 7 hàm trong `api.ts`, 6 hook trong `useBilling.ts`, namespace i18n `subscription`. `usePayment` poll 3s khi `status === "pending"`; `useBuyPlan` kiểm tra eligibility rồi mới checkout. IPN là nguồn sự thật, redirect chỉ để hiển thị.
- `CreateRecipePage`: 4 khối đánh số (tổng quan → nguyên liệu → bước nấu → khẩu phần & thời gian). Cả 4 dùng `SectionCard` với `inlineHeader` (badge số nằm **cạnh** tiêu đề + đường kẻ xám phân cách body) — cờ này opt-in nên Create Post / Post Detail không đổi. 5 ô dinh dưỡng **đã bỏ khỏi UI** 2026-10-30 (mockup không có) nhưng `schema.ts`/`payload.ts` vẫn validate + gửi được. Nút Cancel/Create Recipe nằm ở prop `actions` của `RecipeSidebar` (dưới checklist), không ở header. `instructions` là `TEXT` thuần → form nhập **mỗi bước một ô** (`steps: {title, body}[]`), `joinSteps()` gộp thành `"tiêu đề — thân"` mỗi bước một dòng khi gửi; **không** dùng `RichTextEditor`. Không có field ảnh bìa (endpoint không nhận). Chưa có trang danh sách/chi tiết recipe công khai (thiếu `GET /api/recipes`).
- `CreateMealPlanPage`: 7 ngày × 3 ô bữa cố định (`BREAKFAST`/`LUNCH`/`DINNER`), ô trống không gửi. `validate.ts` thuần (không Yup) vì luật BR-MENU-005 là quan hệ giữa các ô: **≥5 món khác nhau**, **≤3 lần/món**. Nút Lưu khoá tới khi hết lỗi. Chỉ tạo `drafted`; đổi trạng thái bằng nút trên `MenuCard` (`MenuActions`) qua `POST /api/menus/{id}/status`. Không có endpoint xoá menu — `cancelled` là đường bỏ duy nhất. Không có ai/cron nào khác đổi status hộ user.
- `POST`/`PATCH`/`status` của menu trả shape khác `GET /api/menus/details` (thiếu `dish` đầy đủ) → sau khi ghi luôn `invalidateQueries(["meal-plans"])`, đừng render từ response.
- `MealPlanPage` mặc định chỉ hiện menu `status === "scheduled"`; `drafted`/`cancelled`/`completed` chọn qua `PillTabs` gắn `?status=`. Lọc **client-side** vì `GET /api/menus/details` không nhận `status`. Ô bữa chỉ hiện tên món; bấm mở `DishDetailDialog` dựng từ chính response của tuần (không có endpoint dish → recipe).
