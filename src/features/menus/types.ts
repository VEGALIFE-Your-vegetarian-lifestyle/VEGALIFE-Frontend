export type MenuStatus = "drafted" | "scheduled" | "cancelled" | "completed";

export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

/**
 * Món trong menu — `GET /api/menus/details` trả subset của dish.
 * ponytail: trùng tên `Dish` ở `features/recipes/types.ts` nhưng khác shape (bên đó có
 * `createdAt`, dùng cho autocomplete). Giữ bản riêng, đừng import chéo — hai domain
 * độc lập. Gộp khi backend trả cùng một shape.
 */
export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
}

export interface Meal {
    mealType: MealType;
    servings: number;
    dish: Dish;
}

/** `days` chỉ chứa ngày có ít nhất một bữa — có thể thiếu ngày, có thể rỗng. */
export interface MenuDay {
    /** YYYY-MM-DD */
    date: string;
    meals: Meal[];
}

export interface MenuDetail {
    id: string;
    /** YYYY-MM-DD */
    startDate: string;
    /** YYYY-MM-DD, = startDate + 6 */
    endDate: string;
    status: MenuStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    days: MenuDay[];
}

export interface MealPlanParams {
    /** YYYY-MM-DD */
    from: string;
    to: string;
}

/** Nhãn + màu cho badge trạng thái — dùng chung mọi nơi hiển thị menu. */
export const MENU_STATUS_VARIANT: Record<MenuStatus, "amber" | "default" | "outline" | "lightgreen"> = {
    drafted: "amber",
    scheduled: "default",
    cancelled: "outline",
    completed: "lightgreen",
};
