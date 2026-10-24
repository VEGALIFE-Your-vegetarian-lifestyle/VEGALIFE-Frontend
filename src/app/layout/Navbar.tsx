import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Leaf, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navLinks = [
    { labelKey: "home", href: "/" },
    { labelKey: "explore", href: "/explore" },
    { labelKey: "nearby", href: "/nearby" },
    { labelKey: "aiNutrition", href: "/ai-nutrition" },
];

export function Navbar() {
    const { t } = useTranslation("common");
    const { isAuthenticated, isAdmin, user, profile } = useAuth();
    const doLogout = useLogout();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [keyword, setKeyword] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown tài khoản khi bấm ra ngoài.
    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const handleLogout = () => {
        setMenuOpen(false);
        void doLogout();
    };

    const handleCreatePost = () => {
        navigate(isAuthenticated ? "/posts/create" : "/login");
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = keyword.trim();
        navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex flex-shrink-0 items-center gap-2 text-dark transition-colors hover:text-vegan-green">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-vegan-green-light">
                        <Leaf className="h-5 w-5 text-vegan-green" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
                </Link>

                <nav className="hidden items-center gap-6 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.labelKey}
                            to={link.href}
                            className="whitespace-nowrap text-sm font-semibold text-muted-foreground transition-colors hover:text-vegan-green"
                        >
                            {t(link.labelKey)}
                        </Link>
                    ))}
                </nav>

                {/* Ô tìm kiếm nằm ngay trên navbar, theo mockup. */}
                <form onSubmit={handleSearch} className="ml-auto hidden min-w-0 flex-1 md:block md:max-w-xs" role="search">
                    <div className="relative">
                        <Search
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            placeholder={t("searchPlaceholder")}
                            aria-label={t("searchPlaceholder")}
                            className="h-10 w-full rounded-full border border-border bg-muted-bg pl-10 pr-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-vegan-green focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                        />
                    </div>
                </form>

                <div className="ml-auto flex flex-shrink-0 items-center gap-2 md:ml-0">
                    <div className="hidden md:block">
                        <LanguageSwitcher />
                    </div>

                    <Button variant="primary" shape="pill" onClick={handleCreatePost} className="hidden md:inline-flex">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {t("newPost")}
                    </Button>

                    {isAuthenticated ? (
                        <div className="relative hidden md:block" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                aria-haspopup="menu"
                                aria-expanded={menuOpen}
                                aria-label={t("accountMenu")}
                                className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-accent"
                            >
                                <Avatar name={user?.username} src={profile?.avatarUrl} size="sm" />
                                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
                                >
                                    <div className="border-b border-border px-4 py-2.5">
                                        <p className="truncate text-sm font-bold text-dark">{user?.username}</p>
                                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/my-posts"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                    >
                                        {t("myPosts")}
                                    </Link>
                                    <Link
                                        to="/meal-plan"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                    >
                                        {t("mealPlan")}
                                    </Link>
                                    <Link
                                        to="/recipes/create"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                    >
                                        {t("newRecipe")}
                                    </Link>
                                    <Link
                                        to="/profile"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                    >
                                        {t("profile")}
                                    </Link>
                                    {isAdmin && (
                                        <Link
                                            to="/admin/dashboard"
                                            role="menuitem"
                                            onClick={() => setMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                        >
                                            {t("admin")}
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                                    >
                                        <LogOut className="h-4 w-4" aria-hidden="true" />
                                        {t("logout")}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 md:flex">
                            <Button variant="ghost" onClick={() => navigate("/login")}>
                                {t("login")}
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/register")}>
                                {t("register")}
                            </Button>
                        </div>
                    )}

                    <button
                        type="button"
                        className="rounded-md p-2 text-dark md:hidden"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-border bg-card px-4 py-4 md:hidden">
                    <form onSubmit={handleSearch} className="mb-4" role="search">
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <input
                                type="search"
                                value={keyword}
                                onChange={(event) => setKeyword(event.target.value)}
                                placeholder={t("searchPlaceholder")}
                                aria-label={t("searchPlaceholder")}
                                className="h-10 w-full rounded-full border border-border bg-muted-bg pl-10 pr-4 text-sm text-dark"
                            />
                        </div>
                    </form>

                    <nav className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.labelKey}
                                to={link.href}
                                className="text-sm font-semibold text-muted-foreground hover:text-vegan-green"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                        <hr className="border-border" />
                        <Button
                            variant="primary"
                            shape="pill"
                            onClick={() => {
                                handleCreatePost();
                                setMobileMenuOpen(false);
                            }}
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t("newPost")}
                        </Button>
                        <div className="py-1">
                            <LanguageSwitcher />
                        </div>
                        {isAuthenticated ? (
                            <>
                                <Link to="/my-posts" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("myPosts")}
                                </Link>
                                <Link to="/profile" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("profile")}
                                </Link>
                                <Link to="/meal-plan" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("mealPlan")}
                                </Link>
                                <Link to="/recipes/create" className="text-sm font-semibold text-dark" onClick={() => setMobileMenuOpen(false)}>
                                    {t("newRecipe")}
                                </Link>
                                <button onClick={handleLogout} className="text-left text-sm font-semibold text-danger">
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
