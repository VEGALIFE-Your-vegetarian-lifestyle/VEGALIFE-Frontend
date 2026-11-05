import type { UserProfile } from "@/shared/types/user";

/** Giới hạn backend cho 4 mảng dietary — PUT /api/profile. */
export const MAX_DIETARY_ITEMS = 50;
export const MAX_DIETARY_ITEM_LENGTH = 100;
export const MAX_HEALTH_GOAL_LENGTH = 200;

export const DIETARY_LIST_KEYS = ["preferences", "dislikes", "allergies", "restrictions"] as const;
export type DietaryListKey = (typeof DIETARY_LIST_KEYS)[number];

/**
 * Gợi ý UI cho chip — KHÔNG phải enum: backend nhận chuỗi tự do cho cả 5 field,
 * nên người dùng luôn gõ được giá trị ngoài danh sách này.
 */
export const DIETARY_SUGGESTIONS: Record<DietaryListKey, readonly string[]> = {
    preferences: ["Vegan", "Vegetarian", "Gluten-free", "Low-carb", "High-protein"],
    allergies: ["Peanuts", "Tree nuts", "Soy", "Sesame", "Shellfish"],
    dislikes: ["Cilantro", "Mushroom", "Olives", "Onion"],
    restrictions: ["No added sugar", "Low sodium", "No fried food", "No alcohol"],
};

export const GOAL_SUGGESTIONS = ["Lose weight", "Maintain weight", "Gain muscle", "Improve digestion"];

/** Dị ứng tô màu cảnh báo; 3 nhóm còn lại màu xanh thương hiệu. */
export const DIETARY_TONE: Record<DietaryListKey, "green" | "alert"> = {
    preferences: "green",
    dislikes: "green",
    allergies: "alert",
    restrictions: "green",
};

export interface DietaryValues {
    preferences: string[];
    dislikes: string[];
    allergies: string[];
    restrictions: string[];
    healthGoal: string;
}

/**
 * Response bỏ hẳn field dietary chưa set (không trả `null`) → mặc định mảng rỗng,
 * goal rỗng. Luôn copy mảng để state form không ghi ngược vào cache React Query.
 */
export function toDietaryValues(profile?: UserProfile): DietaryValues {
    return {
        preferences: [...(profile?.preferences ?? [])],
        dislikes: [...(profile?.dislikes ?? [])],
        allergies: [...(profile?.allergies ?? [])],
        restrictions: [...(profile?.restrictions ?? [])],
        healthGoal: profile?.healthGoal ?? "",
    };
}

/** Trim + gộp khoảng trắng + bỏ phần tử rỗng + bỏ trùng (không phân biệt hoa thường). */
export function normalizeTags(values: readonly string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of values) {
        const value = raw.trim().replace(/\s+/g, " ");
        if (!value) continue;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(value);
    }

    return result;
}
