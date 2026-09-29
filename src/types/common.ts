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