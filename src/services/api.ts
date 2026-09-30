import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { LoginResponse, RefreshTokenRequest } from "@/types/user";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
                useAuthStore.getState().clearAuth();
                window.location.href = "/login";
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

async function refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/refresh", { refreshToken } satisfies RefreshTokenRequest);
    const data = response.data.data;
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
}
