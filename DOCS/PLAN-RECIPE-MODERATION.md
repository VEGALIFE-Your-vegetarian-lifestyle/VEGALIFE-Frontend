# Plan — Duyệt / từ chối recipe (Admin)

> Trạng thái: **chưa code** · Ngày lập: 2026-10-26 · Branch: `feat/meal-plan`
> Backend: `dev` @ `e8db8a4` (ADR-016 — component-level moderation, issue #160/#161)
> Liên quan: `DOCS/API-COVERAGE.md` §10, `DOCS/PLAN-CREATE-RECIPE.md`

## 1. Mục tiêu

Thành viên tạo recipe (`POST /api/recipes`) → recipe vào trạng thái `PENDING`, **không**
xuất hiện ở bất kỳ tìm kiếm/gợi ý nào. Admin phải duyệt (`APPROVED`) hoặc từ chối
(`REJECTED`) thì recipe mới dùng được.

Hiện tại `/admin/recipes` **chỉ đọc**: bảng liệt kê recipe, bấm tên mở dialog xem chi
tiết, hết. Không lọc được theo trạng thái duyệt, không có nút duyệt/từ chối, và
`moderationStatus` thậm chí chưa có trong type nên admin **không biết recipe nào đang chờ**.

**Phạm vi**: admin lọc theo trạng thái duyệt + duyệt/từ chối recipe ngay trong dialog chi tiết.

**Ngoài phạm vi**: sửa/xoá recipe, duyệt dish/ingredient (Phase 2), trang recipe của member.

## 2. Hiện trạng

| Thứ | Trạng thái |
|---|---|
| `GET /api/admin/recipes` | ✅ đã gọi, nhưng **không gửi** `moderationStatus` → luôn lấy cả 3 trạng thái lẫn lộn |
| `AdminRecipe` type | ❌ thiếu `moderationStatus`, `score`, `dishModerationStatus`, `ingredients[].moderationStatus` |
| `POST /api/admin/recipes/{id}/approve` | ❌ chưa có service |
| `POST /api/admin/recipes/{id}/reject` | ❌ chưa có service |
| `AdminRecipesPage` | ❌ không có cột/filter trạng thái duyệt, không có action |
| `RecipeDetailDialog` | ❌ chỉ đọc, không có nút |
| i18n `admin:recipes.moderation.*` | ❌ chưa có |

Backend đã sẵn sàng đầy đủ — **không cần chờ gì**.

## 3. API cần dùng

| # | Endpoint | Vai trò | Ghi chú |
|---|---|---|---|
| 1 | `GET /api/admin/recipes` | hàng đợi | Thêm param `moderationStatus=PENDING\|APPROVED\|REJECTED`. Bỏ trống = cả 3. `sort` whitelist có thêm `moderationStatus`, `score` |
| 2 | `POST /api/admin/recipes/{id}/approve` | duyệt | Body `{reason?}` — **optional**, body rỗng vẫn 200. Idempotent: đã APPROVED thì no-op, không ghi log |
| 3 | `POST /api/admin/recipes/{id}/reject` | từ chối | Body `{reason?}`. Idempotent: đã REJECTED thì no-op. **Không xoá gì** — chỉ đổi trạng thái |

Cả 2 endpoint trả `AdminRecipeListResponse` (đúng shape row đang có) → dùng lại được để
cập nhật cache, không cần gọi lại list.

**Không cần** `GET /api/admin/recipes/{recipeId}`: row trong list đã có đủ field dialog
đang render (instructions, ingredients, dishName, …). Gọi thêm = 1 request thừa.

### Điều backend làm / không làm

| Làm | Không làm |
|---|---|
| Đổi `recipe.moderation_status` | **Không** đổi `dish` / `ingredient` của recipe đó |
| Ghi `moderation_log` (`APPROVE_COMPONENT` / `REJECT_COMPONENT`, target `RECIPE`) | Không xoá, không sửa nội dung |
| 404 nếu recipe không tồn tại / đã xoá mềm | Không đổi `status` (ACTIVE/DELETED) |
| | Không đổi `score` |

> ⚠️ **Duyệt recipe KHÔNG làm dish/ingredient của nó hiện ra.** `GET /api/dishes` và
> `GET /api/ingredients` lọc `moderation_status = APPROVED`. Member tạo recipe với tên
> món mới → tên đó `PENDING` → không có trong autocomplete của form tạo recipe, không có
> trong `DishPicker` của meal plan. Recipe vẫn **search được** sau khi duyệt (search chỉ
> lọc `recipe.moderation_status`), nhưng tên món thì vẫn ẩn. Xem Phase 2 §8.

## 4. Quyết định

### 4.1 Filter mặc định = `PENDING`, không phải "tất cả"

Màn hình này là **hàng đợi duyệt**, không phải danh mục. Admin mở vào phải thấy ngay
việc cần làm. Backend bỏ trống param thì trả cả 3 trạng thái — giống `GET /api/admin/posts`
mặc định `NEEDS_REVIEW`.

→ `moderationStatus` khởi tạo `"PENDING"`, ghi lên URL (`?status=PENDING`) để reload/back
giữ nguyên. Dùng lại `status` của `useListParams` (URL key `status`), map sang query param
`moderationStatus` trong service — tránh thêm hook/param mới.

### 4.2 Duyệt / từ chối ngay trong dialog chi tiết, không thêm cột action

Admin phải **đọc nội dung** trước khi quyết định; duyệt mù từ bảng là duyệt không kiểm tra.
Dialog đã render đủ instructions + ingredients — đặt nút ở đó, đúng chỗ đã có ngữ cảnh.

Bảng chỉ thêm **badge trạng thái duyệt** để admin biết hàng đợi còn gì.

### 4.3 Không nhập lý do — dùng `ConfirmDialog` có sẵn

`reason` là optional ở backend. `ConfirmDialog` đã có sẵn (title/description/confirmLabel/
destructive/loading) → **không cần file dialog mới**.

```tsx
// approve
<ConfirmDialog
    open={confirm === "approve"}
    title={t("recipes.moderation.approveTitle")}
    description={t("recipes.moderation.approveBody", { name: recipe.name })}
    confirmLabel={t("recipes.moderation.approve")}
    loading={mutation.isPending}
    onConfirm={() => mutation.mutate({ id: recipe.id, action: "approve" })}
    onClose={() => setConfirm(null)}
/>
// reject: destructive, confirmLabel = "Từ chối"
```

`ponytail:` lý do chưa nhập được — thêm dialog nhập lý do khi cần truy vết
(`moderation_log.reason` hiện luôn `null` cho recipe).

### 4.4 Giữ nguyên `status` (ACTIVE/DELETED) và thêm badge riêng

Hai trục độc lập: `status` nói về xoá mềm, `moderationStatus` nói về duyệt. Một recipe có
thể `ACTIVE` + `PENDING`. Hiện cột "Trạng thái" chỉ hiện `status` → thêm cột "Duyệt" bên
cạnh, **không** gộp.

## 5. Thiết kế

### 5.1 File đụng tới

```text
src/features/recipes/types.ts                                thêm ModerationStatus + field vào AdminRecipe
src/features/recipes/adminApi.ts                             thêm param + approveRecipe/rejectRecipe
src/features/recipes/constants.ts                            MỚI: map variant cho 3 trạng thái duyệt
src/features/recipes/pages/AdminRecipesPage/AdminRecipesPage.tsx    filter + badge + mutation + ConfirmDialog
src/features/recipes/pages/AdminRecipesPage/RecipeDetailDialog.tsx  badge dish/ingredient + nút duyệt/từ chối
src/i18n/locales/{en,vi}/admin.json                          thêm recipes.moderation.* + column.moderation
src/features/recipes/__tests__/adminApi.test.ts              thêm case cho approve/reject
DOCS/API-COVERAGE.md                                         cập nhật §10
```

### 5.2 `types.ts`

```ts
/** `GET /api/admin/recipes` — trạng thái duyệt (ADR-016). Khác `RecipeStatus` (xoá mềm). */
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RecipeIngredient {
    ingredientId: string;
    name: string;
    amount: number;
    unit: string;
    /** Có ở response admin; member-facing không trả. */
    moderationStatus?: ModerationStatus;
}

export interface AdminRecipe extends Omit<Recipe, "dishName"> {
    dishName: string | null;
    status: RecipeStatus;
    moderationStatus: ModerationStatus;
    /** Điểm liên quan lúc nộp; `null` = chưa từng chấm. */
    score: number | null;
    dishModerationStatus: ModerationStatus;
    username: string;
    email: string;
    categoryIds: string[];
}
```

`Recipe` (member-facing) **không** đổi — Phase 2 mới cần.

### 5.3 `adminApi.ts`

```ts
export interface AdminRecipeListParams {
    page: number;
    size: number;
    sort?: RecipeSort;
    moderationStatus?: ModerationStatus;   // thêm
    userId?: string;
    categoryId?: string;
    createdFrom?: string;
    createdTo?: string;
}

// trong getAdminRecipes, cạnh các filter khác:
if (params.moderationStatus) queryParams.set("moderationStatus", params.moderationStatus);

/** POST /api/admin/recipes/{id}/approve — chỉ đổi recipe, KHÔNG đổi dish/ingredient của nó. */
export async function approveRecipe(id: string, reason?: string): Promise<AdminRecipe> {
    const { data } = await api.post<ApiResponse<AdminRecipe>>(
        `/api/admin/recipes/${id}/approve`,
        reason ? { reason } : {},
    );
    return data.data;
}

/** POST /api/admin/recipes/{id}/reject — không xoá gì, tên bị chặn tạo lại vĩnh viễn. */
export async function rejectRecipe(id: string, reason?: string): Promise<AdminRecipe> { /* như trên */ }
```

### 5.4 `constants.ts` (mới, 6 dòng)

```ts
import type { ModerationStatus } from "./types";

/** Nhãn i18n ở `admin:recipes.moderation.status.*`. */
export const MODERATION_VARIANT: Record<ModerationStatus, "amber" | "lightgreen" | "destructive"> = {
    PENDING: "amber",
    APPROVED: "lightgreen",
    REJECTED: "destructive",
};
```

### 5.5 `AdminRecipesPage.tsx`

Bốn thay đổi nhỏ:

1. Destructure thêm `status`, `setStatus` từ `useListParams`.
2. `queryKey` + `getAdminRecipes` thêm `moderationStatus: (status || "PENDING") as ModerationStatus`.
3. Thêm `<Select>` lọc ngay cạnh ô sort — 4 lựa chọn: Pending / Approved / Rejected / All.
4. Thêm cột "Duyệt" render `MODERATION_VARIANT[recipe.moderationStatus]`; thêm 2 mutation
   `approveMutation` / `rejectMutation` gọi `approveRecipe`/`rejectRecipe`, `onSuccess`
   toast + `invalidateQueries({ queryKey: ["admin-recipes"] })`, `onError` dùng
   `getApiErrorMessage` như `PostsPage`.

Truyền `moderationStatus`, `onApprove`, `onReject`, `loading` xuống `RecipeDetailDialog`.

### 5.6 `RecipeDetailDialog.tsx`

- Badge trạng thái duyệt cạnh badge `status`.
- Mỗi dòng ingredient: badge nhỏ `moderationStatus` nếu có — admin thấy ngay tên nào còn PENDING.
- Badge `dishModerationStatus` cạnh `dishName`.
- Footer: `Đóng` + `Từ chối` (outline, ẩn khi đã REJECTED) + `Duyệt` (primary, ẩn khi đã APPROVED).
- Nút bấm **không** tự gọi API — báo lên page mở `ConfirmDialog` (giữ dialog chi tiết mở,
  giống `PostPreviewDialog` + `RejectPostDialog` bên posts).

### 5.7 i18n — cả `en` và `vi`

`admin.json` → `recipes`:

```json
"column": { "moderation": "Review" },
"moderation": {
  "status": { "PENDING": "Pending review", "APPROVED": "Approved", "REJECTED": "Rejected" },
  "filterLabel": "Filter by review state",
  "filterAll": "All states",
  "approve": "Approve",
  "reject": "Reject",
  "approveTitle": "Approve this recipe?",
  "approveBody": "\"{{name}}\" will become visible in search and dish suggestions.",
  "rejectTitle": "Reject this recipe?",
  "rejectBody": "\"{{name}}\" will stay hidden. The name cannot be reused later.",
  "approved": "Recipe approved",
  "rejected": "Recipe rejected",
  "actionFailed": "Action failed. Please try again."
}
```

Bản `vi` dịch tương ứng — convention repo: thêm key thì thêm cả 2 locale.

## 6. Kiểm chứng

```bash
npm run typecheck
npm test -- src/features/recipes
```

Thêm vào `src/features/recipes/__tests__/adminApi.test.ts` (đã có khung `E2E_ADMIN`,
tự skip khi thiếu env):

| Case | Kỳ vọng |
|---|---|
| `getAdminRecipes({ moderationStatus: "PENDING" })` | mọi row có `moderationStatus === "PENDING"` |
| `getAdminRecipes({ moderationStatus: "BOGUS" })` | 400 (backend `AdminComponentQuery.parseStatus`) |
| `approveRecipe(uuid-không-tồn-tại)` | 404, không phải 5xx |
| `approveRecipe` không token | 401/403 |

Thủ công (cần `E2E_ALLOW_WRITES=1`):

1. Đăng nhập member → `/recipes/create` → tạo recipe với tên món mới → 201.
2. Đăng nhập admin → `/admin/recipes` → mặc định thấy recipe đó ở `PENDING`.
3. Mở dialog → thấy badge PENDING ở recipe + dish + ingredients.
4. Bấm **Duyệt** → confirm → toast, badge đổi `APPROVED`, row biến khỏi filter PENDING.
5. Bấm **Từ chối** ở recipe khác → badge `REJECTED`, vẫn nằm trong danh sách (không bị xoá).

## 7. Thứ tự thực hiện

1. `types.ts` + `constants.ts` + `adminApi.ts` — typecheck xong mới đụng UI.
2. `AdminRecipesPage` — filter + badge + mutation (chưa cần dialog).
3. `RecipeDetailDialog` — badge + nút.
4. i18n en + vi.
5. Test + cập nhật `DOCS/API-COVERAGE.md` §10.

## 8. Phase 2 — duyệt dish / ingredient (chưa làm trong plan này)

Duyệt recipe xong vẫn còn lỗ hổng: tên món/nguyên liệu do member tạo nằm `PENDING` nên
**không xuất hiện** trong `GET /api/dishes`, `GET /api/ingredients`, `GET /api/dishes/suggestions`.
Hệ quả: autocomplete ở form tạo recipe không gợi ý được, `DishPicker` (meal plan) không
thấy món, gợi ý món theo dị ứng bỏ sót.

API cần (đối xứng hoàn toàn, cùng shape):

| Resource | Endpoints |
|---|---|
| Dish | `GET/POST /api/admin/dishes`, `GET/PATCH/DELETE /api/admin/dishes/{id}`, `POST /{id}/approve`, `POST /{id}/reject` |
| Ingredient | `GET/POST /api/admin/ingredients`, `GET/PATCH/DELETE /api/admin/ingredients/{id}`, `POST /{id}/approve`, `POST /{id}/reject` |

List nhận `page`/`size`/`sort`/`name`/`moderationStatus`. Khác recipe: admin tạo tay được
(`POST`) và tạo xong là `APPROVED` ngay. `REJECTED` là chặn vĩnh viễn — member không tạo
lại được tên đó.

Gợi ý triển khai: một trang `/admin/names` dùng chung component cho 2 resource (cấu trúc
giống nhau, chỉ khác `description`/`imageUrl`/`cuisineType` của dish), thêm vào
`AdminShell.navItems`. Viết plan riêng khi làm.

**Đường tắt**: duyệt bài viết (`POST /api/admin/posts/{id}/approve`) tự duyệt luôn mọi
component `PENDING` mà bài đó tham chiếu (recipe + dish + ingredient). Nếu recipe được gắn
vào bài và bài được duyệt thì Phase 2 không còn cấp thiết. Nhưng `POST /api/posts/{id}/recipes`
(gán recipe vào bài) FE **chưa gọi** — nên hiện tại đường tắt này chưa dùng được.
