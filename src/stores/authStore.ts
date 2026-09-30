import { create } from "zustand";
import type { User, UserProfile } from "@/types/user";

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    profile: UserProfile | null;
    setAuth: (auth: { user: User; accessToken: string; refreshToken: string }) => void;
    setAccessToken: (accessToken: string) => void;
    setProfile: (profile: UserProfile) => void;
    clearAuth: () => void;
}

const AUTH_STORAGE_KEY = "vegalife_auth";

function loadStoredAuth(): { user: User | null; accessToken: string | null; refreshToken: string | null } {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return { user: null, accessToken: null, refreshToken: null };
        const parsed = JSON.parse(raw);
        return {
            user: parsed.user ?? null,
            accessToken: parsed.accessToken ?? null,
            refreshToken: parsed.refreshToken ?? null,
        };
    } catch {
        return { user: null, accessToken: null, refreshToken: null };
    }
}

const stored = loadStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
    user: stored.user,
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    profile: null,

    setAuth: ({ user, accessToken, refreshToken }) => {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
        set({ user, accessToken, refreshToken });
    },

    setAccessToken: (accessToken) => {
        const state = get();
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...state, accessToken }));
        set({ accessToken });
    },

    setProfile: (profile) => set({ profile }),

    clearAuth: () => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        set({ user: null, accessToken: null, refreshToken: null, profile: null });
    },
}));
