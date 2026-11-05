import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, Leaf, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { useUiStore } from "@/shared/ui/uiStore";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navLinks = [
    { labelKey: "home", href: "/" },
    { labelKey: "explore", href: "/explore" },
    { labelKey: "nearby", href: "/nearby" },
    { labelKey: "aiNutrition", href: "/ai-nutrition" },
    { labelKey: "mealPlan", href: "/meal-plan" },
];

export function Navbar() {
    const { t } = useTranslation("common");
    const { isAuthenticated, isAdmin, user } = useAuth();
    // `useAuth().profile` luôn null — đọc từ query (cache dùng chung với trang Hồ sơ).
    const { data: profile } = useProfile(isAuthenticated);
    const doLogout = useLogout();
    const openComposer = useUiStore((state) => state.openComposer);
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
        if (isAuthenticated) openComposer();
        else navigate("/login");
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmed = keyword.trim();
        navigate(trimmed ? `/explore?q=${encodeURIComponent(trimmed)}` : "/explore");
    };

    return (
        /* `z-30`: bỏ `sticky` (header tĩnh theo yêu cầu thiết kế) nhưng vẫn phải nổi trên khối
           hero cũng `relative`, nếu không dropdown tài khoản bị vẽ đè. */
        <header className="chrome-field relative z-30 text-white">
            <div className="mx-auto flex h-16 max-w-app items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Link to="/" className="flex flex-shrink-0 items-center gap-2 text-white transition-colors hover:text-vegan-green-light">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
                        <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
                </Link>

                <nav className="hidden items-center gap-2 lg:flex">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.labelKey}
                            to={link.href}
                            end={link.href === "/"}
                            className={({ isActive }) =>
                                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                    isActive
                                        ? "bg-white/15 text-white"
                                        : "text-white/90 hover:bg-white/10 hover:text-white"
                                }`
                            }
                        >
                            {t(link.labelKey)}
                        </NavLink>
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
                            className="h-10 w-full rounded-full border border-transparent bg-white/95 pl-10 pr-4 text-sm text-dark placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        />
                    </div>
                </form>

                <div className="ml-auto flex flex-shrink-0 items-center gap-2 md:ml-0">
                    <div className="hidden md:block">
                        <LanguageSwitcher onBrand />
                    </div>

                    <Button variant="onBrand" shape="pill" onClick={handleCreatePost} className="hidden md:inline-flex">
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
                                className="flex items-center gap-1 rounded-full p-0.5 transition hover:bg-white/15"
                            >
                                <Avatar name={user?.username} src={profile?.avatarUrl} size="sm" />
                                <ChevronDown className="h-4 w-4 text-white/70" aria-hidden="true" />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 text-dark shadow-xl"
                                >
                                    <div className="border-b border-border px-4 py-2.5">
                                        <p className="truncate text-sm font-bold text-dark">{user?.username}</p>
                                        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                    <Link
                                        to="/account"
                                        role="menuitem"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2 text-sm text-dark hover:bg-accent"
                                    >
                                        {t("myAccount")}
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
                            <Button variant="onBrandGhost" onClick={() => navigate("/login")}>
                                {t("login")}
                            </Button>
                            <Button
                                variant="onBrandGhost"
                                className="border border-white/40"
                                onClick={() => navigate("/register")}
                            >
                                {t("register")}
                            </Button>
                        </div>
                    )}

                    <button
                        type="button"
                        className="rounded-md p-2 text-white md:hidden"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-white/15 bg-black/10 px-4 py-4 md:hidden">
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
                                className="h-10 w-full rounded-full border border-transparent bg-white/95 pl-10 pr-4 text-sm text-dark placeholder:text-muted-foreground"
                            />
                        </div>
                    </form>

                    <nav className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.labelKey}
                                to={link.href}
                                className="text-sm font-semibold text-white/90 hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                        <hr className="border-white/15" />
                        <Button
                            variant="onBrand"
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
                            <LanguageSwitcher onBrand />
                        </div>
                        {isAuthenticated ? (
                            <>
                                <Link to="/account" className="text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>
                                    {t("myAccount")}
                                </Link>
                                <button onClick={handleLogout} className="text-left text-sm font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline">
                                    {t("logout")}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>
                                    {t("login")}
                                </Link>
                                <Link to="/register" className="text-sm font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>
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
