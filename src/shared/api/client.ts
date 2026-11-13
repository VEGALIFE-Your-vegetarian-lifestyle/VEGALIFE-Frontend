import axios from "axios";
import { useAuthStore } from "@/shared/auth/authStore";
import type { ApiResponse } from "@/shared/types/common";
import type { LoginResponse, RefreshTokenRequest } from "@/shared/types/user";

// Raw axios instance with NO interceptors attached.
// Dedicated to auth refresh / unauthenticated calls so it never triggers recursive interceptor loops.
const rawClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
    timeout: 15000,
});

export const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}`,
    timeout: 30000,
});

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
    "/auth/refresh",
    "/auth/google",
];

function isPublicAuthPath(url?: string): boolean {
    if (!url) return false;
    const cleanUrl = url.split("?")[0];
    return PUBLIC_AUTH_PATHS.some((path) => cleanUrl.endsWith(path));
}

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
    const isPublicAuth = isPublicAuthPath(config.url);

    if (state.accessToken && !isPublicAuth) {
        const now = Date.now();
        const tokenExpired = state.expiresAt ? state.expiresAt <= now : false;
        const tokenAboutToExpire = state.expiresAt ? state.expiresAt - now <= REFRESH_THRESHOLD_MS : false;

        if ((tokenExpired || tokenAboutToExpire) && state.refreshToken) {
            try {
                const newAccessToken = await refreshAccessToken(state.refreshToken);
                config.headers.Authorization = `Bearer ${newAccessToken}`;
            } catch {
                // Refresh failed; send old token only if it hasn't expired yet
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

        const isAuthRequest = isPublicAuthPath(originalRequest?.url);

        if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest && refreshTokenValue) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken(refreshTokenValue);
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

export async function refreshAccessToken(refreshToken: string): Promise<string> {
    // If a refresh is already in-flight, return the existing promise so concurrent requests deduplicate.
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const response = await rawClient.post<ApiResponse<LoginResponse>>(
                "/api/auth/refresh",
                { refreshToken } satisfies RefreshTokenRequest,
            );
            const data = response.data.data;
            useAuthStore.getState().setAccessToken(data.accessToken, data.expiresIn);
            scheduleTokenRefresh(data.refreshToken ?? refreshToken);
            return data.accessToken;
        } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            // If the refresh token is rejected (400, 401, 403), wipe auth state so app returns cleanly to guest state
            if (status === 400 || status === 401 || status === 403) {
                useAuthStore.getState().clearAuth();
            }
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}
