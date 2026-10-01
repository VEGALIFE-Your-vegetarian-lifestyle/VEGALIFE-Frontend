import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Leaf, LogOut, Menu, PenLine, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Nearby", href: "/nearby" },
    { label: "Meal Plan", href: "/meal-plan" },
    { label: "AI Chatbot", href: "/ai-chatbot" },
];

export function Navbar() {
    const { t } = useTranslation("common");
    const { isAuthenticated, isAdmin, user, clearAuth } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // ignore
        }
        clearAuth();
        navigate("/", { replace: true });
    };

    const handleCreatePost = () => {
        if (isAuthenticated) {
            navigate("/posts/create");
        } else {
            navigate("/login");
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex items-center gap-2 text-dark transition-colors hover:text-vegan-green">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-vegan-green-light">
                        <Leaf className="h-5 w-5 text-vegan-green" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            to={link.href}
                            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-vegan-green"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    <LanguageSwitcher />
                    <button
                        type="button"
                        aria-label="Search"
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-vegan-green"
                    >
                        <Search className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Notifications"
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-vegan-green"
                    >
                        <Bell className="h-5 w-5" />
                    </button>

                    <Button variant="outline" onClick={handleCreatePost}>
                        <PenLine className="h-4 w-4" />
                        Tạo bài viết
                    </Button>

                    {isAuthenticated ? (
                        <div className="flex items-center gap-2">
                            <Link
                                to={isAdmin ? "/admin/dashboard" : "/profile"}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green"
                                title={user?.username}
                            >
                                <User className="h-5 w-5" />
                            </Link>
                            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t("logout")}>
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => navigate("/login")}>
                                {t("login")}
                            </Button>
                            <Button onClick={() => navigate("/register")}>{t("register")}</Button>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="rounded-md p-2 text-dark md:hidden"
                    onClick={() => setMobileMenuOpen((open) => !open)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-border bg-card px-4 py-4 md:hidden">
                    <nav className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="text-sm font-semibold text-muted-foreground hover:text-vegan-green"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="border-border" />
                        <Button variant="outline" onClick={() => { handleCreatePost(); setMobileMenuOpen(false); }}>
                            <PenLine className="h-4 w-4" />
                            Tạo bài viết
                        </Button>
                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("profile")}
                                </Link>
                                <button onClick={handleLogout} className="text-left text-sm font-semibold text-dark">
                                    {t("logout")}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("login")}
                                </Link>
                                <Link to="/register" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("register")}
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
