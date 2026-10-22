import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Search, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { getDishes } from "@/services/dishService";
import { getApiErrorMessage } from "@/utils/apiError";
import type { Dish } from "@/types/dish";

interface DishPickerDialogProps {
    open: boolean;
    title: string;
    onClose: () => void;
    onPick: (dish: Dish) => void;
}

/**
 * Chọn dish từ #39 — nguồn duy nhất của `dishId` hợp lệ. Không tự sinh id hay
 * tự tạo món: spec không có endpoint tạo dish trong luồng này.
 */
export function DishPickerDialog({ open, title, onClose, onPick }: DishPickerDialogProps) {
    const { t } = useTranslation("mealPlan");
    const [keyword, setKeyword] = useState("");
    const debouncedKeyword = useDebounce(keyword, 300);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["dishes", debouncedKeyword],
        queryFn: () => getDishes({ name: debouncedKeyword.trim() || undefined }),
        enabled: open,
    });

    return (
        <Dialog open={open} onClose={onClose} title={title} description={t("picker.description")}>
            <div className="relative">
                <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    className="pl-9"
                    autoFocus
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t("picker.searchPlaceholder")}
                    aria-label={t("picker.searchLabel")}
                />
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto">
                {isLoading && (
                    <div className="space-y-2" aria-busy="true">
                        {[0, 1, 2, 3].map((row) => (
                            <Skeleton key={row} className="h-12 w-full rounded-xl" />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="p-3 text-center">
                        <p role="alert" className="text-xs text-danger">
                            {getApiErrorMessage(error, t("picker.loadError"))}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
                            {t("common:errorState.retry")}
                        </Button>
                    </div>
                )}

                {!isLoading && !isError && data?.length === 0 && (
                    <div className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">{t("picker.empty")}</p>
                        {/* Thư viện rỗng thì chỉ có #38 sinh được dish mới. */}
                        <Link to="/recipes/new" className="mt-2 inline-block text-xs font-semibold text-vegan-green hover:underline">
                            {t("picker.createRecipe")}
                        </Link>
                    </div>
                )}

                <ul className="space-y-1">
                    {data?.map((dish) => (
                        <li key={dish.id}>
                            <button
                                type="button"
                                onClick={() => onPick(dish)}
                                className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green"
                            >
                                <UtensilsCrossed
                                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-vegan-green"
                                    aria-hidden="true"
                                />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-dark">{dish.name}</span>
                                    <span className="block truncate text-[11px] text-muted-foreground">
                                        {dish.cuisineType || t("picker.noCuisine")}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
            </div>
        </Dialog>
    );
}
