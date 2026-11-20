# VEGALIFE — Cẩm nang bảo vệ đồ án

Phạm vi: **admin, post, recipe, AI nutrition, meal plan, saved**.
Không gồm: location, dashboard, comment, vote, thanh toán (phần người khác làm).

Mỗi mục theo cùng một khuôn: **nghiệp vụ → luồng → file → câu hỏi giáo viên hay hỏi → đáp án**.

---

## 0. Nền chung phải nắm trước khi vào từng feature

### 0.1 Kiến trúc

Feature-based, một chiều:

```
app/       → features/**, shared/**, components/**
features/X → shared/**, components/**, features/<X phụ thuộc>
shared/    → KHÔNG import features/**, components/**
components/→ KHÔNG import features/**
```

Lý do: `shared/` và `components/` không biết domain. `components/ui/` là primitive (Button, Input, Dialog…), `components/common/` là component dùng chung có ý nghĩa nghiệp vụ nhẹ (PageHeader, EmptyState, Pagination…).

### 0.2 Ba tầng dữ liệu

| Tầng | Công cụ | Ở đâu |
|---|---|---|
| HTTP | axios instance `api` | `src/shared/api/client.ts` |
| Server state | TanStack React Query 5 | hook trong từng `features/*/use*.ts` hoặc gọi trực tiếp trong page |
| Form state | Formik + Yup | `useFormik` trong dialog/page, schema tách file `schema.ts` |

**Quy ước bắt buộc nhớ:**

- Mọi API trả wrapper `{ success, message, data }` → luôn `data.data`.
- Phân trang Spring: `page` **0-based** trên wire, **1-based** trên UI. Các hàm admin tự `page - 1`.
- Lỗi: luôn đọc bằng `getApiErrorMessage(error, fallback)` (`src/shared/utils/apiError.ts`), **không** dùng `error.message` (axios chỉ trả `"Request failed with status code 400"`).

### 0.3 `client.ts` — interceptor

- Request: tự gắn `Authorization: Bearer <accessToken>`.
- Trước khi gửi: nếu token hết hạn hoặc còn < 60s → refresh chủ động.
- 401 → refresh; refresh fail → logout + về `/login`.
- Timer refresh nền mỗi 14 phút (`scheduleTokenRefresh`).
- `rawClient` (không interceptor) dành riêng cho `/auth/refresh` để tránh vòng lặp vô hạn.

### 0.4 `getApiErrorMessage` — thứ tự ưu tiên

1. `response.data.errors[]` (mảng câu lỗi)
2. `response.data.data` nếu là map field → string (validate kiểu Spring)
3. `response.data.message`
4. câu fallback của màn hình

Thêm `isTimeoutError()` và `isNotFound()` — dùng cho chỗ cần phân biệt "client tự cắt" với "server báo lỗi", và "404 = đã xoá rồi" (idempotent).

### 0.5 `useListParams` — state phân trang/filter trên URL

`src/shared/hooks/useListParams.ts`

- `page`, `status` nằm trên **URL** (`?page=2&status=PENDING`) → F5 không mất, share link được.
- `q` nằm trong `useState` + `useDebounce(300ms)` → gõ không bắn request mỗi ký tự.
- `setQ`/`setStatus` tự reset `page` về 1.
- Dùng ở: `PostsPage`, `UsersPage`, `AdminRecipesPage`, `AdminDishesPage`, `AdminIngredientsPage`, `MyPostsPage`.

### 0.6 `uiStore` — nơi mount dialog dùng chung

`src/shared/ui/uiStore.ts` (Zustand). Ba dialog **mount một lần** ở `Layout`, mở bằng action:

| Dialog | Action | Thay cho route cũ |
|---|---|---|
| `PostComposerDialog` | `openComposer(postId?, recipeIds?)` | `/posts/create`, `/posts/:id/edit` |
| `MealPlanComposerDialog` | `openMealPlanComposer(from?)` | `/meal-plan/create` |
| `RecipeComposerDialog` | `openRecipeComposer()` | `/recipes/create` |

Lý do bỏ route riêng: dialog giữ được context trang đang xem, không mất state khi đóng, và không phải khai báo lại guard.

### 0.7 i18n

15 namespace. Feature bạn làm dùng: `admin`, `post`, `home`, `explore`, `recipe`, `menu`, `saved`, `aiNutrition`, `subscription`, `validation`, `common`.
**Thêm key thì thêm cả `en` và `vi`.** `en` là mặc định.

---

## 1. POST — bài viết

### 1.1 Nghiệp vụ

**Bài viết có 5 trạng thái** (`src/features/posts/types.ts`):

```
drafted ──publish:true──> processing ──filter xong──> pending ──admin duyệt──> published
   ↑                                                      └──admin từ chối──> unpublished
   └────────────────────── publish:false (rút về nháp) ────────────────────────┘
```

| status | nghĩa |
|---|---|
| `drafted` | nháp, chỉ tác giả thấy |
| `processing` | đã gửi duyệt, bộ lọc AI còn chạy, **chưa có verdict** → `flag = null` |
| `pending` | verdict đã có, **chờ admin quyết**. Đây là "chờ duyệt" thật |
| `published` | công khai trong feed |
| `unpublished` | bị admin từ chối, có `rejectionReason` |

**`flag`** = phán quyết của bộ lọc tự động (`FILTER_PASSED`, `FILTER_FAILED`, `SIMILAR_CONTENT`, `FILTER_SKIPPED`). `flag` trả lời "máy thấy gì", `status` trả lời "công khai thấy được không". Filter fail **không** tự đẩy sang `unpublished` — chỉ admin từ chối mới tới đó.

> Câu hỏi hay gặp: *"Sao bài bị filter fail mà vẫn `pending`?"* → Vì filter chỉ tạo verdict, quyết định cuối là của người. Giữ `flag` + `rejectionReason` cùng nhau tạo biên bản: máy thấy gì, người quyết gì.

### 1.2 Luồng tạo bài — 3 request, không phải 1

`POST /api/posts` **chỉ nhận** `{ title, content, rawContent, featuredImageUrl }` và luôn tạo ở `drafted`. Mọi thứ khác phải gọi tiếp.

```
1. POST /api/posts                          → tạo draft, lấy id
2. PATCH /api/posts/{id}                    → { title, content, rawContent, featuredImageUrl?,
                                                categoryIds?, publish: true? }
3. POST /api/posts/{id}/recipes             → { recipeIds }   (nếu có gắn công thức)
4. POST /api/posts/{id}/media               → { mediaIds }    (nếu có video trong bài)
```

Code: `saveMutation` trong `src/features/posts/components/composer/PostComposerDialog.tsx:127-157`.

**Vì sao 2 bước cho phần sửa?** `PATCH` là partial — field bỏ trống giữ nguyên. `attachPostRecipes`/`attachPostMedia` **thay thế toàn bộ tập cũ**, gửi mảng rỗng = bỏ hết. Nên lúc sửa phải luôn gọi cả hai (kể cả mảng rỗng) để đồng bộ.

### 1.3 Nội dung lưu HAI dạng

`src/features/posts/components/editor/editorContent.ts`

| Field | Kiểu | Dùng làm gì |
|---|---|---|
| `content` | text thuần | tìm kiếm, trích đoạn card, đếm thời gian đọc |
| `rawContent` | JSON ProseMirror (object) | render lại bằng TipTap, **không có đường XSS** vì không phải HTML |

Hàm quan trọng:

- `editorJsonToText(doc)` — duyệt cây, gom text lá, xuống dòng sau mỗi block.
- `isEditorEmpty(doc)` — editor rỗng vẫn là doc hợp lệ nên Yup `required` cho qua; phải kiểm riêng. Bài **chỉ có video** vẫn tính là có nội dung.
- `collectVideoMediaIds(doc)` — gom `mediaId` của node video, giữ thứ tự, khử trùng.
- `parseStoredContent(rawContent)` — object hoặc chuỗi JSON → doc hợp lệ, sai thì `null` (chỗ gọi fallback về `content`).
- `textToDoc(text)` — bài cũ không có `rawContent` vẫn mở được trong editor.

### 1.4 Upload media — 3 bước

`src/shared/api/media.ts`

```
1. POST /api/media/upload        → { mediaId, upload: { url, fields } }   (xin grant)
2. PUT/POST thẳng lên provider   → dùng XMLHttpRequest để có upload.onprogress
3. POST /api/media/{id}/confirm  → { mediaUrl, status: "succeed" }
```

- Dùng `XMLHttpRequest` chứ không `fetch` **chỉ vì** cần `upload.onprogress` — file 50 MB mất vài phút, không có % người dùng tưởng treo.
- **Không chặn dung lượng phía client.** Giới hạn là setting admin sửa được (`max_image_upload_mb` / `max_video_upload_mb`), BE trả 400 kèm câu cụ thể → phải hiện nguyên văn qua `getApiErrorMessage`.
- `attachPostMedia` chỉ nhận media đã `confirm` xong, nếu không BE trả 400.

### 1.5 Video "di trú"

Trước đây video nằm ở `mediaIds` của bài. Giờ video nằm **trong nội dung** dưới dạng node TipTap giữ `mediaId`. Khi sửa bài cũ:

```ts
// PostComposerDialog.tsx:120-124
const legacyMediaIds = existingPost.mediaIds.filter(id => !embedded.has(id));
// rồi khi lưu:
await attachPostMedia(id, [...collectVideoMediaIds(values.content), ...legacyMediaIds]);
```

Không cộng lại thì lần sửa đầu tiên **xoá mất video cũ** vì `attachPostMedia` thay thế toàn bộ.

### 1.6 Feed và danh sách

| Hàm | Endpoint | Ghi chú |
|---|---|---|
| `getFeedPosts` | `GET /api/posts` | public, chỉ `published`, `size ≤ 100` |
| `getPostDetail` | `GET /api/posts/{id}` | cần JWT, trả mọi status (tác giả xem được draft của mình) |
| `getMyPosts` | `GET /api/posts/me` | JWT, mọi status, **không có `keyword`** → lọc client |
| `getMyPostsCounts` | `GET /api/posts/me?size=100` | đọc 1 trang lớn rồi đếm tại chỗ |
| `getRelatedPosts` | `GET /api/posts/{id}/related?limit=` | BE chấm điểm tương đồng |
| `getPosts` | `GET /api/admin/posts` | mọi status + `flag` + `displayName` + `email` |
| `getAdminPostDetail` | `GET /api/admin/posts/{id}` | kèm `recipes[]` + `names[]` (component đính kèm) |

**Filter chỉ thu hẹp**: bỏ tham số nào thì tham số đó không lọc. Đừng gửi `""` cho enum/UUID (400).

**`getMyPostsCounts` là chỗ có `ponytail:`** — trần 100 bài, vì backend chưa có endpoint count theo status. Nếu giáo viên hỏi "user có 500 bài thì sao": số đếm sai ở các status ngoài trang đầu; cách sửa là xin BE thêm `GET /api/posts/me/counts`.

### 1.7 Poll trạng thái

`PostDetailPage` poll 3s **chỉ khi** `status === "processing"`:

```ts
refetchInterval: (q) => (q.state.data?.status === "processing" ? 3000 : false)
```

Lý do: filter chạy async, vài giây sau tự flip sang `pending`/`published`. Sang `pending` là chờ admin — poll không đổi được gì nên tắt.

`MyPostsPage` poll bảng đếm theo cùng logic (chỉ khi còn bài `processing`).

### 1.8 Admin duyệt bài

`src/features/admin/pages/PostsPage/PostsPage.tsx`

```
POST /api/admin/posts/{id}/approve   → publish bài + duyệt luôn component PENDING mà bài tham chiếu
POST /api/admin/posts/{id}/reject    → unpublish + từ chối component PENDING (component đã duyệt giữ nguyên)
```

- `canPublish`/`canReject` (`src/features/posts/constants.ts`): chỉ `pending` hoặc `processing`. Bài `drafted` chưa ai gửi → BE trả 400; `published`/`unpublished` không còn nút.
- `reason` optional với approve, có với reject (lưu vào `moderation_log`).
- `flag` **không đổi** sau khi duyệt — bài `FILTER_FAILED` vẫn giữ flag đó, nghĩa là "admin duyệt đè máy".

### 1.9 Mock còn lại

`src/features/posts/mockEnrichment.ts` — bơm `authorCard`, `durationLabel`, `rating`, `commentCount`, `saveCount` ở tầng **card**. Mọi giá trị băm từ `post.id` nên cùng bài luôn ra cùng số. Post Detail **đã bỏ hết mock**. Khi BE bổ sung field → xoá file, sửa `enrichListItem`, UI không phải đổi.

### 1.10 Câu hỏi giáo viên hay hỏi — POST

| Câu hỏi | Trả lời |
|---|---|
| Vì sao tạo bài phải 3-4 request? | `POST /api/posts` chỉ nhận 4 field, luôn tạo draft. Category/publish/recipe/media đều là endpoint riêng của BE. |
| Sao không gửi `rawContent` dạng string? | ProseMirror là object; gửi string thì phải parse lại, và BE lưu JSONB nên gửi thẳng. |
| Editor rỗng mà sao vẫn submit được? | Có `isEditorEmpty()` chặn riêng ở `onSubmit` — Yup không bắt được vì doc rỗng vẫn hợp lệ. |
| Vì sao không chặn file > 5MB? | Hạn mức là setting admin sửa được; chặn cứng ở client sẽ lệch với cấu hình. BE trả 400 kèm câu cụ thể. |
| Vì sao `attachPostMedia` gửi cả `legacyMediaIds`? | Nó **thay thế toàn bộ**; không cộng lại thì video cũ bị xoá. |
| Filter AI fail sao bài không tự ẩn? | Thiết kế: máy chỉ ra verdict, người quyết. Giữ `flag` để admin biết máy thấy gì. |
| Sao `getMyPosts` lọc `q` ở client? | Backend không có `keyword` cho `/api/posts/me`. Có `ponytail:` đánh dấu, và trần là trang hiện tại. |
| React Query key vì sao có cả filter? | Đổi filter = dữ liệu khác → phải là key khác, không được dùng cache cũ. |

---

## 2. RECIPE — công thức

### 2.1 Nghiệp vụ

Công thức thuộc về **một user**, gắn với **một dish** (tên món dùng chung). Ba thực thể có kiểm duyệt độc lập:

| Thực thể | Bảng | Ai tạo | Duyệt bằng |
|---|---|---|---|
| Recipe | `recipe` | member | `POST /api/admin/recipes/{id}/approve` |
| Dish (tên món) | `dish` | find-or-create khi tạo recipe | `POST /api/admin/dishes/{id}/approve` |
| Ingredient | `ingredient` | find-or-create khi tạo recipe | `PATCH /api/admin/ingredients/{id}` (điền unit + dinh dưỡng) |

**Quan trọng: duyệt recipe KHÔNG duyệt dish/ingredient của nó.** Vì `GET /api/dishes` chỉ trả dish `APPROVED`, món do member gõ khi tạo recipe sẽ **không bao giờ hiện** ở ô chọn món của thực đơn cho tới khi admin duyệt dish riêng. Đây là lý do có nút "Duyệt món" trong `RecipeDetailDialog`.

`REJECTED` là **chặn vĩnh viễn**: member không tạo lại được tên đó.

### 2.2 Tạo công thức

UI: `RecipeComposerDialog` (dialog, không còn route `/recipes/create`).

```
Form (Formik)  ──buildRecipePayload()──>  POST /api/recipes  ──>  Recipe (PENDING)
```

**Điểm phải nắm — form khác payload:**

| Trong form | Trên wire |
|---|---|
| `steps: { title, body }[]` — mỗi bước một ô | `instructions: string` — `joinSteps()` gộp |
| `amount`, `servings` là **string** (input HTML) | **number** |
| `existing?: boolean` trên dòng nguyên liệu | **không gửi** — chỉ để biết có gửi `unit` hay không |

`joinSteps` (`CreateRecipePage/payload.ts:17`):
```ts
steps.map(s => [s.title.trim(), s.body.trim()].filter(Boolean).join(" — ")).join("\n")
```
Backend chỉ nhận `instructions` là **một chuỗi TEXT**. Xuống dòng đơn để `RecipeDetailDialog` (`whitespace-pre-line`) hiện đúng từng bước.

**Vì sao không dùng RichTextEditor cho instructions?** BE nhận TEXT thuần, không phải ProseMirror. Dùng rich text sẽ phải serialize ngược, không đáng.

### 2.3 Đơn vị nguyên liệu — cái bẫy

| Ngữ cảnh | Mã | Ví dụ |
|---|---|---|
| Form gửi lên (nguyên liệu **mới**) | `g` / `ml` / `piece` (chữ thường) | `UNITS` trong `types.ts` |
| BE lưu và trả về | `G` / `ML` / `PIECE` (chữ hoa) | `INGREDIENT_UNITS` |

- Nguyên liệu **đã tồn tại** (chọn từ autocomplete, `existing = true`) → BE **bỏ qua** `unit`; amount đọc theo đơn vị đã lưu. Payload không gửi `unit`.
- `kg`/`tbsp`/`cup` → 400.

### 2.4 Dinh dưỡng — FE KHÔNG gửi

`Recipe.nutritionResolved` + 5 field `calories/proteinG/carbohydrateG/fatG/fiberG` là **tổng cả công thức**, BE tính từ `Σ(amount × giá trị/đơn vị)` của từng nguyên liệu.

- `nutritionResolved === false` → **cả 5 field đều `null`** (không bao giờ lẻ).
- `0` là giá trị thật (nước = 0 kcal) — **đừng** coi là thiếu dữ liệu.
- Không chia `servings` khi hiển thị.

`src/features/recipes/nutrition.ts` → `nutritionTotals()` rẽ nhánh theo `nutritionResolved`, **không** suy ra từ `calories != null`.

### 2.5 Validate form

`src/features/recipes/pages/CreateRecipePage/schema.ts` — Yup, dựng qua `buildRecipeSchema(t)` để message dịch được.

| Rule | Lý do |
|---|---|
| `name`, `dishName` required, ≤ 255 | BE `@Size` |
| `amount` khớp `/^\d+(\.\d{1,3})?$/` và > 0 | BE `@Digits(fraction=3)` |
| `unit` rỗng được, khác rỗng phải thuộc `UNITS` | BE bỏ qua unit của nguyên liệu đã tồn tại |
| `steps`: bỏ hết ô trống thì lỗi | Chuỗi gộp ra `""`, BE chặn `minLength: 1` |
| 1 bước: có title mà không có body → lỗi | Bước rỗng thành dòng vô nghĩa |
| `ingredients`: 1..50 | `MAX_INGREDIENTS` |
| `duplicateIngredientIndexes()` | Trùng tên → lỗi cấp mảng, Yup không gắn được vào field nên `IngredientEditor` tự dựng message |

`visibleSteps()` lọc ô hoàn toàn trống **và** chuẩn hoá `{ title: undefined }` → `""` (Yup `object()` rỗng không fill khoá thiếu, đọc `.trim()` sẽ nổ).

### 2.6 Danh sách công thức của tôi

`src/features/recipes/pages/MyRecipesPage/`

- Tab (moderationStatus) + difficulty lọc **ở server** (`GET /api/recipes/me`).
- Từ khoá lọc **client** — backend không có `keyword` cho route này.
- `getMyRecipes` gom **một trang 100** rồi trả mảng phẳng (`ponytail:` trần 100).
- Thẻ thống kê + số trên pill đếm **toàn bộ** công thức → query riêng `["my-recipes"]`, dùng chung key với `AccountLayout`.
- Xoá: `useDeleteRecipe` → `DELETE /api/recipes/{id}`, **xoá mềm**, không restore. `404` coi như thành công (idempotent, retry sau timeout).

### 2.7 Admin duyệt công thức

`src/features/recipes/pages/AdminRecipesPage/AdminRecipesPage.tsx`

Màn mặc định là **hàng đợi `PENDING`** (`DEFAULT_MODERATION`). Bộ lọc: `?status=` (dùng chung key với các trang admin khác), khoảng ngày, `keyword`. Sort whitelist: `createdAt,desc` · `updatedAt,desc` · `name,asc` — sai giá trị BE trả 400.

**Luồng duyệt — quan trọng, hay bị hỏi:**

```ts
// AdminRecipesPage.tsx:111-123
for (const patch of patches) await updateAdminIngredient(patch.ingredientId, patch.payload);
return approveRecipe(recipe.id);
```

Admin điền unit + 5 dinh dưỡng cho các nguyên liệu còn thiếu **rồi mới** approve. Hai lời gọi **không chung transaction** ở BE → PATCH nào lỗi thì dừng, recipe không được duyệt, admin thấy lỗi và bấm lại (các PATCH đã xong là idempotent).

`missingRequiredIngredients[]` trong `AdminRecipe` chính là danh sách lý do recipe chưa có tổng dinh dưỡng.

**Các endpoint admin recipe:**

| Endpoint | Ghi chú |
|---|---|
| `GET /api/admin/recipes` | trả **cả** recipe xoá mềm với `status: "DELETED"` |
| `PATCH /api/admin/recipes/{id}` | **chỉ 7 field** văn bản/số. Không sửa được ingredients/dish/dinh dưỡng |
| `POST .../approve` \| `/reject` | idempotent; reject không xoá gì nhưng chặn tên tạo lại |
| `DELETE /api/admin/recipes/{id}` | xoá mềm, **không có restore** |
| `GET /api/admin/recipes/{id}` | **FE cố ý không gọi** — row list đã đủ field cho dialog, gọi thêm là request thừa |

### 2.8 Admin quản lý món và nguyên liệu

**`AdminDishesPage`** (`/admin/dishes`) — CRUD + duyệt, lọc `name` + `moderationStatus` ở server, sort cố định `createdAt,desc`. Tạo tay vào thẳng `APPROVED`. **Có** nút Duyệt/Từ chối nhưng **chỉ hiện ở hàng `PENDING`** (`approveDish`/`rejectDish` → `adminApi.ts`); từ chối đi qua `ConfirmDialog` vì là chặn vĩnh viễn (BR-DISH-001). Không đụng nguyên liệu của món. `AdminDishResponse` **không có** `status`/`deletedAt` → không phân biệt được món đã xoá mềm.

**`AdminIngredientsPage`** (`/admin/ingredients`) — đây là nơi sửa dinh dưỡng. Luật all-or-nothing (`src/features/recipes/ingredientForm.ts`):

- 5 giá trị dinh dưỡng: nhập **đủ 5 hoặc không nhập cái nào** (1–4 → 400).
- Có dinh dưỡng mà **không có `unit`** → 400 (dinh dưỡng "/1 đơn vị" vô nghĩa).
- `PATCH` chỉ gửi field **đã đổi**; không đổi gì thì `payload = null`, chỗ gọi khỏi gọi API.
- Badge đỏ ở sidebar `AdminShell` = số ingredient `PENDING` (`countAdminIngredients("PENDING")`, đọc 1 row lấy `totalElements`).

### 2.9 Câu hỏi giáo viên hay hỏi — RECIPE

| Câu hỏi | Trả lời |
|---|---|
| Sao form nhiều ô bước mà BE chỉ có 1 field? | BE nhận `instructions` TEXT thuần; `joinSteps()` gộp mỗi bước một dòng `"tiêu đề — thân"`. |
| Dinh dưỡng lấy từ đâu? | BE tính từ dinh dưỡng từng nguyên liệu × amount. FE không gửi, chỉ hiển thị. |
| `0` kcal là lỗi hay thật? | Thật (nước). Phân biệt bằng `nutritionResolved`, không bằng `!= null`. |
| Duyệt recipe có duyệt món luôn không? | **Không.** Ba thực thể duyệt độc lập. Vì thế dialog duyệt có nút "Duyệt món". |
| Sao phải PATCH ingredient trước khi approve? | Recipe chỉ có tổng dinh dưỡng khi mọi nguyên liệu đã có unit + 5 giá trị. Không transaction chung → làm tuần tự, lỗi thì dừng. |
| Vì sao `unit` gửi `g` mà BE trả `G`? | Form gửi mã chữ thường BE nhận; BE lưu enum chữ hoa. Hai hằng số riêng: `UNITS` vs `INGREDIENT_UNITS`. |
| Sao nguyên liệu chọn từ autocomplete không gửi unit? | Đã tồn tại → BE bỏ qua unit, amount đọc theo đơn vị đã lưu. |
| Vì sao xoá recipe 404 mà vẫn báo thành công? | Idempotent: 404 = đã xoá rồi (tab khác xoá trước, hoặc retry sau timeout). |
| Sao không có trang chi tiết recipe công khai? | Thiếu `GET /api/recipes` list ở thời điểm làm; `getPublicRecipes` đã có nhưng dùng cho tab Explore. |

---

## 3. AI NUTRITION — chatbot dinh dưỡng

### 3.1 Nghiệp vụ

Chatbot tư vấn dinh dưỡng, **tốn lượt hỏi** (request allowance). Mọi endpoint cần JWT.

```
POST /api/ai/messages              → { conversationId?, message } → { conversationId, reply, usage }
GET  /api/ai/conversations         → danh sách hội thoại (mới nhất trước)
GET  /api/ai/conversations/{id}    → messages cũ → mới, có thể chứa role "system"
GET  /api/subscriptions/me         → { remainingUsage }
POST /api/subscriptions/acquire    → claim FREE hoặc tạo phiên VNPay
GET  /api/subscriptions/history    → lịch sử mua
```

V48: `remainingUsage` là **một con số duy nhất, không hết hạn** (trước đây là hạn mức/tháng).

### 3.2 `useAiChat` — hook trung tâm

`src/features/nutrition-ai/useAiChat.ts`

State: `activeId` (hội thoại đang mở), `historyId` (đang xem lại), `local` (cặp hỏi/đáp vừa gửi), `pendingText`, `usage`, `error`, `failedText`, `timedOut`.

**Ba điểm thiết kế phải nhớ:**

**(a) Không set `historyId` sau khi gửi.** `local` đã giữ cặp hỏi/đáp; refetch detail lúc đó sẽ render **trùng** cả hai.

**(b) Timeout ≠ thất bại.** Lượt gọi tool (tìm món → tạo thực đơn) mất 40–90s. `sendAiMessage` nới `timeout: 90_000` (mặc định của `api` là 30s). Nếu vẫn timeout:

```ts
if (isTimeoutError(err)) {
    setTimedOut(true);
    invalidate meal-plans / conversations / subscription
    return true;   // ← trả true để ChatPanel KHÔNG đẩy lại câu hỏi vào ô nhập
}
```

Lý do trả `true`: gửi lại lúc này = **tạo thực đơn thứ hai** (BE không có idempotency key). Backend vẫn chạy tiếp và thường đã tạo xong menu — F5 mới thấy menu chính là triệu chứng của việc thiếu bước invalidate này.

**(c) `sendingRef` chặn double-send.** `isPending` của React Query chỉ đổi **sau** re-render, nên Enter + click trong cùng một tick vẫn lọt.

**404** = hội thoại không còn (id lạ hoặc của member khác) → reset về hội thoại mới.
**429** = hết lượt → `ChatPanel` hiện nút mua gói.

### 3.3 Gói và hạn mức

`src/features/nutrition-ai/useSubscription.ts` → `GET /api/subscriptions/me`, `staleTime 60s`.

`AiNutritionPage` xác định "đã từng mua gói" bằng cách soi **history** (`source === "PURCHASE" && status === "succeeded"`), vì `/subscriptions/me` chỉ trả `remainingUsage`.

```ts
// ponytail: chỉ soi trang history đầu (10 row)
```

Claim gói FREE: `useAcquirePlan().mutate("FREE")` → trả `action: "CLAIMED"` (hoặc lý do không claim được).

> `AiSubscription.currentPlan` **vắng hẳn** (không phải `null`) khi user chưa từng mua gói — đã từng crash `Cannot read properties of undefined`. Luôn đọc optional chaining.

### 3.4 AI tạo thực đơn

Chatbot có tool gọi BE để tạo menu. Hệ quả FE:

- Sau khi gửi thành công → invalidate `["meal-plans"]` để trang Meal Plan thấy menu mới.
- Timeout → cũng invalidate (backend có thể đã tạo xong).
- `MAX_MESSAGE_LENGTH = 4000` khớp validate BE.

### 3.5 Câu hỏi giáo viên hay hỏi — AI

| Câu hỏi | Trả lời |
|---|---|
| Vì sao timeout 90s mà mặc định 30s? | Lượt gọi tool (tìm món → tạo menu) mất 40–90s. Chỉ nới cho riêng endpoint này. |
| Timeout thì báo lỗi chứ? | Không. Client tự cắt, BE vẫn chạy. Báo "thất bại" là sai sự thật và mời user tạo menu trùng. |
| Vì sao không dùng streaming? | `POST /api/ai/messages/stream` cần `fetch` + `getReader` và tự xử lý 401/refresh vì không đi qua interceptor axios. Để dành khi cần hiệu ứng gõ chữ. |
| Làm sao biết user đã mua gói? | `/subscriptions/me` chỉ trả `remainingUsage`; phải soi history lần mua `succeeded`. |
| Vì sao chặn double-send bằng ref? | `isPending` đổi sau re-render → Enter + click cùng tick vẫn lọt. |
| Chat gửi xong có refetch hội thoại không? | Không — `local` đã giữ cặp hỏi/đáp, refetch sẽ render trùng. |

---

## 4. MEAL PLAN — thực đơn tuần

### 4.1 Nghiệp vụ — BR-MENU-005

`src/features/menus/types.ts` (hằng số) + `src/features/menus/create/validate.ts` (luật)

| Luật | Giá trị | Hằng số |
|---|---|---|
| Số ngày | **đúng 7 ngày liền kề** `startDate..startDate+6` | — |
| Mỗi ngày | ≥ 1 bữa | `dayEmpty` |
| Số món khác nhau trong tuần | **≥ 5** | `MIN_DISTINCT_DISHES` |
| Số lần dùng một món | **≤ 3** | `MAX_DISH_REPEATS` |
| Ngày bắt đầu | **sau hôm nay** (từ mai) | `minStartDateISO()` |
| `notes` | ≤ 500 | `MAX_NOTES_LENGTH` |
| `servings` | ≥ 1, form luôn gửi `1` | `DEFAULT_SERVINGS` |

**Ngày bắt đầu là thứ mấy cũng được** — backend chỉ đòi đúng 7 ngày liền kề, không kiểm thứ 2. FE đã bỏ snap-về-Monday (2026-11-13).

### 4.2 Vì sao validate KHÔNG dùng Yup

```ts
// create/validate.ts:5-12
// Luật BR-MENU-005 dạng quan hệ giữa các ô (đếm trên cả tuần), nên không dùng Yup —
// Yup mô tả schema theo từng field, nhồi vào .test() gốc thì vẫn phải viết hàm đếm y hệt
// mà mất khả năng gắn lỗi vào đúng ô.
```

`validate(values, t)` trả `Record<string, string>` với key phẳng: `days.<i>` (ngày trống), `week` (cấp tuần), `startDate`. Lỗi `week` ưu tiên luật **lặp** (cụ thể hơn) trước luật **thiếu món**.

### 4.3 Surface duy nhất: ma trận 7×3

`MealPlanComposerDialog` → `MealPlanMatrix` (7 cột ngày × 3 hàng bữa) → `MealRow` → `DayColumn`.

- Bấm ô hoặc nhãn bữa → `DishAssignPopover` (gán **1 món cho nhiều ngày** cùng lúc).
- Popover: search `GET /api/dishes` (debounce 250ms), chip "món đã dùng trong tuần" (không gọi API), tick chọn ngày, đếm `remaining = MAX_DISH_REPEATS - usedCount - newCost`.
- `setDishInDays()` là **đường ghi duy nhất** — cả popover lẫn nút xoá ô đều đi qua.
- Ô trống **không gửi** lên.

`moveWeek(values, startDate)` đổi cửa sổ 7 ngày mà **giữ món theo vị trí** (ngày 1 vẫn là ngày 1).

### 4.4 `week.ts` — cái bẫy ngày tháng

```ts
// KHÔNG dùng `new Date("2026-11-20")` — chuỗi chỉ có ngày được parse thành UTC midnight,
// ở múi giờ âm sẽ lùi mất một ngày.
parseISODate("2026-11-20") → new Date(2026, 10, 20)   // giờ máy
```

Còn chặn ngày không tồn tại (`2026-02-31` tự nhảy sang tháng 3 → trả `Invalid Date`).

### 4.5 Trang xem `/meal-plan`

- Cửa sổ **7 ngày trượt** từ `?from=` (thứ mấy cũng được, mặc định hôm nay). `WeekNavigator` dịch ±7 ngày.
- Lọc **status ở client** vì `GET /api/menus/details` không nhận `status`. Mặc định chỉ hiện `scheduled`; `drafted`/`cancelled`/`completed` chọn qua `PillTabs` gắn `?status=`.
- `counts` tính từ chính mảng response — không gọi thêm API.

### 4.6 Đổi trạng thái và xoá

`MenuActions.tsx`

```
drafted   → scheduled | cancelled
scheduled → cancelled
cancelled → (hết)
completed → (hết)
```

Bảng `NEXT_ACTIONS` chỉ render hành động **hợp lệ** thay vì render rồi disable. UI **không có nút "hoàn thành"** (bỏ 2026-11-13 theo yêu cầu). Nút Xoá hiện cho **mọi** trạng thái (`DELETE /api/menus/{id}`), xác nhận qua `ConfirmDialog`.

**409** khi schedule trùng tuần với menu `scheduled` khác → hiện nguyên văn message BE.

### 4.7 Cái bẫy: response ghi khác response đọc

`POST /api/menus`, `PATCH`, `POST /{id}/status` trả `MenuWriteResult` — meals chỉ có `dishId`/`dishName`/`imageUrl`, **không nhúng `dish`**.
`GET /api/menus/details` trả `MenuDetail` — meals có `dish` đầy đủ + `recommendedRecipes[]`.

→ **Sau mọi thao tác ghi luôn `invalidateQueries(["meal-plans"])`**, đừng render từ response.

### 4.8 Câu hỏi giáo viên hay hỏi — MEAL PLAN

| Câu hỏi | Trả lời |
|---|---|
| Sao validate không dùng Yup như form khác? | Luật là quan hệ giữa các ô (đếm trên cả tuần), Yup mô tả theo field. Viết Yup vẫn phải tự đếm mà mất khả năng gắn lỗi đúng ô. |
| Vì sao ngày bắt đầu không bắt buộc thứ 2? | Backend chỉ kiểm 7 ngày liền kề, không kiểm thứ. Snap về Monday là ràng buộc FE tự thêm, đã bỏ. |
| Sao `servings` luôn = 1? | Thực đơn là của cá nhân; BE vẫn bắt buộc field nên vẫn gửi 1. |
| Vì sao không render từ response POST? | Response ghi thiếu `dish` đầy đủ. Phải invalidate rồi đọc lại `GET /api/menus/details`. |
| Vì sao `parseISODate` không dùng `new Date(iso)`? | Chuỗi `YYYY-MM-DD` parse thành UTC midnight → múi giờ âm lùi một ngày. |
| Lọc status ở đâu? | Client — endpoint details không nhận `status`. |
| Ai tạo được menu? | User thường (form) hoặc AI chatbot (tool). Cả hai đều → `drafted`. |

---

## 5. SAVED — lưu bài và công thức

### 5.1 Nghiệp vụ

6 endpoint, **không có endpoint "đã lưu hay chưa"**:

```
GET    /api/saved/posts            (phân trang)
POST   /api/saved/posts/{postId}   (idempotent)
DELETE /api/saved/posts/{postId}
GET    /api/saved/recipes          (phân trang)
POST   /api/saved/recipes/{recipeId}
DELETE /api/saved/recipes/{recipeId}
```

### 5.2 Cách biết nút Save đang bật

```ts
// saved/api.ts:6-11
// ponytail: trạng thái nút Save lấy bằng cách tải MỘT TRANG 100 MỤC mỗi danh sách
// rồi cache thành Set id. Vượt 100 mục thì phải xin backend trả cờ `saved`.
export const ID_SCAN_SIZE = 100;
```

Hai query key riêng: `["saved-post-ids"]` / `["saved-recipe-ids"]`, `staleTime 5 phút`, tách khỏi list phân trang (`["saved-posts"]` / `["saved-recipes"]`).

### 5.3 Optimistic update

```ts
onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: POST_IDS_KEY });
    const previous = queryClient.getQueryData(POST_IDS_KEY) ?? [];
    queryClient.setQueryData(POST_IDS_KEY, saved ? previous.filter(...) : [...previous, postId]);
    return { previous };            // ← context để rollback
},
onError: (err, _vars, context) => {
    if (context) queryClient.setQueryData(POST_IDS_KEY, context.previous);
    toast.error(...);
},
onSettled: () => invalidate cả hai key,
```

UI đổi trước, rollback nếu API lỗi. `cancelQueries` trước để một refetch đang bay không ghi đè state vừa set.

### 5.4 Khách bấm Save

`toggle()` kiểm `isAuthenticated` → toast `saved:loginRequired` thay vì gửi request chắc chắn 401.

### 5.5 Công thức của chính mình thì không lưu

`useSaveRecipe` tính `own = recipe.userId === user.id`; `own === true` thì `SaveRecipeButton` trả `null` và query id bị disable.

### 5.6 `useAttachableRecipes` — công thức gắn được vào bài

```ts
// saved/useSaved.ts:121-128
// Tập công thức GẮN ĐƯỢC vào bài: của mình + đã lưu của người khác, dedupe theo id.
// ponytail: gộp ở client vì backend chưa có endpoint "mọi recipe tôi được dùng".
// Lấy trang 100 đầu của /api/saved/recipes.
```

Dùng ở `RecipePickerDialog` (chọn công thức gắn vào bài) và `SavedPage` (nút "soạn bài từ công thức này" → `openComposer(null, [recipe.id])`).

Recipe `REJECTED` bị lọc khỏi danh sách chọn.

### 5.7 Trang `/saved`

2 tab (`posts` / `recipes`), phân trang **server**, `tab` + `page` trên URL. Bỏ lưu ngay trên card → `useRemoveSaved` invalidate cả list và id-set.

> `ponytail:` backend không nhận `sort` → thứ tự mặc định của nó; ô sort đã bỏ khỏi mockup.

### 5.8 Câu hỏi giáo viên hay hỏi — SAVED

| Câu hỏi | Trả lời |
|---|---|
| Làm sao biết bài đã lưu? | Không có endpoint "exists" → tải 1 trang 100 id mỗi loại, cache thành Set. |
| Nếu user lưu > 100 bài? | Nút Save sai với item ngoài 100. Cách sửa: xin BE trả cờ `saved` trên từng item hoặc thêm `GET /saved/posts/{id}/exists`. |
| Sao phải `cancelQueries` trong `onMutate`? | Refetch đang bay có thể ghi đè state optimistic vừa set. |
| Rollback thế nào? | `onMutate` trả `context.previous`, `onError` set lại. |
| Vì sao gộp my-recipes + saved-recipes ở client? | Backend chưa có endpoint "mọi recipe tôi được dùng". Dedupe theo id. |
| Sao công thức của mình không có nút Save? | Tự lưu bài của mình vô nghĩa; ẩn ở cả hook lẫn component. |

---

## 6. ADMIN — phần bạn làm

### 6.1 Khung

`src/features/admin/AdminShell.tsx` — 12 mục sidebar, tất cả `ready: true`.

```
/admin/dashboard  users  posts  videos  comments  categories
       recipes    dishes  ingredients  locations  settings  profile
```

Route bảo vệ bằng `AdminRoute` (`user.role === "ADMIN"`). Guard nằm ở `src/app/guards/`.

**Badge duy nhất trên sidebar:** số ingredient `PENDING` — vì nguyên liệu member gõ lúc tạo recipe vào hàng đợi, badge là cách duy nhất admin biết mà không phải mở từng recipe.

### 6.2 Các trang bạn làm

| Trang | Route | File | Endpoint chính |
|---|---|---|---|
| Posts (duyệt bài) | `/admin/posts` | `admin/pages/PostsPage/` | `GET /api/admin/posts`, `POST .../approve\|reject`, `DELETE /api/posts/{id}` |
| Users | `/admin/users` | `admin/pages/UsersPage/` | `GET /api/admin/users`, `POST .../suspend\|restore` |
| Categories | `/admin/categories` | `categories/CategoriesPage.tsx` | `GET/POST/PATCH /api/categories`, retire |
| Recipes (duyệt) | `/admin/recipes` | `recipes/pages/AdminRecipesPage/` | xem §2.7 |
| Dishes | `/admin/dishes` | `recipes/pages/AdminDishesPage/` | `GET/POST/PATCH/DELETE /api/admin/dishes` + `POST .../approve\|reject` |
| Ingredients | `/admin/ingredients` | `recipes/pages/AdminIngredientsPage/` | `GET/POST/PATCH/DELETE /api/admin/ingredients` |
| Settings | `/admin/settings` | `admin/pages/AdminSettingsPage/` | `GET/PATCH /api/admin/settings` |

### 6.3 Users

- `GET /api/admin/users?page&size&sort=createdAt,desc&status&role&keyword&createdFrom&createdTo`
- Lọc + phân trang **ở server**. `q` debounce 300ms.
- `suspend` / `restore` — **409** kèm lý do cụ thể ("đã khoá rồi" / "chưa bị khoá") → hiện nguyên văn, không dùng câu chung.

### 6.4 Categories

`GET/POST/PATCH /api/categories`, retire = xoá mềm. Có: thẻ đếm All/Active, tìm theo tên/UUID, sort `newest`/`name`, phân trang.
**Không** có: restore, xoá vĩnh viễn, export CSV.

### 6.5 Settings — phần đặc biệt nhất

`GET /api/admin/settings` trả `{ category, key, value, updatedAt }[]` — **không có `type`**.

Vì thế FE phải biết trước kiểu + biên: `src/features/admin/settingsSchema.ts` là **bản sao `SettingKey.java` của backend**.

8 key / 3 nhóm:

| Nhóm | Key | Kiểu |
|---|---|---|
| `media` | `upload_allowed_image_types` | STRING_LIST (whitelist MIME) |
| | `upload_allowed_video_types` | STRING_LIST |
| | `max_image_upload_mb` | INT 1..100 |
| | `max_video_upload_mb` | INT 1..1024 |
| `content` | `content_filter_enabled` | BOOLEAN |
| | `content_filter_accept_threshold` | DECIMAL 0..1 |
| | `content_filter_reject_threshold` | DECIMAL 0..1 |
| `ai` | `ai_chat_enabled` | BOOLEAN |

**Luật `reject < accept` kiểm trên giá trị đã merge**, không phải từng ô:

```ts
// settingsSchema.ts:85-112
validateSettings({ ...saved, ...draft })   // cần cả map vì luật so hai key với nhau
```

Nếu chỉ validate ô đang gõ thì sửa một vế sẽ không phát hiện được vi phạm.

**Chi tiết nhỏ nhưng hay bị hỏi:**
- `PATCH` **partial** — chỉ gửi key đã đổi, trả lại **toàn bộ** danh sách → `setQueryData`, không cần refetch.
- `DECIMAL` chấp nhận cả `0.7` lẫn `0,7` (bàn phím VN) khi **nhập**, nhưng chuẩn hoá về dấu chấm khi **gửi** (BE chỉ hiểu dấu chấm).
- Mỗi card có nút Discard/Save **riêng**; badge "unsaved N" đếm key đã đổi.
- Bố cục 2 cột `items-start`: trái = card `ai` (mảnh, có switch) chồng trên `media`; phải = `content`.

### 6.6 Câu hỏi giáo viên hay hỏi — ADMIN

| Câu hỏi | Trả lời |
|---|---|
| Settings không có `type` thì biết render ô gì? | `settingsSchema.ts` là bản sao `SettingKey.java` — biết kiểu + biên trước khi PATCH. |
| Sao validate cả map chứ không từng key? | Luật `reject < accept` là quan hệ giữa hai key. |
| `PATCH` xong có refetch không? | Không — BE trả toàn bộ danh sách, `setQueryData` thay cache. |
| Vì sao sidebar chỉ có 1 badge? | Ingredient `PENDING` là hàng chờ admin không thấy ở đâu khác. Các hàng chờ khác (post/recipe) có trang riêng với bộ lọc mặc định. |
| Phân trang 1-based hay 0-based? | UI 1-based, wire 0-based. Mọi hàm trong `adminApi.ts` tự `page - 1`. |
| Sao suspend báo lỗi 409 mà không nuốt? | BE nêu lý do cụ thể (đã khoá / chưa khoá) — câu chung sẽ làm admin mất thông tin. |

---

## 7. Bản đồ API — hàm lấy dữ liệu nằm ở file nào

Mỗi feature có **một** `api.ts` (hoặc vài file `*Api.ts` cho domain phụ). Page không gọi axios trực tiếp — luôn qua các hàm dưới đây. Cột "Gọi ở" liệt kê hook/page dùng thật.

### 7.1 `src/features/posts/api.ts` — post, comment, vote

| Hàm | Endpoint | Gọi ở |
|---|---|---|
| `getFeedPosts` | `GET /api/posts` (feed public) | `useFeedPosts.ts` → HomePage, ExplorePage |
| `getPostDetail` | `GET /api/posts/{id}` | PostDetailPage, PostComposerDialog (edit), AdminCommentsPage (preview) |
| `getRelatedPosts` | `GET /api/posts/{id}/related` | PostDetailPage |
| `getMyPosts` | `GET /api/posts/me` | MyPostsPage, AccountOverviewPage |
| `getMyPostsCounts` | `GET /api/posts/me?size=100` (đếm client) | MyPostsPage, AccountLayout, AccountOverviewPage |
| `getPosts` | `GET /api/admin/posts` | PostsPage |
| `getAdminPostDetail` | `GET /api/admin/posts/{id}` | PostPreviewDialog |
| `approvePost` / `rejectPost` | `POST /api/admin/posts/{id}/approve\|reject` | PostsPage |
| `createPost` | `POST /api/posts` | PostComposerDialog |
| `updatePost` | `PATCH /api/posts/{id}` | PostComposerDialog |
| `attachPostRecipes` | `POST /api/posts/{id}/recipes` | PostComposerDialog |
| `attachPostMedia` | `POST /api/posts/{id}/media` | PostComposerDialog |
| `deletePost` | `DELETE /api/posts/{id}` | MyPostsPage, PostsPage |
| `unpublishPost` | `PATCH /api/posts/{id} {publish:false}` | **không nơi nào gọi** (giữ cho luồng rút bài) |
| `getPostComments` | `GET /api/posts/{id}/comments` | CommentsSection, PostCommentsDialog, FeedPostCard (đếm) |
| `createComment` | `POST .../comments` | CommentComposer |
| `updateComment` / `deleteComment` / `reportComment` | `PATCH\|DELETE\|POST .../comments/{id}` | CommentThread |
| `getPostVotes` / `setPostVote` | `GET\|PUT /api/posts/{id}/votes` | PostVoteButtons |
| `getMyActivity` | mock (`delay()` + dữ liệu băm từ seed, không HTTP) | **không nơi nào gọi** |
| `getLocalComments` / `saveLocalComment` / `updateLocalComment` / `removeLocalComment` / `insertCommentIntoTree` / `organizeCommentTree` / `countAllComments` | thuần client (không HTTP) | composer + thread comment |

Hook bọc feed: `src/features/posts/useFeedPosts.ts` → `useFeedPosts` (queryKey `posts-feed`).
Helper riêng của HomePage: `src/features/posts/pages/HomePage/homeData.ts` → `getTopRatedPlaces` (`GET /api/restaurants`), `getCurrentWeekMenu` (`GET /api/menus/details`), `currentWeekRange`, `toISODate`.

### 7.2 `src/features/recipes/api.ts` + `adminApi.ts`

| File | Hàm | Endpoint | Gọi ở |
|---|---|---|---|
| `api.ts` | `createRecipe` | `POST /api/recipes` | RecipeComposerDialog |
| `api.ts` | `getMyRecipes` | `GET /api/recipes/me` | MyRecipesPage, AccountLayout, AccountOverviewPage, `useAttachableRecipes` |
| `api.ts` | `getRecipe` | `GET /api/recipes/{id}` | AttachedRecipes (Post Detail), FeedPostCard, MealRecipeDialog. **Không** dùng ở SavedPage — trang đó render thẳng từ response `GET /api/saved/recipes` |
| `api.ts` | `getPublicRecipes` | `GET /api/recipes` | ExplorePage (tab recipes) |
| `api.ts` | `deleteRecipe` | `DELETE /api/recipes/{id}` | `useDeleteRecipe.ts` |
| `api.ts` | `searchIngredients` | `GET /api/ingredients` | IngredientEditor (autocomplete) |
| `adminApi.ts` | `getAdminRecipes` / `getAdminRecipe` | `GET /api/admin/recipes[/{id}]` | AdminRecipesPage · PostPreviewDialog |
| `adminApi.ts` | `updateAdminRecipe` / `deleteAdminRecipe` | `PATCH\|DELETE /api/admin/recipes/{id}` | AdminRecipesPage |
| `adminApi.ts` | `approveRecipe` / `rejectRecipe` | `POST .../approve\|reject` | AdminRecipesPage |
| `adminApi.ts` | `getAdminIngredients` | `GET /api/admin/ingredients` | AdminIngredientsPage |
| `adminApi.ts` | `countAdminIngredients` | `GET ...?size=1` đọc `totalElements` | AdminShell (badge) |
| `adminApi.ts` | `createAdminIngredient` / `updateAdminIngredient` / `deleteAdminIngredient` | `POST\|PATCH\|DELETE` | AdminIngredientsPage · ApproveRecipeDialog |
| `adminApi.ts` | `getAdminDishes` | `GET /api/admin/dishes` | AdminDishesPage |
| `adminApi.ts` | `createAdminDish` / `updateAdminDish` / `deleteAdminDish` | `POST\|PATCH\|DELETE` | AdminDishesPage |
| `adminApi.ts` | `approveDish` | `POST /api/admin/dishes/{id}/approve` | AdminDishesPage, RecipeDetailDialog (Admin) |
| `adminApi.ts` | `rejectDish` | `POST /api/admin/dishes/{id}/reject` | AdminDishesPage |

Món dùng chung 3 feature: `src/shared/api/dishes.ts` → `searchDishes` (`GET /api/dishes`) — dùng ở DishAssignPopover, RecipeComposerDialog, LocationFormDialog, HomeDishes.

### 7.3 Các feature còn lại

| File | Hàm | Endpoint | Gọi ở |
|---|---|---|---|
| `menus/api.ts` | `getMealPlans` | `GET /api/menus/details` | `useMealPlans.ts` → MealPlanPage, AccountOverviewPage |
| `menus/api.ts` | `createMenu` | `POST /api/menus` | MealPlanComposerDialog |
| `menus/api.ts` | `changeMenuStatus` / `deleteMenu` | `POST .../status` · `DELETE /api/menus/{id}` | MenuActions |
| `saved/api.ts` | `getSavedPosts` / `getSavedRecipes` | `GET /api/saved/{posts\|recipes}` | SavedPage |
| `saved/api.ts` | `savePost` / `unsavePost` / `saveRecipe` / `unsaveRecipe` | `POST\|DELETE /api/saved/...` | `useSaved.ts` → SaveButton, SavedPage |
| `saved/api.ts` | `getSavedPostIds` / `getSavedRecipeIds` | đọc trang 100 id | `useSaved.ts` (`ID_SCAN_SIZE`) |
| `saved/useSaved.ts` | `useSavePost` `useSaveRecipe` `useRemoveSaved` `useAttachableRecipes` | bọc các hàm trên | SaveButton, SavedPage, RecipePickerDialog, PostComposerDialog |
| `nutrition-ai/api.ts` | `sendAiMessage` / `getAiConversations` / `getAiConversation` | `POST /api/ai/messages` · `GET /api/ai/conversations[/{id}]` | `useAiChat.ts` → AiNutritionPage |
| `nutrition-ai/subscriptionApi.ts` | `getMySubscription` | `GET /api/subscriptions/me` | `useSubscription.ts` → AiNutritionPage |
| `subscription/api.ts` | `getPlans` / `getSubscriptionHistory` / `acquirePlan` | `GET /api/subscriptions` · `.../me/history` · `POST .../acquire` | `useBilling.ts` → SubscriptionPage, AiNutritionPage |
| `subscription/api.ts` | `getPayments` / `getPayment` | `GET /api/payments[/{id}]` | `useBilling.ts` → SubscriptionPage, PaymentResultPage |
| `subscription/api.ts` | `createCheckout` / `checkPurchaseEligibility` / `cancelSubscription` | **path không còn trong spec live** | `useCancelSubscription` khai báo nhưng không page nào dùng |
| `admin/api.ts` | `getUsers` / `suspendUser` / `restoreUser` | `/api/admin/users...` | UsersPage |
| `admin/commentApi.ts` | `getAdminComments` / `moderateComment` | `GET /api/admin/comments` · `POST .../moderate` | AdminCommentsPage |
| `admin/dashboardApi.ts` | `getAdminDashboard` / `getAdminDashboardCharts` | `/api/admin/dashboard[/charts]` | AdminDashboardPage |
| `admin/settingsApi.ts` | `getAdminSettings` / `updateAdminSettings` | `GET\|PATCH /api/admin/settings` | AdminSettingsPage |
| `categories/api.ts` | `getPublicCategories` | `GET /api/categories` | `usePublicCategories.ts` → HomePage, ExplorePage, PostComposerDialog, CategoriesPage |
| `categories/api.ts` | `getCategories` / `createCategory` / `updateCategory` / `retireCategory` | `/api/categories` + `/api/admin/categories` | CategoriesPage |
| `videos/api.ts` | `getVideos` / `deleteVideo` | `GET /api/admin/videos` · `DELETE /api/media/{id}` | VideosPage |
| `profile/api.ts` | `getProfile` / `updateProfile` | `GET\|PUT /api/profile` | `useProfile.ts` → ProfilePage, AccountLayout, AccountOverviewPage, Navbar |
| `auth/api.ts` | `register` `login` `loginWithGoogle` `verifyEmail` `resendVerifyEmail` `forgotPassword` `verifyPasswordReset` `resetPassword` `logout` | `/api/auth/*` | trang trong `auth/pages/`, `useAuth.ts` |
| `locations/api.ts` | `getNearbyLocations` / `getLocations` / `getLocationById` / `createLocation` / `updateLocation` / `deleteLocation` | `/api/restaurants...` · `/api/admin/restaurants...` | RestaurantsPage, AdminLocationsPage, LocationFormDialog |
| `locations/restaurantApi.ts` | `getRestaurantPlaceDetail` | bọc `getLocationById` + giờ mở cửa | LocationDetailPage |
| `shared/api/media.ts` | `createUploadGrant` / `uploadFileToProvider` / `confirmUpload` | `POST /api/media/upload` · PUT provider · `POST /api/media/{id}/confirm` | ImageUploader, PostComposerDialog |
| `shared/api/media.ts` | `getMedia` | `GET /api/media/{id}` | PostDetailPage (`PostVideo`), PostMediaReview |
| `shared/api/client.ts` | `api` (axios + interceptor), `rawClient`, `scheduleTokenRefresh` | mọi request | tất cả `api.ts` |

**Hàm khai báo nhưng chưa nơi nào gọi** (hỏi "sao có mà không dùng" thì đây là câu trả lời): `unpublishPost` (`posts/api.ts` — rút bài về nháp), `getMyActivity` (`posts/api.ts` — mock cũ), `createCheckout` + `checkPurchaseEligibility` (`subscription/api.ts` — path đã bị BE xoá), `useCancelSubscription` (`subscription/useBilling.ts` — huỷ gói không còn endpoint).

---

## 8. Mỗi trang lấy dữ liệu từ đâu

Cùng khuôn: **khối dữ liệu → hàm → file**. Query key ghi trong ngoặc để biết invalidate cái gì.

### 8.1 Trang public / member

| Trang (route) | Khối dữ liệu | Hàm | File | QueryKey |
|---|---|---|---|---|
| Home `/` | hero + showcase + cộng đồng + mới nhất | `useFeedPosts` | `posts/useFeedPosts.ts` | `posts-feed` |
| | pill danh mục | `usePublicCategories` | `categories/usePublicCategories.ts` | `public-categories` |
| | tên category trên card | `useCategoryNames` | `categories/usePublicCategories.ts` | (dùng chung) |
| | dải thực đơn tuần (`HomeWeeklyBar`) | `getCurrentWeekMenu` | `posts/pages/HomePage/homeData.ts` | `home-week-menu` |
| | khối món (`HomeDishes`) | `searchDishes` | `shared/api/dishes.ts` | `home-dishes` |
| | quán đánh giá cao (`HomeNearbyPicks`) | `getTopRatedPlaces` | `posts/pages/HomePage/homeData.ts` | `home-top-rated-places` |
| Explore `/explore` | tab **Posts** (feed + lọc) | `useFeedPosts` | `posts/useFeedPosts.ts` | `posts-feed` |
| | tab **Recipes** | `getPublicRecipes` | `recipes/api.ts` | `public-recipes` |
| | số comment trên card | `getPostComments` (page 0, size 1) | `posts/api.ts` | `post-comment-count` |
| | công thức đính kèm card | `getRecipe` | `recipes/api.ts` | `recipe` |
| | vote trên card | `getPostVotes` / `setPostVote` | `posts/api.ts` | (trong PostVoteButtons) |
| | dialog comment | `getPostComments` + `createComment` | `posts/api.ts` | `post-comments` |
| Post Detail `/posts/:id` | thân bài | `getPostDetail` | `posts/api.ts` | `post-detail` |
| | bài liên quan | `getRelatedPosts` | `posts/api.ts` | `post-related` |
| | video cũ trong bài | `getMedia` | `shared/api/media.ts` | `media` |
| | cây bình luận | `getPostComments` / `createComment` / `updateComment` / `deleteComment` / `reportComment` | `posts/api.ts` | `post-comments` |
| | chip công thức (`AttachedRecipes`) | `getRecipe` (mỗi id) | `recipes/api.ts` | `recipe` |
| | nút Lưu | `useSavePost` | `saved/useSaved.ts` | `saved-post-ids` |
| My Posts `/my-posts` | bảng bài + lọc | `getMyPosts` | `posts/api.ts` | `my-posts` |
| | số trên chip (poll 3s khi còn `processing`) | `getMyPostsCounts` | `posts/api.ts` | `["my-posts","counts"]` |
| | xoá bài | `deletePost` | `posts/api.ts` | invalidate `my-posts` |
| Soạn/sửa bài (dialog) | nạp bài để sửa | `getPostDetail` | `posts/api.ts` | — |
| | lưu | `createPost` → `updatePost` → `attachPostRecipes` → `attachPostMedia` | `posts/api.ts` | invalidate `my-posts`, `posts-feed` |
| | chọn category | `usePublicCategories` | `categories/usePublicCategories.ts` | `public-categories` |
| | chọn công thức gắn được | `useAttachableRecipes` | `saved/useSaved.ts` | `my-recipes` + `saved-recipes` |
| | upload ảnh/video | `createUploadGrant` → `uploadFileToProvider` → `confirmUpload` | `shared/api/media.ts` | — |
| Profile `/profile` | hồ sơ | `useProfile` | `profile/useProfile.ts` | `profile` |
| | lưu 11 field | `useUpdateProfile` → `updateProfile` | `profile/useProfile.ts` → `profile/api.ts` | invalidate `profile` |
| Account `/account` | số đếm rail | `getMyPostsCounts` + `getMyRecipes` | `posts/api.ts`, `recipes/api.ts` | `["my-posts","counts"]`, `my-recipes` |
| | 6 bài gần nhất + thực đơn tuần | `getMyPosts`, `useMealPlans` | `posts/api.ts`, `menus/useMealPlans.ts` | `my-posts`, `meal-plans` |
| Saved `/saved` | tab Posts / Recipes (phân trang server) | `getSavedPosts` / `getSavedRecipes` | `saved/api.ts` | `saved-posts`, `saved-recipes` |
| | bỏ lưu | `useRemoveSaved` | `saved/useSaved.ts` | invalidate list + id-set |
| Restaurants `/restaurants` | danh sách gần vị trí | `getNearbyLocations` | `locations/api.ts` | `restaurants-nearby` |
| | ô tìm kiếm | `getLocations` | `locations/api.ts` | `restaurants-search` |
| Location Detail `/restaurants/:id` | chi tiết + giờ mở cửa | `getRestaurantPlaceDetail` | `locations/restaurantApi.ts` | `restaurant-place` |
| Meal Plan `/meal-plan` | menu trong cửa sổ 7 ngày | `useMealPlans` → `getMealPlans` | `menus/useMealPlans.ts` → `menus/api.ts` | `meal-plans` |
| | đổi trạng thái / xoá | `changeMenuStatus` / `deleteMenu` | `menus/api.ts` | invalidate `meal-plans` |
| Tạo thực đơn (dialog) | ma trận + chọn món | `searchDishes` | `shared/api/dishes.ts` | `dishes` |
| | lưu | `createMenu` | `menus/api.ts` | invalidate `meal-plans` |
| | xem công thức món gợi ý | `getRecipe` | `recipes/api.ts` | `recipe` |
| My Recipes `/recipes` | danh sách + tab/sort (lọc client) | `getMyRecipes` | `recipes/api.ts` | `my-recipes` |
| | xoá | `useDeleteRecipe` → `deleteRecipe` | `recipes/useDeleteRecipe.ts` → `recipes/api.ts` | invalidate `my-recipes`, `saved-*` |
| Tạo công thức (dialog) | chọn món | `searchDishes` | `shared/api/dishes.ts` | — |
| | chọn nguyên liệu | `searchIngredients` | `recipes/api.ts` | — |
| | lưu | `createRecipe` | `recipes/api.ts` | invalidate `my-recipes` |
| AI Nutrition `/ai-nutrition` | danh sách + chi tiết hội thoại | `getAiConversations` / `getAiConversation` | `nutrition-ai/api.ts` | `ai.conversations`, `ai.conversation` |
| | gửi câu hỏi | `sendAiMessage` | `nutrition-ai/api.ts` | invalidate `meal-plans`, `ai.conversations`, `subscription.me` |
| | hạn mức còn lại | `useSubscription` → `getMySubscription` | `nutrition-ai/useSubscription.ts` | `subscription.me` |
| | đã từng mua gói chưa | `useSubscriptionHistory` | `subscription/useBilling.ts` | `subscription.history` |
| | claim gói FREE | `useAcquirePlan` → `acquirePlan` | `subscription/useBilling.ts` | invalidate `subscription` |
| Subscription `/subscription` | danh sách gói | `usePlans` → `getPlans` | `subscription/useBilling.ts` | `subscription.plans` |
| | lịch sử mua / thanh toán | `useSubscriptionHistory` / `usePayments` | `subscription/useBilling.ts` | `subscription.history`, `payments` |
| | mua gói | `useAcquirePlan` → `acquirePlan` | `subscription/useBilling.ts` | invalidate `subscription` |
| Payment Result `/payment/result/:id` | trạng thái (poll 3s khi `pending`) | `usePayment` → `getPayment` | `subscription/useBilling.ts` | `payments.detail` |
| | tên gói (suy từ history) | `useSubscriptionHistory` | `subscription/useBilling.ts` | `subscription.history` |

### 8.2 Trang admin

| Trang (route) | Khối dữ liệu | Hàm | File | QueryKey |
|---|---|---|---|---|
| Dashboard `/admin/dashboard` | thẻ số + moderation queue | `getAdminDashboard` | `admin/dashboardApi.ts` | `admin-dashboard` |
| | 2 chart (`range`) | `getAdminDashboardCharts` | `admin/dashboardApi.ts` | `admin-dashboard-charts` |
| Posts `/admin/posts` | bảng + lọc status/flag | `getPosts` | `posts/api.ts` | `admin-posts` |
| | tên category | `useCategoryNames` | `categories/usePublicCategories.ts` | — |
| | dialog preview | `getAdminPostDetail` + `getAdminRecipe` | `posts/api.ts`, `recipes/adminApi.ts` | — |
| | media trong bài | `getMedia` | `shared/api/media.ts` | — |
| | duyệt / từ chối / xoá | `approvePost` / `rejectPost` / `deletePost` | `posts/api.ts` | invalidate `admin-posts` |
| Comments `/admin/comments` | bảng + lọc | `getAdminComments` | `admin/commentApi.ts` | `admin-comments` |
| | preview bài của comment | `getPostDetail` | `posts/api.ts` | `post-detail` |
| | kiểm duyệt | `moderateComment` | `admin/commentApi.ts` | invalidate `admin-comments` |
| Videos `/admin/videos` | bảng upload | `getVideos` | `videos/api.ts` | `admin-videos` |
| | xoá media | `deleteVideo` | `videos/api.ts` | invalidate `admin-videos` |
| Categories `/admin/categories` | bảng + sort + tìm | `getCategories` | `categories/api.ts` | `admin-categories` |
| | tạo / sửa / retire | `createCategory` / `updateCategory` / `retireCategory` | `categories/api.ts` | invalidate `admin-categories` |
| Recipes `/admin/recipes` | bảng + lọc `moderationStatus` + khoảng ngày | `getAdminRecipes` | `recipes/adminApi.ts` | `admin-recipes` |
| | duyệt (điền nguyên liệu thiếu rồi approve) | `updateAdminIngredient` → `approveRecipe` | `recipes/adminApi.ts` | invalidate `admin-recipes`, `admin-ingredients` |
| | từ chối / sửa / xoá | `rejectRecipe` / `updateAdminRecipe` / `deleteAdminRecipe` | `recipes/adminApi.ts` | invalidate `admin-recipes` |
| | duyệt tên món từ dialog chi tiết | `approveDish` | `recipes/adminApi.ts` | invalidate `admin-recipes`, `dishes` |
| Dishes `/admin/dishes` | bảng + lọc | `getAdminDishes` | `recipes/adminApi.ts` | `admin-dishes` |
| | tạo / sửa / xoá | `createAdminDish` / `updateAdminDish` / `deleteAdminDish` | `recipes/adminApi.ts` | invalidate `admin-dishes` |
| | duyệt / từ chối (chỉ hàng `PENDING`) | `approveDish` / `rejectDish` | `recipes/adminApi.ts` | invalidate `admin-dishes` (+`dishes` khi approve) |
| Ingredients `/admin/ingredients` | bảng + tìm tên | `getAdminIngredients` | `recipes/adminApi.ts` | `admin-ingredients` |
| | tạo / sửa (all-or-nothing dinh dưỡng) / xoá | `createAdminIngredient` / `updateAdminIngredient` / `deleteAdminIngredient` | `recipes/adminApi.ts` | invalidate `admin-ingredients`, `admin-ingredients-pending-count` |
| Users `/admin/users` | bảng + lọc server | `getUsers` (page **0-based**) | `admin/api.ts` | `admin-users` |
| | khoá / mở khoá | `suspendUser` / `restoreUser` | `admin/api.ts` | invalidate `admin-users` |
| Locations `/admin/locations` | bảng + tìm | `getLocations` | `locations/api.ts` | `admin-locations` |
| | chi tiết để sửa (kèm món) | `getLocationById` + `searchDishes` | `locations/api.ts`, `shared/api/dishes.ts` | `restaurant-detail-form` |
| | tạo / sửa / xoá | `createLocation` / `updateLocation` / `deleteLocation` | `locations/api.ts` | invalidate 4 key ở `LocationsPage` |
| Settings `/admin/settings` | 8 key / 3 nhóm | `getAdminSettings` | `admin/settingsApi.ts` | `admin-settings` |
| | lưu (partial) | `updateAdminSettings` | `admin/settingsApi.ts` | `setQueryData` cùng key |
| Shell (mọi trang admin) | badge nguyên liệu `PENDING` | `countAdminIngredients` | `recipes/adminApi.ts` | `admin-ingredients-pending-count` |
| Shell | avatar + tên (manager) | `useAuth` (`authStore`, không gọi API) | `auth/useAuth.ts` | — |

**Bẫy hay bị hỏi khi chỉ vào bảng này:** `admin/users` là trang **duy nhất** gửi `page` 0-based; mọi trang admin khác gửi 1-based rồi hàm tự trừ 1. `AdminDishesPage` dùng `admin-dishes` chứ không dùng `dishes` — `dishes` là key của ô chọn món (`searchDishes`), hai nguồn khác nhau.

---

## 9. Bảng tra file — mở đúng chỗ

### Post
| Cần gì | File |
|---|---|
| Toàn bộ API post + admin post | `src/features/posts/api.ts` |
| Kiểu `PostStatus`, `PostFlag`, `AdminPost`, `PostListResponse` | `src/features/posts/types.ts` |
| Nhãn/variant trạng thái, `canPublish`/`canReject` | `src/features/posts/constants.ts` |
| Dialog soạn bài (create + edit) | `src/features/posts/components/composer/PostComposerDialog.tsx` |
| Validate + payload composer | `composer/schema.ts`, `composer/payload.ts` |
| Chọn công thức gắn vào bài | `composer/RecipePickerDialog.tsx`, `composer/recipeMeta.ts` |
| Editor TipTap + xử lý nội dung | `components/editor/{RichTextEditor,EditorToolbar,VideoNode,editorContent,PostContent}.tsx` |
| Card feed | `components/PostCard.tsx`, `pages/ExplorePage/FeedPostCard.tsx` |
| Trang chủ / khám phá / chi tiết / bài của tôi | `pages/{HomePage,ExplorePage,PostDetailPage,MyPostsPage}/` |
| Mock field card | `mockEnrichment.ts`, `mockAuthors.ts` |
| Admin duyệt bài | `src/features/admin/pages/PostsPage/{PostsPage,PostPreviewDialog,RejectPostDialog,PostMediaReview}.tsx` |

### Recipe
| Cần gì | File |
|---|---|
| API member | `src/features/recipes/api.ts` |
| API admin (recipe/dish/ingredient) | `src/features/recipes/adminApi.ts` |
| Kiểu + hằng đơn vị | `src/features/recipes/types.ts` |
| Form tạo công thức | `components/RecipeComposerDialog.tsx` |
| Schema / payload / editor con | `pages/CreateRecipePage/{schema,payload,IngredientEditor,StepEditor,AutocompleteField,RecipePreviewCard,RecipeSidebar}.tsx` |
| Tờ công thức (dùng ở Saved + Post Detail) | `components/RecipeDetailDialog.tsx`, `components/RecipeNutritionLine.tsx` |
| Dinh dưỡng | `nutrition.ts` |
| Xoá công thức | `useDeleteRecipe.ts` |
| Danh sách của tôi | `pages/MyRecipesPage/{MyRecipesPage.tsx,filter.ts}` |
| Admin duyệt recipe | `pages/AdminRecipesPage/{AdminRecipesPage,RecipeDetailDialog,ApproveRecipeDialog,RejectRecipeDialog,EditRecipeDialog}.tsx` |
| Admin món | `pages/AdminDishesPage/{AdminDishesPage,DishFormDialog,dishForm}.tsx` |
| Admin nguyên liệu + dinh dưỡng | `pages/AdminIngredientsPage/{AdminIngredientsPage,IngredientFormDialog}.tsx`, `ingredientForm.ts` |

### AI
| Cần gì | File |
|---|---|
| API chat | `src/features/nutrition-ai/api.ts` |
| API subscription (dùng chung) | `src/features/nutrition-ai/subscriptionApi.ts`, `useSubscription.ts` |
| Hook chat | `useAiChat.ts` |
| Trang + khung chat | `AiNutritionPage.tsx`, `ChatPanel.tsx`, `DishPicker.tsx`, `MarkdownMessage.tsx` |
| Mua gói / thanh toán | `src/features/subscription/useBilling.ts`, `api.ts` |

### Meal plan
| Cần gì | File |
|---|---|
| API | `src/features/menus/api.ts` |
| Kiểu + hằng BR-MENU-005 | `src/features/menus/types.ts` |
| Tính ngày | `src/features/menus/week.ts` |
| Form state / validate / payload | `src/features/menus/create/{schema,validate,payload}.ts` |
| Dialog tạo | `components/MealPlanComposerDialog.tsx` |
| Ma trận + popover | `components/{MealPlanMatrix,MealRow,DayColumn,DishAssignPopover}.tsx` |
| Trang xem + card + hành động | `pages/MealPlanPage.tsx`, `components/{MenuCard,MenuActions,WeekNavigator,DishDetailDialog}.tsx` |
| Query | `useMealPlans.ts` |

### Saved
| Cần gì | File |
|---|---|
| API 6 endpoint | `src/features/saved/api.ts` |
| Hook (save/unsave/attachable/remove) | `src/features/saved/useSaved.ts` |
| Nút Save | `components/SaveButton.tsx` |
| Card trang Saved | `components/SavedCards.tsx` |
| Trang | `SavedPage.tsx` |

### Admin
| Cần gì | File |
|---|---|
| Khung + sidebar | `src/features/admin/AdminShell.tsx` |
| API users | `src/features/admin/api.ts` |
| Settings API + schema | `src/features/admin/settingsApi.ts`, `settingsSchema.ts` |
| Trang settings | `pages/AdminSettingsPage/AdminSettingsPage.tsx` |
| Trang users | `pages/UsersPage/UsersPage.tsx` |
| Categories | `src/features/categories/{CategoriesPage,CategoryFormDialog,api,types}.tsx` |
| Routes toàn app | `src/app/routes.tsx` |

---

## 10. Mười câu chắc chắn bị hỏi — trả lời một dòng

1. **Vì sao React Query?** Server state tách khỏi UI state; cache theo key, tự refetch, invalidate có chủ đích. Không phải viết lại loading/error/retry cho từng trang.
2. **Vì sao Zustand cho UI state?** Chỉ cần `composer`, `mealPlanComposer`, `language` — Context sẽ re-render cả cây, Redux thì quá nặng.
3. **Vì sao Formik + Yup?** Yup khai báo rule, Formik lo touched/errors/submit. Schema tách file để sửa rule không phải mở file 600 dòng.
4. **Vì sao dialog thay route?** Giữ context trang, không mất state, mount một lần ở `Layout`, không phải khai báo guard lại.
5. **Vì sao mọi thao tác ghi đều invalidate?** Response ghi thường thiếu field (menu thiếu `dish` đầy đủ, comment thiếu cây reply). Đọc lại từ endpoint đọc là nguồn sự thật duy nhất.
6. **Optimistic ở đâu?** Nút Save (`useSaved`) và vote. Rollback bằng `context.previous` trong `onError`.
7. **`ponytail:` là gì?** Đánh dấu chỗ lược bớt **có chủ ý**, kèm giới hạn và hướng nâng cấp. Không phải TODO bỏ quên — 40 chỗ / 26 file, đừng "sửa" khi không được yêu cầu.
8. **i18n thêm key thế nào?** Thêm cho **cả** `en` và `vi`, đúng namespace. `en` là mặc định.
9. **Phân trang 1-based hay 0-based?** UI 1-based, wire 0-based. Mọi hàm trong `adminApi.ts` tự trừ 1.
10. **Vì sao đọc lỗi bằng `getApiErrorMessage`?** axios chỉ trả `"Request failed with status code 400"`; câu thật của BE nằm ở `response.data.message` / `errors[]`.

---

## 11. Chuẩn bị demo — checklist

- [ ] Đánh thức backend Render: `GET https://vegalife-backend.onrender.com/api/health`
- [ ] 1 tài khoản user `activated`, 1 tài khoản admin
- [ ] User đã claim gói FREE ở `/ai-nutrition` (nếu không, flow AI đứng ở banner 0 requests)
- [ ] Có ≥ 1 bài `published` trong feed, ≥ 1 bài nháp ở `/my-posts`
- [ ] Có ≥ 1 recipe `PENDING` ở `/admin/recipes` để demo duyệt
- [ ] Có ≥ 5 món `APPROVED` để tạo được thực đơn (BR-MENU-005 cần ≥ 5 món khác nhau)
- [ ] Dữ liệu nhập tay: `DOCS/DEMO-DATA.md` · kịch bản: `DOCS/DEMO-SCRIPT.md`
