import { api } from "@/services/api";
import type { AdminUser } from "@/types/user";
import type { Paginated } from "@/types/common";

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

export interface UserListParams {
    page: number;
    size: number;
    q?: string;
    status?: string;
    role?: string;
}

export async function getUsers(params: UserListParams): Promise<Paginated<AdminUser>> {
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(params.page));
    queryParams.set("size", String(params.size));

    if (params.status) queryParams.set("status", params.status);
    if (params.role) queryParams.set("role", params.role);
    // Backend does not support search by q; we filter client-side for now.

    const response = await api.get<ApiResponse<PageResponse<AdminUser>>>(`/admin/users?${queryParams.toString()}`);
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
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${userId}/suspend`);
    return response.data.data;
}

export async function restoreUser(userId: string): Promise<AdminUser> {
    const response = await api.post<ApiResponse<AdminUser>>(`/admin/users/${userId}/restore`);
    return response.data.data;
}
