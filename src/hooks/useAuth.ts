import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
    const { user, accessToken, profile, rememberMe, setAuth, clearAuth, setAccessToken, setProfile } = useAuthStore();

    return useMemo(
        () => ({
            user,
            accessToken,
            profile,
            rememberMe,
            isAuthenticated: !!accessToken && !!user,
            isAdmin: user?.role === "ADMIN",
            setAuth,
            clearAuth,
            setAccessToken,
            setProfile,
        }),
        [user, accessToken, profile, rememberMe, setAuth, clearAuth, setAccessToken, setProfile],
    );
}
