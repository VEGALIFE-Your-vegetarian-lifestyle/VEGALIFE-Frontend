import type { CreateMenuRequest } from "../types";
import type { MenuFormValues } from "./schema";

/**
 * Form → body `POST /api/menus`.
 * Ô trống bị loại khỏi `meals`; ngày vẫn luôn đủ 7 phần tử (backend đòi đúng 7 ngày liên
 * tiếp), nhưng `validate` đã chặn ngày rỗng nên mỗi ngày trên thực tế có ≥ 1 bữa.
 *
 * `servings` luôn gửi `1`: thực đơn là của cá nhân, form không hỏi số phần. Backend vẫn
 * bắt buộc field này (BR-MENU-005) nên không bỏ được khỏi payload.
 */
export const DEFAULT_SERVINGS = 1;

export function buildCreateMenuPayload(values: MenuFormValues): CreateMenuRequest {
    const notes = values.notes.trim();
    return {
        startDate: values.startDate,
        ...(notes ? { notes } : {}),
        days: values.days.map((day) => ({
            date: day.date,
            meals: day.slots
                .filter((slot) => slot.dish !== null)
                .map((slot) => ({
                    mealType: slot.mealType,
                    dishId: slot.dish!.id,
                    servings: DEFAULT_SERVINGS,
                })),
        })),
    };
}
