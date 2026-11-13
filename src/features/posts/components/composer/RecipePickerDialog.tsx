import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAttachableRecipes } from "@/features/saved/useSaved";
import { recipeCardMeta, recipeMatches } from "./recipeMeta";

interface RecipePickerDialogProps {
    open: boolean;
    onClose: () => void;
    /** `recipeIds` đang gắn — tick sẵn khi mở. */
    selected: string[];
    onConfirm: (recipeIds: string[]) => void;
}

/**
 * Chọn công thức để gắn vào bài — **của mình + công thức đã lưu của người khác**
 * (`useAttachableRecipes`). Mọi nguồn đều trả mảng phẳng nên lọc hoàn toàn ở client.
 */
export function RecipePickerDialog({ open, onClose, selected, onConfirm }: RecipePickerDialogProps) {
    const { t } = useTranslation("admin");
    const [keyword, setKeyword] = useState("");
    const [picked, setPicked] = useState<string[]>(selected);

    const { items, isLoading } = useAttachableRecipes(open);

    // Recipe bị từ chối thì không gắn được vào bài.
    const available = useMemo(
        () => items.filter((recipe) => recipe.moderationStatus !== "REJECTED"),
        [items],
    );
    const visible = useMemo(
        () => available.filter((recipe) => recipeMatches(recipe, keyword)),
        [available, keyword],
    );

    const toggle = (id: string) =>
        setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

    return (
        <Dialog open={open} onClose={onClose} title={t("posts.composer.pickerTitle")}>
            <div className="relative">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder={t("posts.composer.pickerSearch")}
                    className="pl-9"
                />
            </div>

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                {isLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t("common:loading")}
                    </p>
                ) : visible.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("posts.composer.pickerEmpty")}</p>
                ) : (
                    visible.map((recipe) => {
                        const checked = picked.includes(recipe.id);
                        return (
                            <button
                                key={recipe.id}
                                type="button"
                                onClick={() => toggle(recipe.id)}
                                aria-pressed={checked}
                                className={
                                    checked
                                        ? "flex w-full items-center justify-between gap-3 rounded-xl border border-vegan-green bg-vegan-green-light px-3 py-2.5 text-left"
                                        : "flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-vegan-green-muted"
                                }
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-dark">
                                        {recipe.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {recipeCardMeta(t, recipe)}
                                    </span>
                                </span>
                                <span
                                    className={
                                        checked
                                            ? "h-4 w-4 flex-shrink-0 rounded-full bg-vegan-green"
                                            : "h-4 w-4 flex-shrink-0 rounded-full border border-border"
                                    }
                                    aria-hidden="true"
                                />
                            </button>
                        );
                    })
                )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        onConfirm(picked);
                        onClose();
                    }}
                >
                    {t("posts.composer.pickerConfirm")}
                </Button>
            </div>
        </Dialog>
    );
}
