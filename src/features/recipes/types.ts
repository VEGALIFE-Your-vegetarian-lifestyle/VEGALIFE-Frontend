/** Độ khó — `chk_difficulty` ở backend: EASY | MEDIUM | HARD. */
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

/** Đơn vị backend chấp nhận cho nguyên liệu **mới** (`kg`/`tbsp`/`cup`… → 400). */
export const UNITS = ["g", "ml", "piece"] as const;
export type Unit = (typeof UNITS)[number];

/** Một dòng nguyên liệu trong form (chưa gửi lên). */
export interface RecipeIngredientInput {
    name: string;
    amount: string;
    unit: string;
    /**
     * Chỉ phục vụ UI + payload, **không gửi lên BE**: `true` khi hàng lấy từ autocomplete
     * = nguyên liệu đã tồn tại → BE bỏ qua `unit`, amount đọc theo đơn vị lưu sẵn.
     * Reset về `false` khi member sửa tay tên.
     */
    existing?: boolean;
}

/** Một dòng nguyên liệu backend trả về — `name` đã trim + lowercase. */
export interface RecipeIngredient {
    ingredientId: string;
    name: string;
    amount: number;
    /** `null` khi BE không xác định được đơn vị của nguyên liệu. */
    unit: string | null;
    /** Chỉ `GET /api/admin/recipes` trả — response member-facing không có. */
    moderationStatus?: ModerationStatus;
}

/**
 * POST /api/recipes — owner lấy từ JWT, `dishName` find-or-create phía server.
 * Optional (bỏ trống thì **vắng mặt**, đừng gửi `null`/`""`): `description`,
 * `prepTimeMinutes`, `cookTimeMinutes`, `difficulty`.
 *
 * Dinh dưỡng KHÔNG gửi lên: BE tính từ dinh dưỡng từng nguyên liệu (V49/V50).
 * `unit` của một dòng nguyên liệu: optional; bị **bỏ qua** nếu nguyên liệu đã tồn tại,
 * và phải thuộc `UNITS` nếu là nguyên liệu mới (ngược lại 400).
 */
export interface CreateRecipeRequest {
    name: string;
    /** Trim + lowercase ở server; trùng tên thì dùng lại dish cũ. */
    dishName: string;
    instructions: string;
    servings: number;
    ingredients: { name: string; amount: number; unit?: string }[];
    description?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    difficulty?: Difficulty | null;
}

export interface Recipe {
    id: string;
    userId: string;
    dishId: string;
    dishName: string;
    name: string;
    description: string | null;
    instructions: string;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number;
    difficulty: Difficulty | null;
    ingredients: RecipeIngredient[];
    /** Recipe mới tạo luôn `PENDING` (ADR-016); duyệt recipe không đổi dish. */
    moderationStatus: ModerationStatus;
    dishModerationStatus: ModerationStatus;
    /** Lý do admin từ chối — chỉ có khi `moderationStatus === "REJECTED"`, ngoài ra `null`. */
    rejectionReason: string | null;
    /**
     * Tổng dinh dưỡng **cả công thức** (V49/V50) — BE tính từ `Σ(amount × giá trị/đơn vị)`,
     * làm tròn 1 lần trên tổng. `nutritionResolved === false` thì cả 5 field đều `null`
     * (không bao giờ lẻ); `0` là giá trị thật (nước = 0 kcal), đừng coi như thiếu dữ liệu.
     */
    nutritionResolved: boolean;
    calories: number | null;
    proteinG: number | null;
    carbohydrateG: number | null;
    fatG: number | null;
    fiberG: number | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * GET /api/admin/recipes — row đầy đủ cho admin.
 * Khác `Recipe`: có `status` (soft-delete suy ra từ `deleted_at`, không lưu cột),
 * thông tin chủ recipe và `categoryIds` (resolve qua post_recipe).
 *
 * Admin list **không** trả tổng dinh dưỡng lẫn `nutritionResolved` (spec live
 * `AdminRecipeListResponse`) → omit cả 6 để type không hứa field BE không gửi.
 */
export interface AdminRecipe
    extends Omit<Recipe, "dishName" | "nutritionResolved" | "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG"> {
    /** Admin list trả `null` được, khác response của `POST /api/recipes`. */
    dishName: string | null;
    status: RecipeStatus;
    /** Trạng thái duyệt của recipe — khác `status` (xoá mềm). */
    moderationStatus: ModerationStatus;
    /** Điểm liên quan lúc nộp; `null` = chưa từng chấm. */
    score: number | null;
    /** Trạng thái duyệt của tên món dùng chung; duyệt recipe KHÔNG đổi nó. */
    dishModerationStatus: ModerationStatus;
    /** BE trả `displayName` — không còn `username`. */
    displayName: string;
    email: string;
    categoryIds: string[];
    /**
     * Tên nguyên liệu chưa có unit/dinh dưỡng — vì sao recipe này `nutritionResolved` false.
     * Chỉ để hiển thị cho admin; admin không sửa được qua API recipe.
     */
    missingRequiredIngredients: string[];
}

/**
 * `PATCH /api/admin/recipes/{id}` — **chỉ 7 field này**. Ingredients và dish không sửa
 * được qua endpoint admin; bỏ trống một key thì giữ nguyên (PATCH nghĩa đen).
 * `name`/`instructions` rỗng → 400. `difficulty` ngoài whitelist → 400. Recipe xoá mềm → 404.
 */
export interface AdminRecipeUpdateRequest {
    name?: string;
    description?: string;
    instructions?: string;
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings?: number;
    difficulty?: Difficulty;
}

/** `ACTIVE` | `DELETED` — derived ở server; bản ghi xoá mềm vẫn nằm trong danh sách. */
export type RecipeStatus = "ACTIVE" | "DELETED";

/**
 * Trạng thái kiểm duyệt của một tên dùng chung (dish / ingredient / recipe) — ADR-016.
 * `REJECTED` là chặn vĩnh viễn: member không tạo lại được tên đó.
 */
export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

/**
 * `sort` hợp lệ của `GET /api/admin/recipes` (whitelist backend) — kèm hướng.
 * Sai giá trị → 400.
 */
export type RecipeSort = "createdAt,desc" | "updatedAt,desc" | "name,asc";

/** `GET /api/dishes` — gợi ý tên món, chỉ đọc. Định nghĩa nằm ở `shared/types/dish.ts`
 * vì `menus` cũng dùng. */
export type { Dish } from "@/shared/types/dish";

/**
 * `GET /api/ingredients` — gợi ý tên nguyên liệu, không có cột nutrition.
 * `unit` là đơn vị **đã lưu** (`G`/`ML`/`PIECE`), `null` khi nguyên liệu chưa được admin điền.
 */
export interface Ingredient {
    id: string;
    name: string;
    unit: IngredientUnit | null;
    createdAt: string;
}

/** Mã đơn vị **lưu ở backend** — khác `UNITS` (chữ thường) mà form gửi lên. */
export const INGREDIENT_UNITS = ["G", "ML", "PIECE"] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

/**
 * `GET /api/admin/ingredients` — row quản lý nguyên liệu.
 * `unit` `null` = chưa gán đơn vị; `nutritionResolved` chỉ `true` khi **có unit + đủ 5 giá trị**.
 */
export interface AdminIngredient {
    id: string;
    name: string;
    moderationStatus: ModerationStatus;
    unit: IngredientUnit | null;
    calories: number | null;
    proteinG: number | null;
    carbohydrateG: number | null;
    fatG: number | null;
    fiberG: number | null;
    nutritionResolved: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * `POST /api/admin/ingredients` — chỉ `name` bắt buộc.
 * Gửi dinh dưỡng mà bỏ `unit` → 400. Gửi 1–4 giá trị → 400 (đủ 5 hoặc không cái nào).
 */
export interface AdminIngredientCreateRequest {
    name: string;
    unit?: IngredientUnit;
    calories?: number;
    proteinG?: number;
    carbohydrateG?: number;
    fatG?: number;
    fiberG?: number;
}

/** `PATCH /api/admin/ingredients/{id}` — y hệt create, mọi field optional; vắng = giữ nguyên. */
export type AdminIngredientUpdateRequest = Partial<AdminIngredientCreateRequest>;
