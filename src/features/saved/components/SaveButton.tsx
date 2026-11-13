import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useSavePost, useSaveRecipe } from "../useSaved";
import type { SavedRecipe } from "../types";

interface SaveButtonProps {
    className?: string;
    /** Chỉ icon — dùng trong card feed. */
    iconOnly?: boolean;
}

function SaveToggle({
    saved,
    pending,
    onClick,
    iconOnly = false,
    className,
}: SaveButtonProps & { saved: boolean; pending: boolean; onClick: () => void }) {
    const { t } = useTranslation("saved");

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            aria-pressed={saved}
            aria-label={saved ? t("unsave") : t("save")}
            title={saved ? t("unsave") : t("save")}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 sm:px-3",
                saved
                    ? "bg-vegan-green-light text-vegan-green"
                    : "text-muted-foreground hover:bg-muted-bg hover:text-dark",
                className,
            )}
        >
            <Bookmark className={cn("h-4 w-4 shrink-0", saved && "fill-current")} aria-hidden="true" />
            {!iconOnly && <span>{saved ? t("saved") : t("save")}</span>}
        </button>
    );
}

/** Nút lưu một bài viết — card feed, Post Detail, trang Saved (bấm lần nữa để bỏ lưu). */
export function SavePostButton({ postId, iconOnly, className }: SaveButtonProps & { postId: string }) {
    const { saved, toggle, isPending } = useSavePost(postId);
    return (
        <SaveToggle
            saved={saved}
            pending={isPending}
            onClick={toggle}
            iconOnly={iconOnly}
            className={className}
        />
    );
}

/** Nút lưu một công thức. Công thức của chính mình thì không hiện. */
export function SaveRecipeButton({
    recipe,
    iconOnly,
    className,
}: SaveButtonProps & { recipe: SavedRecipe | null }) {
    const { saved, toggle, isPending, own } = useSaveRecipe(recipe);

    if (!recipe || own) return null;

    return (
        <SaveToggle saved={saved} pending={isPending} onClick={toggle} iconOnly={iconOnly} className={className} />
    );
}
