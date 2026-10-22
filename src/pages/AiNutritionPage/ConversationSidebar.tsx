import { useTranslation } from "react-i18next";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateLocale } from "@/utils/formatDate";
import type { AiConversationSummary } from "@/types/ai";

interface ConversationSidebarProps {
    conversations: AiConversationSummary[] | undefined;
    isLoading: boolean;
    isError: boolean;
    /** Đang gửi tin: khoá chuyển hội thoại để trả lời không rơi nhầm chỗ. */
    isBusy: boolean;
    onRetry: () => void;
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
}

/** Danh sách hội thoại (#49) — backend đã sắp `updatedAt` giảm dần. */
export function ConversationSidebar({
    conversations,
    isLoading,
    isError,
    isBusy,
    onRetry,
    activeId,
    onSelect,
    onNew,
}: ConversationSidebarProps) {
    const { t } = useTranslation("aiNutrition");

    return (
        <section className="flex flex-col rounded-2xl border border-border bg-card" aria-labelledby="conversations-heading">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 id="conversations-heading" className="text-sm font-bold text-dark">
                    {t("history.title")}
                </h2>
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={onNew}
                    disabled={isBusy}
                    aria-label={t("history.new")}
                    title={t("history.new")}
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>

            <div className="max-h-[420px] flex-1 overflow-y-auto p-2">
                {isLoading && (
                    <div className="space-y-2 p-1" aria-busy="true">
                        {[0, 1, 2].map((row) => (
                            <Skeleton key={row} className="h-12 w-full rounded-xl" />
                        ))}
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">{t("history.loadError")}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
                            {t("common:errorState.retry")}
                        </Button>
                    </div>
                )}

                {!isLoading && !isError && conversations?.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">{t("history.empty")}</p>
                )}

                <ul className="space-y-1">
                    {conversations?.map((conversation) => {
                        const isActive = conversation.id === activeId;
                        return (
                            <li key={conversation.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(conversation.id)}
                                    disabled={isBusy}
                                    aria-current={isActive ? "true" : undefined}
                                    className={cn(
                                        "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left transition",
                                        isActive ? "bg-vegan-green-light" : "hover:bg-muted-bg",
                                        isBusy && "cursor-not-allowed opacity-50",
                                    )}
                                >
                                    <MessageSquare
                                        className={cn("mt-0.5 h-4 w-4 flex-shrink-0", isActive ? "text-vegan-green" : "text-muted-foreground")}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0">
                                        <span className={cn("block truncate text-sm", isActive ? "font-bold text-vegan-green" : "text-dark")}>
                                            {conversation.title}
                                        </span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            {formatDateLocale(conversation.updatedAt)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
