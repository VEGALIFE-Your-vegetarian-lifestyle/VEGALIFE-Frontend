import type { UpdateProfileRequest, UserProfile } from "@/shared/types/user";

/** Giới hạn backend cho 4 mảng dietary — PUT /api/profile. */
export const MAX_DIETARY_ITEMS = 50;
export const MAX_DIETARY_ITEM_LENGTH = 100;
export const MAX_HEALTH_GOAL_LENGTH = 200;

export const DIETARY_LIST_KEYS = ["preferences", "dislikes", "allergies", "restrictions"] as const;
export type DietaryListKey = (typeof DIETARY_LIST_KEYS)[number];

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

function sameTags(left: readonly string[], right: readonly string[]): boolean {
    const a = normalizeTags(left);
    const b = normalizeTags(right);
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Chỉ trả field đã đổi so với dữ liệu đang lưu.
 *
 * Backend merge từng field: vắng mặt = giữ nguyên, `[]` = xoá sạch. Nhờ vậy lưu
 * dietary không đụng tới height/weight/age/... của form hồ sơ.
 * `healthGoal` xoá trắng thì gửi `""` (backend không có cách riêng để null hoá — gửi
 * `null` nghĩa là "giữ nguyên"). Hệ quả: lần đọc sau trả `""` chứ không vắng field,
 * `toDietaryValues` đã xử lý qua `?? ""`.
 */
export function buildDietaryPatch(initial: DietaryValues, current: DietaryValues): UpdateProfileRequest {
    const patch: UpdateProfileRequest = {};

    for (const key of DIETARY_LIST_KEYS) {
        const next = normalizeTags(current[key]);
        if (!sameTags(next, initial[key])) patch[key] = next;
    }

    const goal = current.healthGoal.trim();
    if (goal !== initial.healthGoal.trim()) patch.healthGoal = goal;

    return patch;
}
