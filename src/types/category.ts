export interface Category {
    id: string;
    name: string;
    description?: string;
    /** Số nội dung gắn danh mục. Backend chưa trả — mock ở `shared/mocks/categories.ts`. */
    contentCount?: number;
    createdAt: string;
    deletedAt: string | null; // null = active, có giá trị = retired
}

export interface CategoryPayload {
    name: string;
    description?: string;
}

export type CategorySort = "newest" | "name";

export interface CategoryListParams {
    page: number;
    size: number;
    q?: string;
    sort?: CategorySort;
}
