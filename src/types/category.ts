export interface Category {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    deletedAt: string | null; // null = active, có giá trị = retired
}

export interface CategoryPayload {
    name: string;
    description?: string;
}

export type CategoryStatusFilter = "all" | "active" | "deleted";
export type CategorySort = "newest" | "name";

export interface CategoryListParams {
    page: number;
    size: number;
    q?: string;
    status?: CategoryStatusFilter;
    sort?: CategorySort;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}
