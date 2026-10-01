export type UserRole = "ADMIN" | "USER";
export type UserStatus = "created" | "activated" | "deactivated" | "suspended";
export type Gender = "male" | "female" | "other";

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

export interface UserProfile {
    id: string;
    userId: string;
    heightCm: number | null;
    weightKg: number | null;
    age: number | null;
    gender: Gender | null;
    description: string | null;
    avatarUrl: string | null;
    updatedAt: string;
}

export interface LoginResponse {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface RegisterResponse {
    userId: string;
    username: string;
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    otp: string;
}

export interface VerifyEmailResponse {
    userId: string;
    username: string;
    email: string;
}

export interface LoginRequest {
    identifier: string;
    password: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface ResendVerifyEmailRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface VerifyPasswordResetRequest {
    email: string;
    otp: string;
}

export interface ResetPasswordRequest {
    email: string;
    newPassword: string;
}

export interface UpdateProfileRequest {
    heightCm?: number;
    weightKg?: number;
    age?: number;
    gender?: Gender;
    description?: string;
    avatarUrl?: string;
}

export interface AdminUser {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
}
