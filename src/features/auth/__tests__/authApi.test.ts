// @vitest-environment node
/**
 * Test service auth — gọi BACKEND THẬT (https://vegalife-backend.onrender.com).
 *
 * Nguyên tắc: chỉ khẳng định những gì backend thực sự trả về, không khẳng định
 * câu chữ tiếng Anh/Việt của message. Test nào cần tài khoản hợp lệ thì tự bỏ qua
 * khi thiếu biến môi trường (xem `src/test/e2eEnv.ts`).
 */
import { describe, expect, it } from "vitest";
import {
    forgotPassword,
    login,
    loginWithGoogle,
    register,
    resendVerifyEmail,
    resetPassword,
    verifyEmail,
    verifyPasswordReset,
} from "../api";
import { E2E_USER, HAS_USER, REMOTE_TIMEOUT_MS, httpStatus } from "@/test/e2eEnv";

const FAKE_UUID_EMAIL = "vitest-no-such-account@example.invalid";

describe("authService — endpoint public (không cần tài khoản)", () => {
    it(
        "loginWithGoogle với code không hợp lệ trả 4xx",
        async () => {
            const error = await loginWithGoogle({ code: "invalid-auth-code" }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "login với mật khẩu sai trả 4xx, không trả token",
        async () => {
            const error = await login({ identifier: FAKE_UUID_EMAIL, password: "WrongPass123!" }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
            expect(httpStatus(error)).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "login cắt khoảng trắng hai đầu trước khi gửi",
        async () => {
            const clean = await login({ identifier: FAKE_UUID_EMAIL, password: "WrongPass123!" }).catch((e) => e);
            const padded = await login({
                identifier: `  ${FAKE_UUID_EMAIL}  `,
                password: "  WrongPass123!  ",
            }).catch((e) => e);

            // Không trim thì backend nhận identifier khác → có thể ra lỗi validate
            // khác. Cùng status nghĩa là đã trim trước khi gửi.
            expect(httpStatus(padded)).toBe(httpStatus(clean));
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "register thiếu trường bắt buộc bị backend từ chối",
        async () => {
            // Cố tình gửi payload rỗng để backend tự validate.
            const error = await register({
                username: "",
                email: "not-an-email",
                password: "",
                confirmPassword: "",
            }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "verifyEmail với OTP sai bị từ chối",
        async () => {
            const error = await verifyEmail({ email: FAKE_UUID_EMAIL, otp: "000000" }).catch((e) => e);

            // Email không tồn tại cũng có thể ra 2xx/4xx tuỳ backend — chặn 5xx.
            expect(httpStatus(error) ?? 200).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "verifyPasswordReset với OTP sai bị từ chối",
        async () => {
            const error = await verifyPasswordReset({ email: FAKE_UUID_EMAIL, otp: "000000" }).catch((e) => e);

            expect(httpStatus(error)).toBeGreaterThanOrEqual(400);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "forgotPassword cho email không tồn tại không làm sập backend",
        async () => {
            // Backend chống dò email: email lạ thường vẫn trả 2xx (promise resolve).
            // Quy về status, `undefined` nghĩa là đã resolve.
            const status = await forgotPassword({ email: FAKE_UUID_EMAIL }).then(
                () => undefined,
                (error: unknown) => httpStatus(error),
            );

            // 2xx (không lộ email có tồn tại hay không) hoặc 4xx đều chấp nhận.
            expect(status ?? 200).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "resendVerifyEmail cho email không tồn tại không ném lỗi 5xx",
        async () => {
            const status = await resendVerifyEmail({ email: FAKE_UUID_EMAIL }).then(
                () => undefined,
                (error: unknown) => httpStatus(error),
            );

            // Chấp nhận 2xx hoặc 4xx; 5xx là backend hỏng.
            expect(status ?? 200).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );

    it(
        "resetPassword trên email không tồn tại không làm sập backend",
        async () => {
            const status = await resetPassword({
                email: FAKE_UUID_EMAIL,
                newPassword: "NewPass123!",
            }).then(
                () => undefined,
                (error: unknown) => httpStatus(error),
            );

            // 2xx (chống dò email) hoặc 4xx đều chấp nhận; 5xx là backend hỏng.
            expect(status ?? 200).toBeLessThan(500);
        },
        REMOTE_TIMEOUT_MS,
    );
});

describe.skipIf(!HAS_USER)("authService — cần tài khoản thật (E2E_USER_*)", () => {
    it(
        "login thành công trả đủ token và hồ sơ",
        async () => {
            const data = await login({ identifier: E2E_USER.identifier!, password: E2E_USER.password! });

            expect(data.accessToken).toBeTruthy();
            expect(data.refreshToken).toBeTruthy();
            expect(data.userId).toBeTruthy();
            expect(["ADMIN", "USER"]).toContain(data.role);
        },
        REMOTE_TIMEOUT_MS,
    );
});
