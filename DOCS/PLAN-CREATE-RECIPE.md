# Plan — Create Recipe (nhóm 20)

> Trạng thái: **đã code xong, chờ chạy `npm run typecheck` + `npm test`** · Ngày lập: 2026-10-23 · Branch: `feat/recipes`
> Endpoint: `POST /api/recipes`, `GET /api/dishes`, `GET /api/ingredients`

## 1. Mục tiêu

Thêm màn hình tạo công thức nấu chay: nhập tên món, mô tả, thời gian, khẩu phần,
độ khó và danh sách nguyên liệu — lưu thật lên backend.

**Phạm vi**: 3 endpoint nhóm 20.

**Ngoài phạm vi**: gán recipe vào bài viết (`POST /api/posts/{id}/recipes`, issue #137),
sửa/xoá recipe, trang chi tiết recipe. `GET /api/admin/recipes` đã làm riêng ở
`/admin/recipes` (xem §8).

## 2. Hiện trạng

| Thứ | Trạng thái |
|---|---|
| `src/features/recipes/` | ⬜ chưa có |
| Route `/recipes/create` | ⬜ chưa có |
| i18n namespace `recipe` | ⬜ chưa có |
| `DOCS/API-COVERAGE.md` §20 | ❌ ghi chưa làm |
| `DOCS/SRS.md` §11.2 Recipe Module | ✅ đã khai báo endpoint |

Frontend hiện coi "recipe" = bài post có category (`features/posts/components/PostCard.tsx:30`,
`ponytail:`). Tính năng này **không** thay đổi cách đó — recipe là entity riêng, chưa
hiển thị ở feed.

## 3. Quyết định đã chốt

### 3.1 Route riêng, không nhét vào `/posts/create`

`POST /api/recipes` là entity khác `POST /api/posts`: khác payload, khác bảng, khác
vòng đời (không có draft/publish, không có category, không có cover image). Nhét vào
wizard 5 bước của `CreatePostPage` sẽ phải rẽ nhánh gần như mọi bước.

→ Route mới `/recipes/create`, `ProtectedRoute` (cả 3 endpoint đều cần JWT).

### 3.2 Không có ảnh bìa

`POST /api/recipes` không nhận field ảnh. `dish.imageUrl` có trong bảng nhưng endpoint
tạo dish không mở (dish chỉ find-or-create theo tên). Không thêm `ImageUploader` vào form
— thêm nút upload mà không gửi được là lừa người dùng.

### 3.3 Autocomplete cho dish và ingredient

`GET /api/dishes` và `GET /api/ingredients` là endpoint **read-only để gợi ý**. Người
dùng vẫn gõ tên mới được — backend find-or-create theo `name` (trim + lowercase).

→ Ô nhập text tự do + dropdown gợi ý (`useQuery` + `useDebounce` 300ms, `enabled` khi
≥2 ký tự và ô đang focus). Không bắt buộc chọn từ danh sách.

### 3.4 Nguyên liệu nhập theo hàng

Backend nhận `ingredients[]` với `{ name, amount, unit }`. UI là danh sách hàng động:
mỗi hàng = tên (có gợi ý) + số lượng + đơn vị + nút xoá; cuối danh sách có nút thêm.
Không có unit enum trong API → ô text tự do, gợi ý các đơn vị hay dùng qua `datalist`.

## 4. Thiết kế

### 4.1 File

```text
src/features/recipes/types.ts                       Recipe, RecipeIngredient, CreateRecipeRequest,
                                                    Dish, Ingredient, Difficulty
src/features/recipes/api.ts                         createRecipe, searchDishes, searchIngredients
src/features/recipes/pages/CreateRecipePage/
  CreateRecipePage.tsx                              form Formik + 3 khối
  schema.ts                                         buildRecipeSchema(t) + hằng số giới hạn
  payload.ts                                        buildRecipePayload(values)
  IngredientEditor.tsx                              danh sách hàng nguyên liệu động
  AutocompleteField.tsx                             Input + dropdown gợi ý (dish & ingredient dùng chung)
  __tests__/schema.test.ts                          validate + payload
src/i18n/locales/{en,vi}/recipe.json                namespace mới
```

`AutocompleteField` tách riêng vì dùng ở 2 chỗ (dish, tên nguyên liệu). `IngredientEditor`
tách vì page sẽ ~300 dòng nếu gộp.

**Không** tách `RecipeSidebar` / `PublishChecklist` — recipe không có bước duyệt, chỉ 1 nút Lưu.

### 4.2 Hợp đồng API

```ts
// POST /api/recipes — 201
{
  name: string,                    // ≤255, bắt buộc
  dishName: string,                // ≤255, bắt buộc — BE trim+lowercase, find-or-create
  instructions: string,            // bắt buộc, text nhiều dòng
  servings: number,                // ≥1
  ingredients: Array<{             // 1..50, name unique không phân biệt hoa thường
    name: string,                  // ≤100
    amount: number,                // >0, tối đa 3 số lẻ
    unit: string                   // ≤30
  }>,
  description?: string | null,
  prepTimeMinutes?: number | null, // ≥0
  cookTimeMinutes?: number | null, // ≥0
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null
}
→ { id, userId, dishId, dishName, name, description, instructions,
    prepTimeMinutes, cookTimeMinutes, servings, difficulty,
    ingredients: [{ ingredientId, name, amount, unit }], createdAt, updatedAt }
// 400 validation · 401 · 500

// GET /api/dishes?page=0&size=10&sort=name,asc&name=<substring>  (JWT)
→ PageResponse<{ id, name, description, imageUrl, cuisineType, createdAt }>

// GET /api/ingredients?page=0&size=10&sort=name,asc&name=<substring>  (JWT)
→ PageResponse<{ id, name, createdAt }>
```

Không gửi `userId`/`dishId`/`id`/timestamps — server tự set.

### 4.3 Validate (client khớp backend)

| Field | Rule | Thông báo (namespace `validation`) |
|---|---|---|
| `name` | trim, required, ≤255 | `required` / `maxLength` |
| `dishName` | trim, required, ≤255 | `required` / `maxLength` |
| `instructions` | trim, required | `required` |
| `servings` | int ≥1 | `recipe.servingsMin` |
| `ingredients` | 1..50 hàng | `recipe.ingredientsMin` / `recipe.ingredientsMax` |
| `ingredients[].name` | trim, required, ≤100, unique case-insensitive | `recipe.ingredientNameRequired` / `recipe.ingredientDuplicate` |
| `ingredients[].amount` | number >0, ≤3 chữ số thập phân | `recipe.amountInvalid` |
| `ingredients[].unit` | trim, required, ≤30 | `required` / `maxLength` |
| `prepTimeMinutes` / `cookTimeMinutes` | int ≥0 hoặc rỗng | `recipe.minutesInvalid` |
| `difficulty` | `EASY`/`MEDIUM`/`HARD` hoặc rỗng | — |

Trùng tên nguyên liệu kiểm ở **onSubmit** (cần so cả mảng), không phải Yup field-level.

### 4.4 Bố cục trang

```text
PageHeader (breadcrumb Home / Create Recipe)
  SectionCard 1 · Dish            name, dishName (autocomplete), description
  SectionCard 2 · Timing & Yield  prepTime, cookTime, servings, difficulty
  SectionCard 3 · Ingredients     IngredientEditor
  SectionCard 4 · Method          instructions (Textarea, rows 10)
  [Cancel] [Create Recipe]
```

Không dùng `RichTextEditor`: `instructions` là `TEXT` thuần ở backend, TipTap JSON
không gửi đi được ở endpoint này.

### 4.5 Luồng

1. Người dùng điền form → `Create Recipe`.
2. `createRecipe(payload)` → 201.
3. `toast.success` + `navigate("/my-posts")` — chưa có trang danh sách recipe nên
   chưa có chỗ nào để xem lại. Ghi `ponytail:` ở `onSuccess`.
4. Lỗi → `toast.error(getApiErrorMessage(error, t("recipe.toast.failed")))`.
   Lỗi 400 của backend (rule message) hiện nguyên văn.

### 4.6 i18n

Namespace mới `recipe`, thêm vào `src/i18n/index.ts` cho cả `en` và `vi`:

```json
"title", "subtitle", "section1..4", "field": { "name", "dishName", "description",
  "prepTime", "cookTime", "servings", "difficulty", "instructions", "ingredientName",
  "amount", "unit" },
"difficulty": { "EASY", "MEDIUM", "HARD" },
"ingredient": { "add", "remove", "empty", "hint" },
"action": { "cancel", "submit" },
"toast": { "created", "failed" },
"hint": { "autocomplete" }
```

Key validation riêng (`recipe.*`) nằm trong namespace `recipe`, không nhét vào `validation`
— `validation` chỉ chứa câu dùng chung nhiều form.

## 5. Thứ tự thực hiện

| # | Việc | Kiểm chứng | |
|---|---|---|---|
| 1 | `types.ts` | `npm run typecheck` | ✅ viết |
| 2 | `api.ts` (3 hàm) | `npm run typecheck` | ✅ viết |
| 3 | `schema.ts` + `payload.ts` + test | `npm test` | ✅ viết · ⬜ chạy |
| 4 | `AutocompleteField.tsx` | `npm run dev` | ✅ viết · ⬜ chạy |
| 5 | `IngredientEditor.tsx` | `npm run dev` | ✅ viết · ⬜ chạy |
| 6 | `CreateRecipePage.tsx` + route `/recipes/create` | `npm run dev` — tạo thật 1 recipe | ✅ viết · ⬜ chạy |
| 7 | i18n `recipe` (en + vi) + đăng ký namespace | đổi ngôn ngữ, không thấy key thô | ✅ viết · ⬜ chạy |
| 8 | Cập nhật `DOCS/API-COVERAGE.md` §20, `DOCS/SRS.md` §11.2 | — | ✅ |
| 9 | Commit + PR | theo `CONTRIBUTING.md` | ⬜ |

> Chưa chạy được `npm run typecheck` / `npm test` trong phiên này (bộ phân loại quyền
> của công cụ shell tạm thời không phản hồi). Cần chạy lại trước khi commit.

## 6. Test

- `schema.test.ts` — chạy không cần network:
  - `name`/`dishName`/`instructions` rỗng bị từ chối
  - `servings = 0` bị từ chối
  - `ingredients = []` bị từ chối
  - hai nguyên liệu trùng tên khác hoa thường bị từ chối
  - `amount = 0` và `amount` 4 chữ số thập phân bị từ chối
  - `buildRecipePayload` bỏ field rỗng (`description`, `prepTime`, `difficulty`) thay vì gửi `""`
- Không test screen: page phụ thuộc auth + 2 query autocomplete, chi phí cao hơn giá trị.

## 7. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| `dishName` bị BE lowercase → người dùng thấy tên món viết thường | Ghi rõ ở helper text; response trả `dishName` đã lowercase nên không cần xử lý |
| Autocomplete gọi API mỗi ký tự | `useDebounce` 300ms + `enabled` khi ≥2 ký tự + `staleTime` 60s |
| Trùng tên nguyên liệu chỉ báo ở onSubmit | Đánh dấu hàng lỗi + focus hàng đầu tiên |
| Tạo xong không có nơi xem lại | Chấp nhận; ghi `ponytail:` chờ trang list recipe |

## 8. Không làm (ghi rõ để reviewer khỏi hỏi)

- **Gán recipe vào bài** (`POST /api/posts/{postId}/recipes`, issue #137) — luồng riêng,
  cần sửa `CreatePostPage` + `PostDetailPage`.
- **Sửa / xoá recipe** — chưa có endpoint trong nhóm 20 (chỉ `POST`).
- **Trang danh sách / chi tiết recipe** — `GET /api/recipes` chưa có trong tài liệu API.
- **Admin recipe moderation** (`GET /api/admin/recipes`) — ✅ đã làm ở `/admin/recipes`,
  xem `DOCS/API-COVERAGE.md` §10. Chỉ đọc: backend chưa có sửa / xoá / khôi phục / duyệt.
- **Ảnh bìa recipe** — endpoint không nhận (xem 3.2).
