/**
 * Lấy câu lỗi hiển thị cho người dùng từ lỗi axios.
 *
 * Backend trả lý do cụ thể trong `message` (400/409), có endpoint trả thêm
 * `errors[]` (PUT /api/profile), và endpoint validate của Spring (`/auth/register`) trả
 * map field → câu lỗi trong `data` kèm `message: "Validation failed"`.
 * Thứ tự ưu tiên: `errors[]` → map field trong `data` → `message` → câu chung của màn.
 * ponytail: chỉ đọc một tầng `response.data`, đủ cho mọi endpoint hiện có; đổi sang
 * `AxiosError` khi cần thêm `status`.
 */
interface ErrorBody {
    success?: boolean;
    message?: string;
    errors?: string[];
    data?: unknown;
}

/** Body validate kiểu Spring: `data = { email: "...", password: "..." }` — mọi value là chuỗi. */
function fieldErrors(data: unknown): string[] {
    if (typeof data !== "object" || data === null || Array.isArray(data)) return [];
    const values = Object.values(data);
    return values.every((v) => typeof v === "string") ? (values as string[]).filter(Boolean) : [];
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: ErrorBody } }).response?.data;
    const perField = fieldErrors(data?.data);
    return data?.errors?.join("\n") || perField.join("\n") || data?.message || fallback;
}

/**
 * Axios timeout: client tự huỷ sau `timeout`, **không có `response`**. Khác hẳn server
 * trả lỗi — backend vẫn chạy tiếp, có thể đã ghi xong dữ liệu. Đừng báo "thất bại".
 */
export function isTimeoutError(error: unknown): boolean {
    const e = error as { code?: string; response?: unknown } | null;
    return !e?.response && (e?.code === "ECONNABORTED" || e?.code === "ETIMEDOUT");
}

/** Server trả 404. Dùng cho DELETE idempotent: gặp 404 nghĩa là "đã xoá rồi", không phải lỗi. */
export function isNotFound(error: unknown): boolean {
    return (error as { response?: { status?: number } } | null)?.response?.status === 404;
}
