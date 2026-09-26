export interface Category {
    categoryId: string;
    name: string;
    description?: string;
    createdAt: string;
    deletedAt: string | null; // null = active, có giá trị = đã retire
}

export interface CategoryPayload {
    name: string;
    description?: string;
}