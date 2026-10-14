import { api } from "@/services/api";
import type { AdminUser } from "@/types/user";
import type { ApiResponse, PageResponse, Paginated } from "@/types/common";

export interface UserListParams {
    page: number;
    size: number;
    q?: string;
    status?: string;
    role?: string;
    /** ISO-8601 — backend lọc theo createdAt. */
    createdFrom?: string;
    createdTo?: string;
}

export async function getUsers(params: UserListParams): Promise<Paginated<AdminUser>> {
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(params.page));
    queryParams.set("size", String(params.size));
    queryParams.set("sort", "createdAt,desc");

    if (params.status) queryParams.set("status", params.status);
    if (params.role) queryParams.set("role", params.role);
    if (params.createdFrom) queryParams.set("createdFrom", params.createdFrom);
    if (params.createdTo) queryParams.set("createdTo", params.createdTo);
    // Backend không có tham số tìm kiếm; `q` lọc client-side ở UsersPage (chỉ trong trang hiện tại).

    const response = await api.get<ApiResponse<PageResponse<AdminUser>>>(`/api/admin/users?${queryParams.toString()}`);
    const page = response.data.data;

    return {
        data: page.content,
        total: Number(page.totalElements),
        page: page.page + 1,
        size: page.size,
        totalPages: page.totalPages,
    };
}

export async function suspendUser(userId: string): Promise<AdminUser> {
    const response = await api.post<ApiResponse<AdminUser>>(`/api/admin/users/${userId}/suspend`);
    return response.data.data;
}

export async function restoreUser(userId: string): Promise<AdminUser> {
    const response = await api.post<ApiResponse<AdminUser>>(`/api/admin/users/${userId}/restore`);
    return response.data.data;
}
