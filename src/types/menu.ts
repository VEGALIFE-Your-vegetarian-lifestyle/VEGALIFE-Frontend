/**
 * Nhóm 27 (Weekly menu) — `DOCS/API-REFERENCE.md` #60–#64.
 * Không thêm field nào ngoài spec.
 */

export type MenuStatus = "drafted" | "scheduled" | "cancelled" | "completed";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

/** #60 — summary, KHÔNG có `days`/`meals`. */
export interface MenuSummary {
    id: string;
    startDate: string;
    endDate: string;
    status: MenuStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

/** #61 — meal nhúng ĐẦY ĐỦ dish. */
export interface MenuDish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
}

export interface MenuMealDetail {
    mealType: MealType;
    servings: number;
    dish: MenuDish;
}

export interface MenuDayDetail {
    date: string;
    meals: MenuMealDetail[];
}

/** #61 — mảng phẳng, xếp `startDate` tăng dần. */
export interface MenuDetail extends MenuSummary {
    days: MenuDayDetail[];
}

/** #62/#63/#64 — meal chỉ có `dishId` + `dishName` (cố ý khác shape #61). */
export interface MenuMealRef {
    mealType: MealType;
    dishId: string;
    dishName: string;
    servings: number;
}

export interface MenuDayRef {
    date: string;
    meals: MenuMealRef[];
}

export interface MenuMutationResult extends MenuSummary {
    days: MenuDayRef[];
}

export interface MenuMealInput {
    mealType: MealType;
    dishId: string;
    servings: number;
}

export interface MenuDayInput {
    date: string;
    meals: MenuMealInput[];
}

/** #62 — `startDate` phải là thứ Hai, `endDate` do server tự tính. */
export interface CreateMenuRequest {
    startDate: string;
    notes?: string;
    days: MenuDayInput[];
}

/** #63 — thay TOÀN BỘ meals; không nhận `startDate`/`endDate`. */
export interface UpdateMenuRequest {
    days: MenuDayInput[];
    notes?: string;
}

/** #64 — `drafted` không gửi được. */
export type MenuStatusAction = Exclude<MenuStatus, "drafted">;

export interface MenuStatusRequest {
    status: MenuStatusAction;
}
