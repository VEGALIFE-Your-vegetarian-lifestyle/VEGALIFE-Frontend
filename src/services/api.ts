import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { LoginResponse, RefreshTokenRequest } from "@/types/user";

export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const REFRESH_THRESHOLD_MS = 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 14 * 60 * 1000;

const PUBLIC_AUTH_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/resend-email",
    "/auth/forgot-password",
    "/auth/verify-password-reset",
    "/auth/reset-password",
];

export function scheduleTokenRefresh(refreshToken: string | null | undefined): void {
    clearScheduledTokenRefresh();
    if (!refreshToken) return;
    refreshTimer = setTimeout(() => {
        refreshAccessToken(refreshToken).catch(() => {
            // Silent fail: don't kick user out on proactive refresh.
            // The next API call will retry with the refresh token.
        });
    }, AUTO_REFRESH_INTERVAL_MS);
}

export function clearScheduledTokenRefresh(): void {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}

api.interceptors.request.use(async (config) => {
    const state = useAuthStore.getState();
    const isPublicAuth = config.url ? PUBLIC_AUTH_PATHS.some((path) => config.url?.endsWith(path)) : false;

    if (state.accessToken && !isPublicAuth) {
        const now = Date.now();
        const tokenExpired = state.expiresAt ? state.expiresAt <= now : false;
        const tokenAboutToExpire = state.expiresAt ? state.expiresAt - now <= REFRESH_THRESHOLD_MS : false;

        if ((tokenExpired || tokenAboutToExpire) && state.refreshToken) {
            try {
                const newAccessToken = await refreshAccessToken(state.refreshToken);
                config.headers.Authorization = `Bearer ${newAccessToken}`;
            } catch {
                // Refresh failed; send old token or no token depending on expiry.
                if (!tokenExpired) {
                    config.headers.Authorization = `Bearer ${state.accessToken}`;
                }
            }
        } else {
            config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const refreshTokenValue = useAuthStore.getState().refreshToken;

        if (status === 401 && originalRequest && !originalRequest._retry && refreshTokenValue) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = refreshAccessToken(refreshTokenValue).finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                });
            }

            try {
                const newAccessToken = await refreshPromise;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch {
                // Refresh failed: keep the user on the current page so they can
                // continue reading public content, but stop sending authenticated
                // requests until they log in again.
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/refresh", { refreshToken } satisfies RefreshTokenRequest);
    const data = response.data.data;
    useAuthStore.getState().setAccessToken(data.accessToken, data.expiresIn);
    scheduleTokenRefresh(data.refreshToken ?? refreshToken);
    return data.accessToken;
}
