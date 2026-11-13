import { api } from "@/shared/api/client";
import type { ApiResponse, PageResponse } from "@/shared/types/common";

/**
 * Hai endpoint Home cần nhưng thuộc feature khác (`locations`, `menus`).
 *
 * ponytail: quy tắc import một chiều của repo chỉ cho `posts` phụ thuộc `categories`/`auth`,
 * nên không import `features/locations/api` hay `features/menus/api` từ đây. Khai tạm đúng
 * phần field cần dùng; khi quy tắc cho phép (hoặc Home chuyển sang trang cần đăng nhập)
 * thì xoá file này, gọi thẳng service của feature tương ứng.
 */

export interface HomePlace {
    id: string;
    name: string;
    address: string;
    rating: number | null;
    /** 1–4, 1 = rẻ. */
    priceLevel?: number;
}

/** `GET /api/restaurants` — BE xếp sẵn theo rating giảm dần, cần JWT. */
export async function getTopRatedPlaces(size = 4): Promise<HomePlace[]> {
    const { data } = await api.get<ApiResponse<PageResponse<HomePlace>>>("/api/restaurants", {
        params: { page: 0, size },
    });
    return data.data.content;
}

export type HomeMenuStatus = "drafted" | "scheduled" | "cancelled" | "completed";

export type HomeMealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface HomeMeal {
    mealType: HomeMealType;
    dish: { id: string; name: string; imageUrl: string | null };
}

/** `days` chỉ chứa ngày có ít nhất một bữa — lưới 7 ô phải tự bù ngày trống. */
export interface HomeMenuDay {
    /** YYYY-MM-DD */
    date: string;
    meals: HomeMeal[];
}

export interface HomeWeekMenu {
    id: string;
    status: HomeMenuStatus;
    days: HomeMenuDay[];
}

/** `GET /api/menus/details` cho cửa sổ 7 ngày — menu của chính user, cần JWT. */
export async function getCurrentWeekMenu(from: string, to: string): Promise<HomeWeekMenu[]> {
    const { data } = await api.get<ApiResponse<HomeWeekMenu[]>>("/api/menus/details", {
        params: { from, to },
    });
    return data.data ?? [];
}

/** Date → "YYYY-MM-DD" theo giờ máy. */
export function toISODate(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Tuần ISO (T2 → CN) theo giờ máy, kèm sẵn 7 ngày ISO để dựng lưới.
 * `menus/week.ts` cấm import chéo từ đây nên phần tính ngày được viết lại tại chỗ.
 */
export function currentWeekRange(now = new Date()): { from: string; to: string; days: string[] } {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

    const days = Array.from({ length: 7 }, (_, index) =>
        toISODate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
    );
    return { from: days[0], to: days[6], days };
}
