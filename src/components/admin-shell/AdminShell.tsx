import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, Leaf, LogOut, MapPin, Menu, MessageSquare, Tags, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/stores/uiStore";
import { logout } from "@/services/authService";

const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, ready: false },
    { to: "/admin/users", label: "Người dùng", icon: Users, ready: true },
    { to: "/admin/posts", label: "Bài viết", icon: FileText, ready: true },
    { to: "/admin/videos", label: "Video", icon: Video, ready: true },
    { to: "/admin/comments", label: "Bình luận", icon: MessageSquare, ready: false },
    { to: "/admin/categories", label: "Danh mục", icon: Tags, ready: true },
    { to: "/admin/locations", label: "Địa điểm", icon: MapPin, ready: false },
];

const itemClass = "flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-dark";

export function AdminShell() {
    const { sidebarCollapsed, toggleSidebar } = useUiStore();
    const { clearAuth } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" aria-label="Đóng/mở thanh điều hướng" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 text-dark">
                        <Leaf className="h-6 w-6 text-vegan-green" aria-hidden="true" />
                        <span className="text-lg font-semibold">VEGALIFE</span>
                        <span className="hidden rounded-full bg-lightgreen px-2 py-0.5 text-xs font-medium sm:inline">Admin</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-dark sm:block">Quản trị viên</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Đăng xuất"
                        onClick={async () => {
                            try {
                                await logout();
                            } catch {
                                // ignore
                            }
                            clearAuth();
                            navigate("/login", { replace: true });
                        }}
                    >
                        <LogOut className="h-5 w-5 text-dark" />
                    </Button>
                    <div
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-vegan-green text-sm font-medium text-white"
                    >
                        AD
                    </div>
                </div>
            </header>

            {!sidebarCollapsed && (
                <div className="fixed inset-0 top-16 z-10 bg-black/30 lg:hidden" aria-hidden="true" onClick={toggleSidebar} />
            )}

            <aside
                className={cn(
                    "fixed bottom-0 left-0 top-16 z-20 w-64 overflow-y-auto border-r border-border bg-card transition-all duration-200",
                    sidebarCollapsed && "-translate-x-full lg:w-16 lg:translate-x-0",
                )}
            >
                <nav aria-label="Điều hướng quản trị">
                    <ul className="space-y-1 p-3">
                        {navItems.map(({ to, label, icon: Icon, ready }) => (
                            <li key={to}>
                                {ready ? (
                                    <NavLink
                                        to={to}
                                        title={label}
                                        className={({ isActive }) => cn(itemClass, isActive ? "bg-vegan-green-light font-medium" : "hover:bg-accent")}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                        <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                                    </NavLink>
                                ) : (
                                    <span aria-disabled="true" title="Sắp có" className={cn(itemClass, "cursor-not-allowed opacity-50")}>
                                        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                        <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <main className={cn("pt-16 transition-[padding] duration-200", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
                <div className="px-4 py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}