import { api } from "@/services/api";
import type { Category, CategoryListParams, CategoryPayload, CategorySort, Paginated } from "@/types/category";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

// Backend trả về Category cơ bản (chưa có deletedAt)
interface BackendCategory {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
}

// Admin trả về đầy đủ deletedAt
interface AdminCategory extends BackendCategory {
    deletedAt: string | null;
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
 * GET /api/categories — dùng tạm cho admin list vì backend chưa có /api/admin/categories.
 * ponytail: khi backend có admin endpoint trả deletedAt, switch lại /api/admin/categories.
 */
export async function getCategories(params: CategoryListParams): Promise<Paginated<Category>> {
    const { data } = await api.get<ApiResponse<PageResponse<BackendCategory>>>("/api/categories", {
        params: {
            page: Math.max(params.page - 1, 0),
            size: params.size,
            ...(params.q ? { name: params.q } : {}),
            sort: "createdAt,desc",
        },
    });

    let items: Category[] = data.data.content.map((category) => ({
        ...category,
        description: category.description ?? undefined,
        deletedAt: null,
    }));

    const status = params.status ?? "all";
    if (status === "active") items = items.filter((c) => c.deletedAt === null);
    if (status === "deleted") items = items.filter((c) => c.deletedAt !== null);

    items = sortCategories(items, params.sort ?? "newest");

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

export async function updateCategory(id: string, payload: CategoryPayload): Promise<BackendCategory> {
    const body: Partial<CategoryPayload> = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.description !== undefined) body.description = payload.description.trim();

    const { data } = await api.patch<ApiResponse<BackendCategory>>(`/api/admin/categories/${id}`, body);
    return data.data;
}

export async function retireCategory(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/categories/${id}`);
}

export async function restoreCategory(id: string): Promise<void> {
    await api.patch<ApiResponse<AdminCategory>>(`/api/admin/categories/${id}/restore`);
}

export async function permanentlyDeleteCategory(id: string): Promise<void> {
    await api.delete<ApiResponse<null>>(`/api/admin/categories/${id}/permanent`);
}

export async function exportCategoriesCsv(): Promise<string> {
    const { data } = await api.get<ApiResponse<PageResponse<AdminCategory>>>("/api/admin/categories", {
        params: { page: 0, size: 1000 },
    });

    const headers = ["ID", "Name", "Description", "Created At", "Deleted At"];
    const rows = data.data.content.map((category) => [
        category.id,
        category.name,
        category.description ?? "",
        category.createdAt,
        category.deletedAt ?? "",
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
    return csv;
}
