import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Calculator, ChefHat, Leaf, RefreshCw, RotateCcw, Send, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/utils/apiError";
import { MAX_MESSAGE_LENGTH, type AiChatMessage } from "@/hooks/useAiChat";

/** Icon + số thứ tự cho 4 lĩnh vực, khớp mockup. */
const DOMAINS = [
    { key: "macros", icon: Sprout },
    { key: "swaps", icon: RefreshCw },
    { key: "bmi", icon: Calculator },
    { key: "recipes", icon: ChefHat },
] as const;

interface ChatPanelProps {
    messages: AiChatMessage[];
    isLoadingHistory: boolean;
    historyError: unknown;
    onRetryHistory: () => void;
    isSending: boolean;
    sendError: unknown;
    onSend: (text: string) => boolean;
    onReset: () => void;
    greeting: string;
    userInitials: string;
    quickPrompts: string[];
}

function timeLabel(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Khung chat (nhóm 24). Props do `AiNutritionPage` truyền xuống vì trang còn
 * dùng chung hook với sidebar hội thoại.
 */
export function ChatPanel({
    messages,
    isLoadingHistory,
    historyError,
    onRetryHistory,
    isSending,
    sendError,
    onSend,
    onReset,
    greeting,
    userInitials,
    quickPrompts,
}: ChatPanelProps) {
    const { t } = useTranslation("aiNutrition");
    const [draft, setDraft] = useState("");
    const logRef = useRef<HTMLDivElement>(null);

    // Cuộn xuống đáy mỗi khi có tin mới hoặc đang chờ trả lời.
    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, isSending]);

    const submit = (text: string) => {
        if (onSend(text)) setDraft("");
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        submit(draft);
    };

    const trimmedLength = draft.trim().length;
    const canSend = trimmedLength > 0 && trimmedLength <= MAX_MESSAGE_LENGTH && !isSending;

    return (
        <section className="flex flex-col rounded-2xl border border-border bg-card" aria-labelledby="chat-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-vegan-green text-white">
                        <Leaf className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 id="chat-heading" className="font-bold text-dark">
                            {t("chat.modelName")}
                        </h2>
                        <p className="text-xs text-muted-foreground">{t("chat.modelDetail")}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onReset} disabled={isSending}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {t("chat.resetContext")}
                </Button>
            </div>

            <div
                ref={logRef}
                className="max-h-[560px] min-h-[420px] flex-1 space-y-4 overflow-y-auto p-5"
                aria-live="polite"
                aria-busy={isSending}
            >
                {/* Lời chào + gợi ý nhanh — chỉ hiện khi hội thoại thật sự trống. */}
                {messages.length === 0 && !isLoadingHistory && !historyError && (
                    <div className="flex gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                            <Leaf className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-muted-bg p-4">
                            <p className="text-sm font-semibold text-dark">{t("chat.assistantName")}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{greeting}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {DOMAINS.map(({ key, icon: Icon }, index) => (
                                    <div
                                        key={key}
                                        className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
                                    >
                                        <span className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-lavender text-lavender-strong">
                                            <Icon className="h-4 w-4" aria-hidden="true" />
                                            <span
                                                aria-hidden="true"
                                                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-vegan-green text-[9px] font-bold text-white"
                                            >
                                                {index + 1}
                                            </span>
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-dark">
                                                <span className="sr-only">{t("chat.domainLabel", { index: index + 1 })}: </span>
                                                {t(`chat.domains.${key}`)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">{t(`chat.domains.${key}Detail`)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("chat.quickStart")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {quickPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        disabled={isSending}
                                        onClick={() => submit(prompt)}
                                        className="rounded-full border border-border bg-surface px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isLoadingHistory && (
                    <div className="space-y-3" aria-busy="true">
                        <Skeleton className="h-16 w-2/3 rounded-2xl" />
                        <Skeleton className="ml-auto h-16 w-1/2 rounded-2xl" />
                    </div>
                )}

                {/* Lỗi nạp history chỉ chặn khung chat — sidebar vẫn chọn được hội thoại khác. */}
                {!!historyError && !isLoadingHistory && (
                    <div className="rounded-2xl border border-danger bg-danger-soft p-4">
                        <p role="alert" className="flex items-start gap-2 text-sm text-danger">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            {getApiErrorMessage(historyError, t("history.loadError"))}
                        </p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={onRetryHistory}>
                            {t("common:errorState.retry")}
                        </Button>
                    </div>
                )}

                {messages.map((message) =>
                    message.role === "user" ? (
                        <div key={message.id} className="flex justify-end gap-3">
                            <div className="max-w-xl rounded-2xl rounded-tr-sm bg-vegan-green p-4 text-white">
                                <p className="text-xs font-semibold opacity-90">{t("chat.you")}</p>
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.content}</p>
                                <p className="mt-1 text-right text-[10px] opacity-75">{timeLabel(message.createdAt)}</p>
                            </div>
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-xs font-bold text-vegan-green">
                                {userInitials}
                            </span>
                        </div>
                    ) : (
                        <div key={message.id} className="flex gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                                <Leaf className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-muted-bg p-4">
                                <p className="text-sm font-semibold text-dark">{t("chat.assistantName")}</p>
                                {/* Nội dung là text thuần — không dùng dangerouslySetInnerHTML. */}
                                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                    {message.content}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">{timeLabel(message.createdAt)}</p>
                            </div>
                        </div>
                    ),
                )}

                {isSending && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        {t("chat.pendingReply")}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border p-4">
                {!!sendError && (
                    <p
                        role="alert"
                        className="mb-3 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2 text-xs text-danger"
                    >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        {/* Lỗi 429 kèm Retry-After: backend trả sẵn câu giải thích trong `message`. */}
                        {getApiErrorMessage(sendError, t("chat.error"))}
                    </p>
                )}

                <div className="flex items-end gap-2">
                    <label className="sr-only" htmlFor="ai-chat-input">
                        {t("chat.placeholder")}
                    </label>
                    <Textarea
                        id="ai-chat-input"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            // Enter gửi, Shift+Enter xuống dòng.
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                submit(draft);
                            }
                        }}
                        maxLength={MAX_MESSAGE_LENGTH}
                        rows={2}
                        disabled={isSending}
                        placeholder={t("chat.placeholder")}
                        className="min-h-0 rounded-2xl"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-full"
                        disabled={!canSend}
                        aria-label={t("chat.send")}
                    >
                        <Send className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("chat.supported")}
                    {(t("chat.supportedTags", { returnObjects: true }) as unknown as string[]).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted-bg px-2 py-0.5 normal-case tracking-normal">
                            {tag}
                        </span>
                    ))}
                    <span className="ml-auto normal-case tracking-normal">
                        {t("chat.charCount", { used: trimmedLength, max: MAX_MESSAGE_LENGTH })}
                    </span>
                </div>
            </form>
        </section>
    );
}