import { api } from "@/services/api";
import type { Category, CategoryListParams, CategoryPayload, CategorySort } from "@/types/category";
import type { ApiResponse, PageResponse, Paginated } from "@/types/common";

// Backend trả về Category cơ bản (chưa có deletedAt)
interface BackendCategory {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

function sortCategories(items: Category[], sort: CategorySort): Category[] {
    const sorted = [...items];
    switch (sort) {
        case "name":
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case "newest":
        default:
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
}

/**
 * GET /api/categories — public, chỉ active.
 */
export async function getPublicCategories(params: {
    page?: number;
    size?: number;
    sort?: string;
    name?: string;
}): Promise<PageResponse<BackendCategory>> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendCategory>>>("/api/categories", {
        params: {
            page: params.page ?? 0,
            size: params.size ?? 20,
            sort: params.sort ?? "name,asc",
            ...(params.name ? { name: params.name } : {}),
        },
    });
    return data.data;
}

/**
 * GET /api/categories — public, chỉ trả category chưa retire.
 * ponytail: dùng tạm cho admin list vì backend chưa có GET /api/admin/categories.
 * Hệ quả: không thấy được category đã retire (deletedAt luôn null).
 */
export async function getCategories(params: CategoryListParams): Promise<Paginated<Category>> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendCategory>>>("/api/categories", {
        params: {
            page: Math.max(params.page - 1, 0),
            size: params.size,
            ...(params.q ? { name: params.q } : {}),
        },
    });

    const items = sortCategories(
        data.data.content.map((category) => ({
            ...category,
            description: category.description ?? undefined,
            deletedAt: null,
        })),
        params.sort ?? "newest",
    );

    return {
        data: items,
        total: data.data.totalElements,
        page: data.data.page + 1,
        size: data.data.size,
        totalPages: data.data.totalPages,
    };
}

export async function createCategory(payload: CategoryPayload): Promise<BackendCategory> {
    const { data } = await api.post<ApiResponse<BackendCategory>>("/api/admin/categories", {
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
    });
    return data.data;
}

/** PATCH — field bỏ trống giữ nguyên, nên payload nhận một phần. */
export async function updateCategory(id: string, payload: Partial<CategoryPayload>): Promise<BackendCategory> {
    const body: Partial<CategoryPayload> = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.description !== undefined) body.description = payload.description.trim();

    const { data } = await api.patch<ApiResponse<BackendCategory>>(`/api/admin/categories/${id}`, body);
    return data.data;
}

/**
 * DELETE /api/admin/categories/{categoryId} — soft delete (retire).
 * Bài đã gắn category vẫn giữ tham chiếu; category retired không gán được cho bài mới.
 */
export async function retireCategory(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/categories/${id}`);
}

// ponytail: backend chưa có restore / permanent delete / GET admin categories.
// Thêm lại khi có endpoint: PATCH .../restore, DELETE .../permanent.

/** Export CSV từ chính GET /api/categories (không có endpoint export riêng). */
export async function exportCategoriesCsv(): Promise<string> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendCategory>>>("/api/categories", {
        params: { page: 0, size: 100 },
    });

    const headers = ["ID", "Name", "Description", "Created At"];
    const rows = data.data.content.map((category) => [
        category.id,
        category.name,
        category.description ?? "",
        category.createdAt,
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}

