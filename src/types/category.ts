export interface Category {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    deletedAt: string | null; // null = đang dùng, có giá trị = đã ngừng sử dụng (BR-ADMIN-003)
}

export interface CategoryPayload {
    name: string;
    description?: string;
}