import { api, refreshAccessToken } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import type {
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResendVerifyEmailRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    VerifyEmailResponse,
    VerifyPasswordResetRequest,
} from "@/types/user";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<ApiResponse<RegisterResponse>>("/api/auth/register", request);
    return response.data.data;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>(
        "/api/auth/login",
        {
            identifier: request.identifier.trim(),
            password: request.password.trim(),
        },
        { headers: { Authorization: undefined } },
    );
    return response.data.data;
}

export async function verifyEmail(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await api.post<ApiResponse<VerifyEmailResponse>>("/api/auth/verify-email", request);
    return response.data.data;
}

export async function resendVerifyEmail(request: ResendVerifyEmailRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/api/auth/resend-email", request);
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/api/auth/forgot-password", request);
}

export async function verifyPasswordReset(request: VerifyPasswordResetRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/api/auth/verify-password-reset", request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/api/auth/reset-password", request);
}

export async function logout(): Promise<void> {
    try {
        await api.post<ApiResponse<void>>("/api/auth/logout", {});
    } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
            const refreshTokenValue = useAuthStore.getState().refreshToken;
            if (refreshTokenValue) {
                await refreshAccessToken(refreshTokenValue);
                await api.post<ApiResponse<void>>("/api/auth/logout", {});
                return;
            }
        }
        throw error;
    }
}
