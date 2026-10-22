import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
    Activity,
    AlertCircle,
    ChefHat,
    Calculator,
    Leaf,
    Loader2,
    Mic,
    Plus,
    RefreshCw,
    Send,
    Sparkles,
    Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import type { AiChat } from "@/hooks/useAiChat";
import { MAX_MESSAGE_LENGTH } from "@/types/ai";
import { formatDateLocale } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/apiError";

/** Icon + số thứ tự cho 4 lĩnh vực, khớp mockup. */
const DOMAINS = [
    { key: "macros", icon: Sprout },
    { key: "swaps", icon: RefreshCw },
    { key: "bmi", icon: Calculator },
    { key: "recipes", icon: ChefHat },
] as const;

/** Icon gợi ý xoay vòng theo thứ tự câu hỏi. */
const PROMPT_ICONS = [Sparkles, Leaf, Activity, ChefHat];

interface ChatPanelProps {
    chat: AiChat;
    onRequireLogin: () => void;
}

/** Khung chat: lời chào, lịch sử, ô nhập. Page lo bố cục và sidebar. */
export function ChatPanel({ chat, onRequireLogin }: ChatPanelProps) {
    const { t } = useTranslation("aiNutrition");
    const { user, isAuthenticated } = useAuth();
    const [draft, setDraft] = useState("");
    const logRef = useRef<HTMLDivElement>(null);

    const quickPrompts = t("quickPrompts", { returnObjects: true }) as unknown as string[];

    useEffect(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    }, [chat.messages.length, chat.pendingText, chat.error]);

    const ask = (text: string) => {
        if (!isAuthenticated) {
            onRequireLogin();
            return;
        }
        void chat.send(text);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!isAuthenticated) {
            onRequireLogin();
            return;
        }
        const text = draft;
        if (!text.trim()) return;
        setDraft("");
        // Giữ lại câu vừa gõ nếu gửi hỏng — người dùng khỏi phải nhớ lại.
        void chat.send(text).then((ok) => {
            if (!ok) setDraft(text);
        });
    };

    const errorText = chat.error ? getApiErrorMessage(chat.error, t("chat.error")) : null;
    const isQuotaError = (chat.error as { response?: { status?: number } } | null)?.response?.status === 429;
    const quotaResetDate = chat.usage?.windowEnd ?? chat.usage?.periodEnd;
    const showGreeting = chat.messages.length === 0 && !chat.historyLoading;

    return (
        <section className="flex flex-col rounded-2xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-vegan-green text-white">
                        <Leaf className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="font-bold text-dark">{t("chat.modelName")}</p>
                        <p className="text-xs text-muted-foreground">{t("chat.modelDetail")}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={chat.newConversation} disabled={chat.isSending}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("chat.newChat")}
                </Button>
            </div>

            <div ref={logRef} className="max-h-[560px] min-h-[420px] flex-1 space-y-4 overflow-y-auto p-5">
                {chat.historyLoading && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t("chat.loadingHistory")}
                    </p>
                )}

                {showGreeting && (
                    <div className="flex gap-3">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                            <Leaf className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-muted-bg p-4">
                            <p className="text-sm font-semibold text-dark">{t("chat.assistantName")}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {user?.username
                                    ? t("chat.greeting", { name: user.username })
                                    : t("chat.greetingGuest")}
                            </p>
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
                                                <span className="sr-only">
                                                    {t("chat.domainLabel", { index: index + 1 })}:{" "}
                                                </span>
                                                {t(`chat.domains.${key}`)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {t(`chat.domains.${key}Detail`)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t("chat.quickStart")}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {quickPrompts.map((prompt, index) => {
                                    const Icon = PROMPT_ICONS[index % PROMPT_ICONS.length];
                                    return (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => ask(prompt)}
                                            disabled={chat.isSending}
                                            className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green disabled:opacity-50"
                                        >
                                            <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                                            {prompt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {chat.messages.map((message) =>
                    message.role === "user" ? (
                        <div key={message.id} className="flex justify-end gap-3">
                            <div className="max-w-xl rounded-2xl rounded-tr-sm bg-vegan-green p-4 text-white">
                                <p className="text-xs font-semibold opacity-90">{t("chat.you")}</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm">{message.text}</p>
                                <p className="mt-1 text-right text-[10px] opacity-75">
                                    {formatDateLocale(message.createdAt)}
                                </p>
                            </div>
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-xs font-bold text-vegan-green">
                                {(user?.username ?? "ME").slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    ) : (
                        <div key={message.id} className="flex gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                                <Leaf className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="max-w-2xl rounded-2xl rounded-tl-sm bg-muted-bg p-4">
                                <p className="text-sm font-semibold text-dark">{t("chat.assistantName")}</p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    ),
                )}

                {chat.pendingText && (
                    <div className="flex justify-end gap-3">
                        <div className="max-w-xl rounded-2xl rounded-tr-sm bg-vegan-green/70 p-4 text-white">
                            <p className="text-xs font-semibold opacity-90">{t("chat.you")}</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{chat.pendingText}</p>
                        </div>
                    </div>
                )}

                {chat.isSending && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        {t("chat.pendingReply")}
                    </p>
                )}

                {errorText && (
                    <div className="flex flex-wrap items-start gap-2 rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                        <p className="flex-1">
                            {isQuotaError && quotaResetDate
                                ? t("chat.quotaExhausted", { date: formatDateLocale(quotaResetDate) })
                                : errorText}
                        </p>
                        {chat.failedText && (
                            <Button variant="outline" size="xs" onClick={chat.retry}>
                                {t("chat.retry")}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <form onSubmit={submit} className="border-t border-border p-4">
                {isAuthenticated ? (
                    <div className="flex gap-2">
                        <Input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder={t("chat.placeholder")}
                            aria-label={t("chat.placeholder")}
                            maxLength={MAX_MESSAGE_LENGTH}
                            disabled={chat.isSending}
                            className="rounded-full"
                            trailing={
                                <button
                                    type="button"
                                    disabled
                                    aria-label={t("chat.voiceInput")}
                                    title={t("chat.voiceInput")}
                                    className="rounded-full p-2 text-muted-foreground opacity-50"
                                >
                                    <Mic className="h-4 w-4" aria-hidden="true" />
                                </button>
                            }
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="rounded-full"
                            aria-label={t("chat.send")}
                            disabled={chat.isSending || !draft.trim()}
                        >
                            {chat.isSending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                ) : (
                    <Button type="button" block onClick={onRequireLogin}>
                        {t("chat.loginRequired")}
                    </Button>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("chat.supported")}
                    {(t("chat.supportedTags", { returnObjects: true }) as unknown as string[]).map((tag) => (
                        <span key={tag} className="rounded-full bg-muted-bg px-2 py-0.5 normal-case tracking-normal">
                            {tag}
                        </span>
                    ))}
                    <span className="ml-auto normal-case tracking-normal">
                        {t("chat.charCount", { used: draft.length, max: MAX_MESSAGE_LENGTH })}
                    </span>
                </div>
            </form>
        </section>
    );
}
