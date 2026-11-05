import { Clock, Gauge, Leaf, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/shared/auth/authStore";
import type { RecipeFormValues } from "./schema";

interface RecipePreviewCardProps {
    values: RecipeFormValues;
}

/** Số chip nguyên liệu hiện trước khi gộp phần còn lại thành "+N". */
const MAX_CHIPS = 3;

/**
 * Thẻ xem trước dựng từ **chính giá trị form** — không có dữ liệu bịa.
 * Recipe không có ảnh bìa (endpoint không nhận) nên ảnh thay bằng nền gradient,
 * cùng cách xử lý thẻ địa điểm ở Home.
 */
export function RecipePreviewCard({ values }: RecipePreviewCardProps) {
    const { t } = useTranslation("recipe");
    const user = useAuthStore((state) => state.user);

    const name = values.name.trim();
    const dishName = values.dishName.trim();
    const totalMinutes = (Number(values.prepTimeMinutes) || 0) + (Number(values.cookTimeMinutes) || 0);
    const servings = Number(values.servings) || 0;
    const named = values.ingredients.filter((item) => item.name.trim());
    const shown = named.slice(0, MAX_CHIPS);
    const more = named.length - shown.length;

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-vegan-green to-vegan-green-active">
                <Leaf className="h-8 w-8 text-white/70" aria-hidden="true" />
                <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <Badge variant="glass" size="sm">
                        {t("standards.plantFirst.chip")}
                    </Badge>
                </div>
            </div>

            <div className="space-y-3 p-4">
                {dishName && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-vegan-green">{dishName}</p>
                )}
                <p
                    className={
                        name
                            ? "line-clamp-2 font-bold leading-snug text-dark"
                            : "text-sm text-muted-foreground"
                    }
                >
                    {name || t("placeholder.name")}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {totalMinutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {totalMinutes}m
                        </span>
                    )}
                    {values.difficulty && (
                        <span className="inline-flex items-center gap-1">
                            <Gauge className="h-3 w-3" aria-hidden="true" />
                            {t(`difficulty.${values.difficulty}`)}
                        </span>
                    )}
                    {servings > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {servings} {t("servings.unit")}
                        </span>
                    )}
                </div>

                {shown.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {shown.map((item, index) => (
                            <span
                                key={`${item.name}-${index}`}
                                className="rounded-full bg-muted-bg px-2 py-0.5 text-[10px] text-muted-foreground"
                            >
                                {item.name.trim()}
                            </span>
                        ))}
                        {more > 0 && (
                            <span className="rounded-full bg-muted-bg px-2 py-0.5 text-[10px] text-muted-foreground">
                                {t("preview.more", { count: more })}
                            </span>
                        )}
                    </div>
                )}

                {/* ponytail: BE chỉ trả `username`, không có tên hiển thị hay avatar — hiện những gì có. */}
                {user?.username && (
                    <div className="flex items-center gap-2 border-t border-border pt-3">
                        <Avatar name={user.username} size="sm" />
                        <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-dark">{user.username}</p>
                            <p className="text-[10px] text-muted-foreground">{t("preview.creator")}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
