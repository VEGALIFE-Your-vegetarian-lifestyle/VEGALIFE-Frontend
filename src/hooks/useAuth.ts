import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logout } from "@/services/authService";
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

/**
 * Đăng xuất dùng chung cho Navbar, Profile và AdminShell. Gọi API thu hồi
 * refresh token TRƯỚC khi xóa state — xóa trước thì request mất Authorization
 * và token không bao giờ bị thu hồi ở server. Token hết hạn vẫn coi như xong.
 */
export function useLogout() {
    const navigate = useNavigate();
    const clearAuth = useAuthStore((state) => state.clearAuth);

    return useCallback(
        async (successMessage?: string) => {
            try {
                await logout();
            } catch {
                // 401 nghĩa là token đã hết hạn/thu hồi — vẫn đăng xuất được.
            } finally {
                clearAuth();
            }
            if (successMessage) toast.success(successMessage);
            navigate("/", { replace: true });
        },
        [clearAuth, navigate],
    );
}
