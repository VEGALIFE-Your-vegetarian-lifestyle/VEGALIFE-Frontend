import type { AdminDish, AdminDishCreateRequest, AdminDishUpdateRequest } from "../../types";

/** Giá trị thô của form tạo/sửa món — `imageUrl` giữ `null` khi chưa có ảnh. */
export interface DishFormValues {
    name: string;
    description: string;
    cuisineType: string;
    imageUrl: string | null;
}

export const emptyDishForm = (): DishFormValues => ({
    name: "",
    description: "",
    cuisineType: "",
    imageUrl: null,
});

export function toDishForm(dish: AdminDish | null): DishFormValues {
    if (!dish) return emptyDishForm();
    return {
        name: dish.name,
        description: dish.description ?? "",
        cuisineType: dish.cuisineType ?? "",
        imageUrl: dish.imageUrl,
    };
}

/** `POST /api/admin/dishes` — chỉ `name` bắt buộc; khoá rỗng thì bỏ hẳn khỏi payload. */
export function buildDishCreate(values: DishFormValues): AdminDishCreateRequest {
    const payload: AdminDishCreateRequest = { name: values.name.trim() };
    const description = values.description.trim();
    const cuisineType = values.cuisineType.trim();
    if (description) payload.description = description;
    if (cuisineType) payload.cuisineType = cuisineType;
    if (values.imageUrl) payload.imageUrl = values.imageUrl;
    return payload;
}

/**
 * `PATCH /api/admin/dishes/{dishId}` — chỉ gửi field **đã đổi**; `null` = không đổi gì,
 * chỗ gọi khỏi gọi API.
 *
 * Xoá trắng `description`/`cuisineType` hoặc gỡ ảnh gửi `""` (spec cho `minLength: 0`).
 * ponytail: chưa verify BE lưu `""` hay đổi thành `null`; nếu UI hiện ô trống có giá trị thì
 * đổi sang gửi `null`.
 */
export function buildDishUpdate(initial: DishFormValues, values: DishFormValues): AdminDishUpdateRequest | null {
    const payload: AdminDishUpdateRequest = {};
    const name = values.name.trim();
    const description = values.description.trim();
    const cuisineType = values.cuisineType.trim();
    const imageUrl = values.imageUrl ?? "";

    if (name && name !== initial.name) payload.name = name;
    if (description !== initial.description.trim()) payload.description = description;
    if (cuisineType !== initial.cuisineType.trim()) payload.cuisineType = cuisineType;
    if (imageUrl !== (initial.imageUrl ?? "")) payload.imageUrl = imageUrl;

    return Object.keys(payload).length > 0 ? payload : null;
}
