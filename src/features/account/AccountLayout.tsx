import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChefHat, FileText, LayoutDashboard, LogOut, Sparkles, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { useProfile } from "@/features/profile/useProfile";
import { getMyPosts } from "@/features/posts/api";
import { getMyRecipes } from "@/features/recipes/api";
import { cn } from "@/shared/utils/cn";

const NAV = [
    { to: "/account", labelKey: "account.nav.overview", icon: LayoutDashboard, end: true },
    { to: "/my-posts", labelKey: "account.nav.posts", icon: FileText },
    { to: "/recipes", labelKey: "account.nav.recipes", icon: ChefHat },
    { to: "/meal-plan", labelKey: "account.nav.plan", icon: CalendarDays },
    { to: "/profile", labelKey: "account.nav.profile", icon: User },
    { to: "/account/subscription", labelKey: "common:subscription", icon: Sparkles },
] as const;

/** Khung tài khoản: rail trái cố định + `<Outlet/>`. Rail nằm ngoài outlet nên đổi mục không unmount, không fetch lại. */
export function AccountLayout() {
    const { t } = useTranslation(["profile", "common"]);
    const { user } = useAuth();
    const handleLogout = useLogout();

    // `useAuth().profile` luôn null (setProfile không được gọi) → đọc từ query, cache dùng chung.
    const { data: profile } = useProfile();

    // Rail cần số đếm; khoá trùng `AccountOverviewPage` nên hai chỗ dùng chung một request.
    const { data: postsPage } = useQuery({
        queryKey: ["my-posts", "summary"],
        queryFn: () => getMyPosts({ page: 1, size: 6 }),
    });
    const { data: recipes = [] } = useQuery({ queryKey: ["my-recipes"], queryFn: getMyRecipes });

    const counts = postsPage?.counts;
    const pendingRecipes = recipes.filter((recipe) => recipe.moderationStatus === "PENDING").length;

    const numbers = [
        { label: t("account.counts.published"), value: counts?.published },
        { label: t("account.counts.draft"), value: counts?.draft, accent: true },
        { label: t("account.counts.recipes"), value: recipes.length },
    ];

    return (
        <div className="mx-auto grid max-w-app grid-cols-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[238px_minmax(0,1fr)] lg:items-start lg:px-8">
            <aside className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card max-lg:flex-row max-lg:flex-wrap max-lg:items-center max-lg:gap-1.5 max-lg:p-2 lg:sticky lg:top-20">
                <div className="flex items-center gap-2.5 border-b border-border bg-vegan-green-subtle px-3.5 py-3.5 max-lg:hidden">
                    <Avatar name={user?.username} src={profile?.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1 max-lg:hidden">
                        <p className="truncate text-[13px] font-bold text-dark">{user?.username}</p>
                        <p className="truncate text-[10.5px] text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <dl className="flex border-b border-border py-3 max-lg:hidden">
                    {numbers.map((item) => (
                        <div key={item.label} className="min-w-0 flex-1 border-l border-border px-2.5 first:border-l-0">
                            <dd
                                className={cn(
                                    "font-display text-[17px] font-bold leading-none tabular-nums",
                                    item.accent ? "text-amber-strong" : "text-dark",
                                )}
                            >
                                {item.value === undefined ? "—" : item.value.toLocaleString()}
                            </dd>
                            <dt className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">{item.label}</dt>
                        </div>
                    ))}
                </dl>

                <p className="px-3.5 pb-1.5 pt-3.5 text-[9px] font-extrabold uppercase tracking-[0.11em] text-muted-foreground max-lg:hidden">
                    {t("account.caption")}
                </p>

                <nav className="flex flex-col gap-0.5 px-2 max-lg:min-w-0 max-lg:flex-1 max-lg:flex-row max-lg:overflow-x-auto max-lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-sm:flex-wrap">
                    {NAV.map((item) => {
                        const Icon = item.icon;
                        const badge =
                            item.to === "/my-posts"
                                ? counts?.all
                                : item.to === "/recipes" && pendingRecipes > 0
                                  ? pendingRecipes
                                  : undefined;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={"end" in item ? item.end : undefined}
                                className={({ isActive }) =>
                                    cn(
                                        "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold transition-colors",
                                        "max-sm:basis-[calc(50%-2px)] max-sm:justify-center",
                                        isActive
                                            ? "bg-vegan-green-subtle font-bold text-vegan-green before:absolute before:-left-2 before:top-1/2 before:h-[17px] before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-vegan-green max-lg:before:hidden"
                                            : "text-muted-foreground hover:bg-muted-bg hover:text-dark",
                                    )
                                }
                            >
                                <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                                <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                                {badge !== undefined && (
                                    <span
                                        className={cn(
                                            "ml-auto rounded-full px-1.5 py-px text-[9.5px] font-extrabold tabular-nums max-lg:ml-0.5",
                                            item.to === "/recipes"
                                                ? "bg-amber-soft text-amber-strong"
                                                : "bg-muted-bg text-muted-foreground",
                                        )}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="mt-3.5 border-t border-border px-2 py-2.5 max-lg:hidden">
                    <button
                        type="button"
                        onClick={() => void handleLogout(t("common:logoutSuccess"))}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger max-lg:hidden"
                    >
                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("common:logout")}
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-col gap-5">
                <Outlet />
            </div>
        </div>
    );
}
