// Định dạng phân trang theo SRS 11.1
export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export interface ListParams<S extends string> {
    page: number;
    size: number;
    q?: string;
    status?: S;
}

/** Wrapper mọi endpoint trả về: `{ success, message, data }`. */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

/** Trang thô của Spring Page — map sang `Paginated` ở tầng service. */
export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}
