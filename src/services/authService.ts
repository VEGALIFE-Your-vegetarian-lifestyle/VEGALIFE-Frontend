import { api } from "@/services/api";
import type {
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    VerifyPasswordResetRequest,
} from "@/types/user";

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<ApiResponse<RegisterResponse>>("/auth/register", request);
    return response.data.data;
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", request);
    return response.data.data;
}

export async function forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/auth/forgot-password", request);
}

export async function verifyPasswordReset(request: VerifyPasswordResetRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/auth/verify-password-reset", request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
    await api.post<ApiResponse<void>>("/auth/reset-password", request);
}

export async function logout(): Promise<void> {
    await api.post<ApiResponse<void>>("/auth/logout", {});
}
