import { api } from "../lib/axios";
import type { Category, CategoryPayload } from "../types/category";

export const getCategories = async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>("/categories");
    return data;
};

export const createCategory = async (payload: CategoryPayload): Promise<Category> => {
    const { data } = await api.post<Category>("/categories", payload);
    return data;
};

export const updateCategory = async (id: string, payload: CategoryPayload): Promise<Category> => {
    const { data } = await api.put<Category>(`/categories/${id}`, payload);
    return data;
};

// BR-ADMIN-003: category đang dùng thì không xóa cứng, chỉ retire
export const retireCategory = async (id: string): Promise<void> => {
    await api.patch(`/categories/${id}/retire`);
};

export const restoreCategory = async (id: string): Promise<void> => {
    await api.patch(`/categories/${id}/restore`);
};