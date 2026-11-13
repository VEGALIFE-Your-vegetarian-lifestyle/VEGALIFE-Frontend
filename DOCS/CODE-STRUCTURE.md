# Cấu trúc source code — VEGALIFE Frontend

> Cập nhật: 2026-10-30 · Branch: `update/ui-ux`
> Kiến trúc **feature-based**. **194 file `.ts`/`.tsx`** trong **81 thư mục** dưới `src/`.
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
│   │       ├── SectionCard.tsx      khối nội dung có tiêu đề (`inlineHeader`: badge cạnh tiêu đề + kẻ xám)
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
│   │   ├── menus/               xem mục 3.10
│   │   ├── nutrition-ai/        xem mục 3.5
│   │   ├── posts/               xem mục 3.6
│   │   ├── profile/             xem mục 3.7
│   │   ├── recipes/             xem mục 3.9
│   │   ├── saved/               xem mục 3.12
│   │   ├── subscription/        xem mục 3.11
│   │   └── videos/              xem mục 3.8
│   │
│   ├── i18n/
│   │   ├── index.ts             khởi tạo i18next, đăng ký 15 namespace
│   │   └── locales/{en,vi}/     15 namespace mỗi thứ tiếng, key phải khớp nhau
│   │       admin · aiNutrition · auth · common · explore · home ·
│   │       location · menu · nearby · post · profile · recipe · saved · subscription · validation
│   │
│   ├── shared/                  hạ tầng dùng chung, KHÔNG import features/ hay components/
│   │   ├── api/
│   │   │   ├── client.ts            axios instance + interceptor 401/refresh + refresh chủ động
│   │   │   ├── media.ts             xin thông tin upload + upload file
│   │   │   └── dishes.ts            searchDishes — GET /api/dishes (recipes + nutrition-ai + menus)
│   │   ├── auth/authStore.ts        user/accessToken/refreshToken, persist theo rememberMe
│   │   ├── hooks/
│   │   │   ├── useListParams.ts     page/filter/search ↔ URL query
│   │   │   └── useDebounce.ts       debounce giá trị (mặc định 300ms)
│   │   ├── types/
│   │   │   ├── common.ts            ApiResponse, Paginated, PageResponse, ListParams
│   │   │   ├── user.ts              User, UserProfile (đọc: + username/email/bmi), role, status, gender
│   │   │   ├── dish.ts              Dish đầy đủ (có createdAt)
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
admin          → posts, categories, videos, locations, profile, recipes
posts          → categories, auth
profile        → auth
recipes        → categories (chỉ useCategoryNames)
nutrition-ai, videos, categories, locations, menus → auth
```

**Ngoại lệ đã ghi nhận**: `features/profile/ProfilePage.tsx` import `getMyPosts`
từ `features/posts/api` cho thẻ thống kê (backend chưa có endpoint thống kê hồ sơ).
Có `ponytail:` tại chỗ; gỡ khi backend bổ sung endpoint.

`GET /api/dishes` được 3 feature dùng (`recipes` autocomplete, `nutrition-ai` DishPicker,
`menus` DishSlotPicker) nên nằm ở `shared/api/dishes.ts` thay vì feature nào.

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
| `constants.ts` | `POST_STATUS_VARIANT`, `POST_FLAG_VARIANT`, `canPublish`, `canReject` |
| `mockEnrichment.ts` | điền field mock **cấp card** cho Home/Explore/MyPosts (`enrichListItem`, `getMockActivity`) — mock cấp detail đã xoá 2026-10-29 |
| `mockAuthors.ts` | thẻ tác giả giả |
| `components/PostCard.tsx` | card bài — dùng ở Home / PostDetail (Related) |
| `components/PostStatusBadge.tsx` | badge trạng thái (`drafted/processing/published/unpublished`) |
| `components/PostFlagBadge.tsx` | verdict kiểm duyệt + `flagDetail` (score/threshold, % giống) — admin only |
| `components/CommentThread.tsx` | cây comment đệ quy — Explore dialog + Post Detail |
| `components/CommentComposer.tsx` | form gửi comment gốc — Explore dialog + Post Detail |
| `components/PostVoteButtons.tsx` | cặp nút vote ↑↓ + `GET/PUT /api/posts/{id}/votes` — Explore card + dialog |
| `components/editor/` | `RichTextEditor.tsx`, `EditorToolbar.tsx`, `PostContent.tsx`, `editorContent.ts` |
| `pages/HomePage/` | `HomePage.tsx` — MỘT file chứa cả trang lẫn các khối con (`HomeHero`, khối `SectionHeader` dùng chung, `HomeWeeklyBar`, `HomeDishes`, `HomeNearbyPicks`, `CommunityCard`) — và `homeData.ts` (shim gọi `/api/locations`, `/api/menus/details` vì `posts` không được import `locations`/`menus`) |
| `pages/ExplorePage/` | `ExplorePage.tsx` (hero + search pill + feed + phân trang số) + `ExploreFilterPanel.tsx` (cột lọc Category / Content Format + CTA) + `FeedPostCard.tsx` (card có tác giả, block công thức đính kèm, vote, nút 💬) + `PostCommentsDialog.tsx` (bình luận trong dialog) + `__tests__/` |
| `pages/MyPostsPage/` | bài của tôi |
| `pages/PostDetailPage/` | `PostDetailPage.tsx` + `CommentsSection.tsx` (tự lo query/mutation bình luận) + `__tests__/` |
| `components/composer/` | Dialog soạn bài dùng chung create + edit (không còn route): `PostComposerDialog.tsx`, `PostPreviewCard.tsx`, `RecipePickerDialog.tsx`, `recipeMeta.ts`, `schema.ts`, `payload.ts`, `__tests__/` |
| `__tests__/postApi.test.ts` | test service post |

### 3.7 `features/profile/`

| File | Vai trò |
|---|---|
| `ProfilePage.tsx` | hồ sơ (`embedded` để nhúng vào admin). 2 cột: rail danh tính (avatar, tên, email, BMI + metrics, quick links) + 1 form gộp cả 11 field, sticky save bar khi dirty |
| `api.ts` | đọc/cập nhật profile (wire format **camelCase**; 5 field dietary). Ghi 11 field; `username`/`email`/`bmi` chỉ đọc |
| `useProfile.ts` | query + mutation cập nhật profile |
| `TagInput.tsx` | ô nhập tag dạng chip: Enter để thêm, giới hạn 50 tag × 100 ký tự |
| `dietary.ts` | hằng số giới hạn, `DIETARY_SUGGESTIONS`/`GOAL_SUGGESTIONS`/`DIETARY_TONE` cho chip gợi ý, `toDietaryValues`, `normalizeTags` |
| `__tests__/dietary.test.ts` | test logic thuần: chuẩn hoá tag, copy mảng khi đọc profile |

### 3.8 `features/videos/`

| File | Vai trò |
|---|---|
| `VideosPage.tsx` | quản lý video (admin) |
| `api.ts` | video công khai + admin |
| `constants.ts` | `VIDEO_STATUS_VARIANT`, `VIDEO_STATUSES` |
| `types.ts` | `Video`, `VideoStatus` |

### 3.9 `features/recipes/`

| File | Vai trò |
|---|---|
| `api.ts` | `createRecipe`, `getMyRecipes` (`GET /api/recipes/me`), `searchIngredients` (gợi ý autocomplete) |
| `adminApi.ts` | `getAdminRecipes` — `GET /api/admin/recipes`, phân trang server |
| `constants.ts` | `MODERATION_VARIANT` — màu badge theo `ModerationStatus` |
| `types.ts` | `Recipe`, `CreateRecipeRequest`, `AdminRecipe`, `Difficulty`, `RecipeSort`, `Dish`, `Ingredient` |
| `pages/CreateRecipePage/CreateRecipePage.tsx` | form 4 khối (đánh số 1–4), route `/recipes/create` |
| `pages/CreateRecipePage/schema.ts` | `buildRecipeSchema(t)`, giới hạn, `RecipeStep`, `visibleSteps`, `duplicateIngredientIndexes`, `difficultyRankKey` |
| `pages/CreateRecipePage/payload.ts` | `buildRecipePayload` + `joinSteps` — gộp mảng bước thành 1 chuỗi `instructions`, bỏ field rỗng thay vì gửi `""` |
| `pages/CreateRecipePage/IngredientEditor.tsx` | bảng hàng nguyên liệu động (tên + số lượng + đơn vị + xoá) |
| `pages/CreateRecipePage/StepEditor.tsx` | mỗi bước 1 ô riêng (tiêu đề + thân), thêm/xoá/đổi thứ tự |
| `pages/CreateRecipePage/AutocompleteField.tsx` | Input + dropdown gợi ý; dùng chung cho dish và ingredient |
| `pages/CreateRecipePage/RecipeSidebar.tsx` | thẻ xem trước + checklist mức độ hoàn thiện + `actions` (nút Cancel/Create Recipe) + tiêu chuẩn thuần thực vật |
| `pages/CreateRecipePage/RecipePreviewCard.tsx` | thẻ xem trước dựng từ chính giá trị form (không có ảnh bìa — endpoint không nhận) |
| `pages/MyRecipesPage/MyRecipesPage.tsx` | danh sách công thức của mình, route `/recipes` — 4 `StatCard` + `PillTabs` (moderation) + lọc độ khó/tìm kiếm/sort + thẻ recipe (badge + meta prep/cook) + dialog chi tiết |
| `pages/MyRecipesPage/filter.ts` | `matchesRecipe` / `sortRecipes` / `recipeStats` + `PAGE_SIZE` — logic thuần để test được (endpoint trả mảng phẳng, không tham số) |
| `pages/AdminRecipesPage/AdminRecipesPage.tsx` | danh sách recipe cho admin (chỉ đọc) |
| `pages/AdminRecipesPage/RecipeDetailDialog.tsx` | chi tiết recipe render từ row đã tải (BE **có** `GET /api/admin/recipes/{id}`; FE cố ý không gọi — row đủ field) |
| `__tests__/adminApi.test.ts` | test `adminApi` |
| `pages/CreateRecipePage/__tests__/schema.test.ts` | validate + payload |
| `pages/MyRecipesPage/__tests__/filter.test.ts` | filter/sort/thống kê client |

### 3.10 `features/menus/`

| File | Vai trò |
|---|---|
| `types.ts` | `MenuStatus`, `MealType`, `Dish`, `Meal`, `MenuDay`, `MenuDetail`, `MealPlanParams`, `CreateMenuRequest`, `MenuWriteResult`, `MENU_STATUS_VARIANT` |
| `api.ts` | `getMealPlans({from,to})` — `GET /api/menus/details`; `createMenu` — `POST /api/menus`; `changeMenuStatus` — `POST /api/menus/{id}/status`; `deleteMenu` — `DELETE /api/menus/{id}` |
| `useMealPlans.ts` | `useQuery` theo cửa sổ ngày |
| `week.ts` | `toISODate`, `parseISODate`, `startOfWeek`, `addDays`, `weekDays` — thuần `Date` local |
| `components/MenuCard.tsx` | tiêu đề tuần + badge trạng thái + notes + lưới 7 ngày + `MenuActions` |
| `components/MenuActions.tsx` | nút đổi trạng thái theo bảng chuyển BR-MENU-007; không render nút khi đã kết thúc |
| `components/DayColumn.tsx` | một ngày: thứ, số ngày, danh sách bữa |
| `components/MealRow.tsx` | một bữa: loại bữa, tên món, số phần, ảnh, cuisine |
| `components/WeekNavigator.tsx` | ← tuần này → |
| `pages/MealPlanPage.tsx` | route `/meal-plan` (cần đăng nhập) |
| `components/MealPlanComposerDialog.tsx` | dialog tạo thực đơn (mount ở `Layout`, mở qua `uiStore.openMealPlanComposer`) — form + mutation + chép tuần trước |
| `create/schema.ts` | `MenuFormValues`, `emptyWeek`, `moveWeek`, `dishUsage`, `daysWithMeals`, `mostRepeatedDish` |
| `create/validate.ts` | BR-MENU-005 → `Record<fieldPath, message>`; **không** Yup (luật là quan hệ giữa các ô) |
| `create/payload.ts` | form → body `POST /api/menus` |
| `components/MealPlanMatrix.tsx` | ma trận 7 ngày × 3 bữa — surface xem + sửa duy nhất |
| `components/DishAssignPopover.tsx` | popover gán 1 món cho nhiều ngày của một bữa, khoá theo `MAX_DISH_REPEATS` |
| `create/__tests__/schema.test.ts` | schema + validate + payload + `setDishInDays` (24 case) |
| `__tests__/week.test.ts` | logic tuần: parse local, `startOfWeek`, `addDays`, `weekDays` |

Tự lập được menu (`POST /api/menus`, luôn `drafted`) và đổi trạng thái qua `MenuActions`.
Sửa nội dung menu (`PATCH`) chưa làm. Cửa sổ đang xem nằm trên URL (`?from=YYYY-MM-DD`) — 7 ngày
liền kề bắt đầu từ ngày đó, **thứ mấy cũng được** (backend chỉ kiểm 7 ngày liền kề, không kiểm
Thứ 2). `POST`/`PATCH`/`status` trả shape **khác** `GET /api/menus/details` (thiếu `dish` đầy
đủ) → sau khi ghi luôn invalidate `["meal-plans"]`.

### 3.11 `features/subscription/`

| File | Vai trò |
|---|---|
| `api.ts` | 7 hàm: `getPlans`, `getMySubscription`, `getSubscriptionHistory`, `cancelSubscription`, `checkPurchaseEligibility`, `createCheckout`, `getPayments`, `getPayment` |
| `useBilling.ts` | 6 hook React Query: `usePlans`, `useSubscriptionHistory`, `usePayments`, `usePayment` (poll 3s khi `pending`), `useCancelSubscription`, `useBuyPlan` (eligibility → checkout) |
| `types.ts` | `SubscriptionHistoryItem`, `CancelSubscriptionResponse`, `CheckoutResponse`, `PaymentItem`, `PaymentDetail`, `PaymentStatus`, `SubscriptionRowStatus` |
| `pages/SubscriptionPage/SubscriptionPage.tsx` | route `/subscription` — 2 tab (lịch sử mua / lịch sử thanh toán), huỷ gói qua `ConfirmDialog` |
| `pages/PaymentResultPage/PaymentResultPage.tsx` | route `/payment/result/:paymentId` — đọc trạng thái sau khi VNPay redirect về |

Namespace i18n riêng: `subscription`. IPN của VNPay là nguồn sự thật; trang kết quả chỉ
hiển thị (poll `GET /api/payments/{paymentId}` tới khi hết `pending`).

### 3.12 `features/saved/`

| File | Vai trò |
|---|---|
| `api.ts` | 6 hàm: `getSavedPosts`/`getSavedRecipes` (phân trang server), `savePost`/`unsavePost`, `saveRecipe`/`unsaveRecipe`; `getSaved*Ids` quét 1 trang `ID_SCAN_SIZE = 100` để biết trạng thái nút Save |
| `useSaved.ts` | `useSavePost(postId)` / `useSaveRecipe(recipe)` (optimistic toggle + rollback), `useAttachableRecipes()` (của mình + đã lưu, dedupe), `useRemoveSaved()` (bỏ lưu ở `/saved`) |
| `types.ts` | `SavedPost`, `SavedRecipe` (= `Recipe`) |
| `components/SaveButton.tsx` | `SavePostButton` (icon-only được), `SaveRecipeButton` (ẩn khi recipe của chính mình) |
| `components/SavedCards.tsx` | `SavedPostCard`, `SavedRecipeRow`, `SavedSkeleton`, `SavedEmpty` |
| `SavedPage.tsx` | route `/saved` — 2 tab Posts/Recipes (`?tab=`), phân trang server, mở `RecipeDetailDialog`, nút "Viết bài từ công thức này" → `openComposer(null, [recipeId])` |

Không có endpoint "đã lưu hay chưa" → trạng thái nút Save lấy từ Set id của một trang 100
mục (`ponytail:` ghi ở `api.ts`). `useAttachableRecipes` là chỗ duy nhất phải sửa nếu
`POST /api/posts/{id}/recipes` từ chối recipe của người khác.

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

- **Gọi API thật**: auth, posts, categories, profile (kể cả 5 field dietary), media,
  videos, admin users, locations, AI chatbot, recipes (`POST /api/recipes`,
  `GET /api/recipes/me`, `GET /api/dishes`, `GET /api/ingredients`, `GET /api/admin/recipes`), menus
  (`GET /api/menus/details`, `POST /api/menus`, `POST /api/menus/{id}/status`),
  subscription + payment (`subscription` feature — 7 endpoint),
  saved (`/api/saved/posts|recipes` × GET/POST/DELETE, `saved` feature).
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
| [PLAN-CREATE-RECIPE.md](PLAN-CREATE-RECIPE.md) | plan + quyết định của feature tạo công thức |
| [PLAN-MEAL-PLAN-VIEW.md](PLAN-MEAL-PLAN-VIEW.md) | plan + quyết định của trang thực đơn tuần (giai đoạn C) |
| [../GETSTARTED.md](../GETSTARTED.md) | cài đặt, chạy dev, quy ước commit |
