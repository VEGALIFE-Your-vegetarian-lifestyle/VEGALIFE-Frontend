import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, LayoutDashboard, Leaf, LogOut, MapPin, Menu, MessageSquare, Tags, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/stores/uiStore";
import { logout } from "@/services/authService";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: true },
    { to: "/admin/users", label: "Users", icon: Users, ready: true },
    { to: "/admin/posts", label: "Posts", icon: FileText, ready: true },
    { to: "/admin/videos", label: "Videos", icon: Video, ready: true },
    { to: "/admin/comments", label: "Comments", icon: MessageSquare, ready: false },
    { to: "/admin/categories", label: "Categories", icon: Tags, ready: true },
    { to: "/admin/locations", label: "Locations", icon: MapPin, ready: false },
];

export function AdminShell() {
    const { t } = useTranslation("admin");
    const { sidebarCollapsed, toggleSidebar } = useUiStore();
    const { clearAuth } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Top header */}
            <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-dark">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-vegan-green-light">
                            <Leaf className="h-5 w-5 text-vegan-green" aria-hidden="true" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">VEGALIFE</span>
                        <span className="hidden rounded-full bg-vegan-green-light px-2 py-0.5 text-xs font-semibold text-vegan-green sm:inline">
                            {t("dashboard.adminLabel")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    <span className="hidden text-sm text-muted-foreground sm:block">{t("dashboard.adminLabel")}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Log out"
                        onClick={async () => {
                            clearAuth();
                            try {
                                await logout();
                                toast.success("Logout Successfully");
                            } catch {
                                // 401 means token already expired/revoked; logout still effective
                            }
                            navigate("/", { replace: true });
                        }}
                    >
                        <LogOut className="h-5 w-5 text-muted-foreground" />
                    </Button>
                    <div
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-vegan-green text-sm font-bold text-white"
                    >
                        AD
                    </div>
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
                <nav aria-label="Admin navigation" className="p-3">
                    <ul className="space-y-1">
                        {navItems.map(({ to, label, icon: Icon, ready }) => (
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
                                        <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                                    </NavLink>
                                ) : (
                                    <span
                                        aria-disabled="true"
                                        title="Coming soon"
                                        className="flex h-10 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground opacity-50"
                                    >
                                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                        <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                                    </span>
                                )}
                            </li>
                        ))}
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
