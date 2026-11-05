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
    /** Chỉ đọc — `PUT /api/profile` không nhận 2 field này (backend lấy từ bảng user). */
    displayName: string;
    email: string;
    heightCm: number | null;
    weightKg: number | null;
    /** Chỉ đọc — backend tính lúc đọc: `weightKg/(heightCm/100)²`, 1 số lẻ HALF_UP, null khi thiếu height/weight. */
    bmi: number | null;
    age: number | null;
    gender: Gender | null;
    description: string | null;
    avatarUrl: string | null;
    updatedAt: string;
    /**
     * 5 field dietary — backend lưu chung một cột JSONB, và **field chưa set thì
     * vắng hẳn khỏi JSON** (không trả `null`/`[]`). Luôn đọc qua `?? []` / `?? ""`.
     */
    preferences?: string[];
    dislikes?: string[];
    allergies?: string[];
    restrictions?: string[];
    healthGoal?: string;
}

export interface LoginResponse {
    userId: string;
    /** BE trả `displayName` — không còn `username`. `LoginPage` map sang `User.username`. */
    displayName: string;
    email: string;
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
    displayName: string;
    email: string;
}

export interface VerifyEmailRequest {
    email: string;
    otp: string;
}

export interface VerifyEmailResponse {
    userId: string;
    displayName: string;
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
    /** Tối đa 50 phần tử, mỗi phần tử ≤100 ký tự. `[]` = xoá sạch, vắng mặt = giữ nguyên. */
    preferences?: string[];
    dislikes?: string[];
    allergies?: string[];
    restrictions?: string[];
    /** Tối đa 200 ký tự. */
    healthGoal?: string;
}

export interface AdminUser {
    id: string;
    email: string;
    /** BE trả `displayName` — không còn `username`. */
    displayName: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
}

export interface GoogleLoginRequest {
    code: string;
}

