import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Archive, FileText, Tags, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { getDashboardStats } from "@/services/dashboardService";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: number;
    description: string;
    icon: React.ElementType;
    colorClass: string;
}

function MetricCard({ title, value, description, icon: Icon, colorClass }: MetricCardProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="mt-1 text-3xl font-bold text-dark">{value.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", colorClass)}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}

function QuickLink({ to, label, icon: Icon, badge }: { to: string; label: string; icon: React.ElementType; badge?: string }) {
    return (
        <Link
            to={to}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-vegan-green-muted hover:bg-vegan-green-light"
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-dark">{label}</span>
            </div>
            {badge && <Badge variant="secondary">{badge}</Badge>}
        </Link>
    );
}

export default function AdminDashboardPage() {
    const { t } = useTranslation("admin");
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-dashboard-stats"],
        queryFn: getDashboardStats,
    });

    const metrics = stats ?? {
        totalCategories: 0,
        activeCategories: 0,
        softDeletedCategories: 0,
        associatedContent: 0,
    };

    return (
        <div>
            <PageHeader
                breadcrumb={["Admin", t("dashboard.title")]}
                title={t("dashboard.title")}
                description={t("dashboard.subtitle")}
            />

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        title={t("dashboard.totalCategories")}
                        value={metrics.totalCategories}
                        description="All categories in the system"
                        icon={Tags}
                        colorClass="bg-vegan-green-light text-vegan-green"
                    />
                    <MetricCard
                        title={t("dashboard.activeCategories")}
                        value={metrics.activeCategories}
                        description="Categories currently in use"
                        icon={Tags}
                        colorClass="bg-vegan-green-light text-vegan-green"
                    />
                    <MetricCard
                        title={t("dashboard.softDeletedCategories")}
                        value={metrics.softDeletedCategories}
                        description="Categories retired from use"
                        icon={Archive}
                        colorClass="bg-cream text-terracotta"
                    />
                    <MetricCard
                        title={t("dashboard.associatedContent")}
                        value={metrics.associatedContent}
                        description="Posts, recipes and videos linked"
                        icon={FileText}
                        colorClass="bg-muted-bg text-dark"
                    />
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-dark">{t("dashboard.quickManagement")}</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <QuickLink to="/admin/categories" label="Categories" icon={Tags} badge="Manage" />
                        <QuickLink to="/admin/posts" label="Posts" icon={FileText} />
                        <QuickLink to="/admin/videos" label="Videos" icon={Video} />
                        <QuickLink to="/admin/users" label="Users" icon={Users} />
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-bold text-dark">{t("dashboard.guideTitle")}</h2>
                    <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                        <li>Active categories can only be retired, not permanently deleted.</li>
                        <li>Soft-deleted categories can be restored or permanently removed.</li>
                        <li>Admins have access to all management sections.</li>
                    </ul>
                    <div className="mt-4">
                        <Link to="/admin/categories">
                            <Button>{t("dashboard.openCategoryManagement")}</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
