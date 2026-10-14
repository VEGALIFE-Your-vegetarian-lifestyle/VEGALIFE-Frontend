import { login } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

/**
 * Credentials cho test chạm backend thật — đọc từ biến môi trường, KHÔNG hard-code.
 *
 *   E2E_USER_IDENTIFIER / E2E_USER_PASSWORD    — tài khoản USER
 *   E2E_ADMIN_IDENTIFIER / E2E_ADMIN_PASSWORD  — tài khoản ADMIN
 *   E2E_ALLOW_WRITES=1                         — cho phép test tạo/xoá dữ liệu thật
 *
 * Không set thì test phụ thuộc đăng nhập tự `skip`, test chỉ-đọc vẫn chạy.
 *
 * Hai cách set, đều được hỗ trợ:
 *  1. Biến môi trường của shell (đọc qua `process.env`) — luôn chạy.
 *  2. File `.env.test.local` — Vite chỉ đưa biến có tiền tố `VITE_` vào
 *     `import.meta.env`, nên ở đây chấp nhận cả `VITE_E2E_...`.
 */
function readEnv(key: string): string | undefined {
    const meta = import.meta.env as unknown as Record<string, unknown>;
    for (const name of [`VITE_${key}`, key]) {
        const fromMeta = meta[name];
        if (typeof fromMeta === "string" && fromMeta !== "") return fromMeta;
    }
    const fromProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
    return fromProcess || undefined;
}

export const E2E_USER = {
    identifier: readEnv("E2E_USER_IDENTIFIER"),
    password: readEnv("E2E_USER_PASSWORD"),
};

export const E2E_ADMIN = {
    identifier: readEnv("E2E_ADMIN_IDENTIFIER"),
    password: readEnv("E2E_ADMIN_PASSWORD"),
};

/** Test ghi dữ liệu lên backend thật chỉ chạy khi bật cờ này. */
export const E2E_ALLOW_WRITES = readEnv("E2E_ALLOW_WRITES") === "1";

export const HAS_USER = Boolean(E2E_USER.identifier && E2E_USER.password);
export const HAS_ADMIN = Boolean(E2E_ADMIN.identifier && E2E_ADMIN.password);

/** Timeout riêng cho test gọi backend thật — Render free tier có cold start. */
export const REMOTE_TIMEOUT_MS = 60_000;

/** Đăng nhập rồi nạp token vào authStore để các service có JWT. */
export async function signInAs(account: { identifier?: string; password?: string }): Promise<void> {
    const data = await login({ identifier: account.identifier!, password: account.password! });
    useAuthStore.getState().setAuth({
        user: {
            id: data.userId,
            username: data.username,
            email: data.email,
            role: data.role,
            status: data.status,
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
    });
}

export function signOut(): void {
    useAuthStore.getState().clearAuth();
}

/**
 * Lỗi HTTP của axios, đọc `status` mà không cần import kiểu axios.
 *
 * Chịu được `null`/`undefined` vì nhiều test truyền thẳng kết quả của
 * `.then(() => undefined, (e) => e)` — request thành công thì không có error.
 */
export function httpStatus(error: unknown): number | undefined {
    return (error as { response?: { status?: number } } | null | undefined)?.response?.status;
}
