import { useAuthStore } from "@/stores/authStore";
import { useMemo } from "react";

export function useAuth() {
    const { user, accessToken, profile, setAuth, clearAuth, setAccessToken, setProfile } = useAuthStore();

    return useMemo(
        () => ({
            user,
            accessToken,
            profile,
            isAuthenticated: !!accessToken && !!user,
            isAdmin: user?.role === "ADMIN",
            setAuth,
            clearAuth,
            setAccessToken,
            setProfile,
        }),
        [user, accessToken, profile, setAuth, clearAuth, setAccessToken, setProfile],
    );
}
