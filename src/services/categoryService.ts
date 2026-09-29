import { categoriesSeed } from "@/shared/mocks/categories";
import type { Category, CategoryPayload } from "@/types/category";
import { delay } from "@/utils/delay";

// Mock data — thay từng hàm bằng api.get/post/put/delete("/categories...") khi backend xong (FR-06-01)
let categories = [...categoriesSeed];

export const getCategories = async (): Promise<Category[]> => {
    await delay();
    return categories;
};

export const createCategory = async (payload: CategoryPayload): Promise<void> => {
    await delay();
    categories = [
        { id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString(), deletedAt: null },
        ...categories,
    ];
};

export const updateCategory = async (id: string, payload: CategoryPayload): Promise<void> => {
    await delay();
    categories = categories.map((category) => (category.id === id ? { ...category, ...payload } : category));
};

// DELETE /categories/:id là soft delete — BR-ADMIN-003: category đang dùng chỉ được ngừng sử dụng
export const retireCategory = async (id: string): Promise<void> => {
    await delay();
    categories = categories.map((category) =>
        category.id === id ? { ...category, deletedAt: new Date().toISOString() } : category,
    );
};