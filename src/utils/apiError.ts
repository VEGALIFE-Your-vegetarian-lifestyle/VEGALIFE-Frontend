/**
 * Lấy câu lỗi hiển thị cho người dùng từ lỗi axios.
 *
 * Backend trả lý do cụ thể trong `message` (400/409), có endpoint trả thêm
 * `errors[]` (PUT /api/profile) — ưu tiên `errors[]`, rồi `message`, cuối cùng
 * là câu chung của từng màn. ponytail: chỉ đọc một tầng `response.data`, đủ cho
 * mọi endpoint hiện có; đổi sang `AxiosError` khi cần thêm `status`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { message?: string; errors?: string[] } } }).response?.data;
    return data?.errors?.join("\n") || data?.message || fallback;
}
