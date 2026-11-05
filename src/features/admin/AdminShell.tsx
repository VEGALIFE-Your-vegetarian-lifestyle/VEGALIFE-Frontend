import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Apple, ChefHat, FileText, LayoutDashboard, Leaf, LogOut, MapPin, Menu, MessageSquare, Tags, UserCircle, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { countAdminIngredients } from "@/features/recipes/adminApi";
import { useUiStore } from "@/shared/ui/uiStore";
import { LanguageSwitcher } from "@/app/layout/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const navItems = [
    { to: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard, ready: true },
    { to: "/admin/users", labelKey: "users", icon: Users, ready: true },
    { to: "/admin/posts", labelKey: "posts", icon: FileText, ready: true },
    { to: "/admin/videos", labelKey: "videos", icon: Video, ready: true },
    { to: "/admin/comments", labelKey: "comments", icon: MessageSquare, ready: false },
    { to: "/admin/categories", labelKey: "categories", icon: Tags, ready: true },
    { to: "/admin/recipes", labelKey: "recipes", icon: ChefHat, ready: true },
    { to: "/admin/ingredients", labelKey: "ingredients", icon: Apple, ready: true },
    { to: "/admin/locations", labelKey: "locations", icon: MapPin, ready: true },
    { to: "/admin/profile", labelKey: "profile", icon: UserCircle, ready: true },
];

export function AdminShell() {
    const { t } = useTranslation(["admin", "common"]);
    const { sidebarCollapsed, toggleSidebar } = useUiStore();
    const { user, profile } = useAuth();
    const handleLogout = useLogout();

    // Nguyên liệu member gõ lúc tạo recipe vào hàng đợi PENDING — badge là cách duy nhất
    // admin biết mà không phải mở từng recipe. Lấy 1 row chỉ để đọc `totalElements`.
    const { data: pendingIngredients } = useQuery({
        queryKey: ["admin-ingredients-pending-count"],
        queryFn: () => countAdminIngredients("PENDING"),
        staleTime: 60_000,
    });

    return (
        <div className="min-h-screen bg-background">
            {/* Top header */}
            <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-chrome px-4 text-white">
                <div className="flex items-center gap-3">
                    <Button variant="onBrandGhost" size="icon" aria-label={t("dashboard.nav.toggleSidebar")} onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-white">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                            <Leaf className="h-5 w-5 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">VEGALIFE</span>
                        <span className="hidden rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white sm:inline">
                            {t("dashboard.adminLabel")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <LanguageSwitcher onBrand />
                    <span className="hidden text-sm text-white/70 sm:block">{t("dashboard.adminLabel")}</span>
                    <Button
                        variant="onBrandGhost"
                        size="icon"
                        aria-label={t("common:logout")}
                        onClick={() => void handleLogout(t("common:logoutSuccess"))}
                    >
                        <LogOut className="h-5 w-5 text-white/80" />
                    </Button>
                    <Link to="/admin/profile" aria-label={t("dashboard.nav.profile")} className="rounded-full transition hover:opacity-80">
                        <Avatar name={user?.username} src={profile?.avatarUrl} size="md" />
                    </Link>
                </div>
            </header>

            {/* Mobile overlay */}
            {!sidebarCollapsed && (
                <div className="fixed inset-0 top-16 z-10 bg-black/20 backdrop-blur-sm lg:hidden" aria-hidden="true" onClick={toggleSidebar} />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed bottom-0 left-0 top-16 z-20 w-64 overflow-y-auto border-r border-border bg-card transition-all duration-200",
                    sidebarCollapsed && "-translate-x-full lg:w-20 lg:translate-x-0",
                )}
            >
                <nav aria-label={t("dashboard.nav.label")} className="p-3">
                    <ul className="space-y-1">
                        {navItems.map(({ to, labelKey, icon: Icon, ready }) => {
                            const label = t(`dashboard.nav.${labelKey}`);
                            return (
                                <li key={to}>
                                    {ready ? (
                                        <NavLink
                                            to={to}
                                            title={label}
                                            className={({ isActive }) =>
                                                cn(
                                                    "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-vegan-green text-white shadow-sm"
                                                        : "text-muted-foreground hover:bg-vegan-green-light hover:text-vegan-green",
                                                )
                                            }
                                        >
                                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            <span className={cn("flex-1", sidebarCollapsed && "lg:hidden")}>{label}</span>
                                            {to === "/admin/ingredients" && !!pendingIngredients && pendingIngredients > 0 && (
                                                <Badge variant="amber" size="sm" className={cn(sidebarCollapsed && "lg:hidden")}>
                                                    {pendingIngredients}
                                                </Badge>
                                            )}
                                        </NavLink>
                                    ) : (
                                        <span
                                            aria-disabled="true"
                                            title={t("dashboard.nav.comingSoon")}
                                            className="flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground opacity-50"
                                        >
                                            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Main content */}
            <main className={cn("pt-16 transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-20" : "lg:pl-64")}>
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
