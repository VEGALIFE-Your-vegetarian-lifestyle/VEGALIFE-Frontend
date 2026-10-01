import { create } from "zustand";
import { clearScheduledTokenRefresh, scheduleTokenRefresh } from "@/services/api";
import type { User, UserProfile } from "@/types/user";

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    profile: UserProfile | null;
    rememberMe: boolean;
    setAuth: (auth: { user: User; accessToken: string; refreshToken: string; expiresIn?: number }, rememberMe?: boolean) => void;
    setAccessToken: (accessToken: string, expiresIn?: number) => void;
    setProfile: (profile: UserProfile) => void;
    clearAuth: () => void;
}

const AUTH_STORAGE_KEY = "vegalife_auth";
const REMEMBERED_IDENTIFIER_KEY = "vegalife_remembered_identifier";

interface StoredAuth {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    rememberMe: boolean;
}

function getAuthStorageKey(rememberMe: boolean): string {
    return rememberMe ? "vegalife_auth_persistent" : AUTH_STORAGE_KEY;
}

function loadStoredAuth(): StoredAuth {
    try {
        const persistent = localStorage.getItem("vegalife_auth_persistent");
        if (persistent) {
            const parsed = JSON.parse(persistent);
            return {
                user: parsed.user ?? null,
                accessToken: parsed.accessToken ?? null,
                refreshToken: parsed.refreshToken ?? null,
                expiresAt: parsed.expiresAt ?? null,
                rememberMe: true,
            };
        }

        const session = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (session) {
            const parsed = JSON.parse(session);
            return {
                user: parsed.user ?? null,
                accessToken: parsed.accessToken ?? null,
                refreshToken: parsed.refreshToken ?? null,
                expiresAt: parsed.expiresAt ?? null,
                rememberMe: false,
            };
        }
    } catch {
        // ignore
    }
    return { user: null, accessToken: null, refreshToken: null, expiresAt: null, rememberMe: false };
}

function saveStoredAuth(auth: StoredAuth): void {
    const data = {
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        expiresAt: auth.expiresAt,
    };
    if (auth.rememberMe) {
        localStorage.setItem("vegalife_auth_persistent", JSON.stringify(data));
    } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    }
}

function clearStoredAuth(): void {
    localStorage.removeItem("vegalife_auth_persistent");
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

const stored = loadStoredAuth();

export const useAuthStore = create<AuthState>((set, get) => ({
    user: stored.user,
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
    expiresAt: stored.expiresAt,
    profile: null,
    rememberMe: stored.rememberMe,

    setAuth: ({ user, accessToken, refreshToken, expiresIn }, rememberMe = false) => {
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null;
        const data: StoredAuth = { user, accessToken, refreshToken, expiresAt, rememberMe };
        saveStoredAuth(data);
        set({ user, accessToken, refreshToken, expiresAt, rememberMe });
        scheduleTokenRefresh(refreshToken);
    },

    setAccessToken: (accessToken, expiresIn) => {
        const state = get();
        const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : state.expiresAt;
        const data: StoredAuth = {
            user: state.user,
            accessToken,
            refreshToken: state.refreshToken,
            expiresAt,
            rememberMe: state.rememberMe,
        };
        saveStoredAuth(data);
        set({ accessToken, expiresAt });
        scheduleTokenRefresh(state.refreshToken);
    },

    setProfile: (profile) => set({ profile }),

    clearAuth: () => {
        clearScheduledTokenRefresh();
        clearStoredAuth();
        set({ user: null, accessToken: null, refreshToken: null, expiresAt: null, profile: null, rememberMe: false });
    },
}));

export function getRememberedIdentifier(): string | null {
    try {
        return localStorage.getItem(REMEMBERED_IDENTIFIER_KEY);
    } catch {
        return null;
    }
}

export function setRememberedIdentifier(identifier: string): void {
    try {
        localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier);
    } catch {
        // ignore
    }
}
