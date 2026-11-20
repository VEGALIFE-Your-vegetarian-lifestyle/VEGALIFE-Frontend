import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessageSquare, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { useAcquirePlan, useSubscriptionHistory } from "@/features/subscription/useBilling";
import { useAiChat } from "./useAiChat";
import { useSubscription } from "./useSubscription";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { ChatPanel } from "./ChatPanel";
import { DishPicker } from "./DishPicker";
import type { Dish } from "@/features/recipes/types";

/**
 * AI Nutrition Assistant — V48 Request Allowance Release
 * POST /api/ai/messages, GET /api/ai/conversations[/{id}], GET /api/subscriptions/me.
 */
export default function AiNutritionPage() {
    const { t } = useTranslation("aiNutrition");
    const { t: tSub } = useTranslation("subscription");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Mọi endpoint AI đều cần JWT → khách chưa đăng nhập thì đừng gọi.
    const chat = useAiChat(isAuthenticated);
    const subscription = useSubscription(isAuthenticated);
    const acquirePlan = useAcquirePlan();
    // `/subscriptions/me` chỉ trả `remainingUsage` → biết đã mua gói hay chưa phải xem history.
    const history = useSubscriptionHistory(0, isAuthenticated);

    // V48: Số lượt hỏi còn lại là một con số duy nhất không hết hạn
    const remainingCount = chat.usage?.remainingUsage ?? subscription.data?.remainingUsage ?? 0;

    // ponytail: chỉ soi trang history đầu (10 row) — lần mua luôn là row mới nhất,
    // trừ khi user claim free >10 lần sau khi mua. Nâng lên `size` lớn hơn nếu cần.
    const isPaid = history.data?.content.some(
        (item) => item.source === "PURCHASE" && item.status === "succeeded",
    ) ?? false;

    const requireLogin = () => navigate("/login");

    const ask = (text: string) => {
        if (isAuthenticated) void chat.send(text);
        else requireLogin();
    };

    const handleClaimFree = () => {
        if (!isAuthenticated) {
            requireLogin();
            return;
        }
        acquirePlan.mutate("FREE", {
            onSuccess: (data) => {
                if (data.action === "CLAIMED") {
                    toast.success(tSub("toast.claimed"));
                }
            },
            onError: (error: unknown) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    toast.info(tSub("toast.alreadyClaimed"));
                } else {
                    toast.error(getApiErrorMessage(error, tSub("toast.buyFailed")));
                }
            },
        });
    };

    /**
     * Gửi kèm danh sách món đã chọn. AI chỉ đọc text nên tên món là đủ; `dishId` bỏ đi cho
     * prompt gọn (đánh đổi: không còn map ngược kết quả chat sang `/meal-plan`).
     */
    const askWithDishes = (dishes: Dish[]) => {
        const lines = dishes.map((dish) => `- ${dish.name}`).join("\n");
        ask(t("dishPicker.prompt", { dishes: lines }));
    };

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-3xl font-semibold text-dark">{t("title")}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{t("scopeNote")}</p>
                </div>
                {isAuthenticated && subscription.data ? (
                    <span className="flex items-center gap-2 rounded-full bg-vegan-green-light px-3.5 py-1.5 text-xs font-semibold text-vegan-green">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {isPaid
                            ? t("chat.quotaLeft", { count: remainingCount })
                            : `${tSub("plans.free")} · ${t("chat.quotaLeft", { count: remainingCount })}`}
                    </span>
                ) : (
                    !isAuthenticated && (
                        <span className="rounded-full bg-amber-soft px-3.5 py-1.5 text-xs font-semibold text-amber-strong">
                            {t("chat.signInQuota")}
                        </span>
                    )
                )}
            </header>

            {/* V48: Nhắc nhở nhận 5 câu hỏi miễn phí khi tài khoản có số dư 0 */}
            {isAuthenticated && subscription.data && remainingCount === 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-vegan-green/30 bg-vegan-green/5 p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-vegan-green text-white">
                            <Sparkles className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-dark">{t("claimBanner.title")}</p>
                            <p className="text-xs text-muted-foreground">{t("claimBanner.desc")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            disabled={acquirePlan.isPending}
                            onClick={handleClaimFree}
                        >
                            {acquirePlan.isPending ? tSub("plans.buying") : t("claimBanner.claimBtn")}
                        </Button>
                        <Link to="/account/subscription">
                            <Button variant="outline" size="sm">
                                {t("claimBanner.buyBtn")}
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <ChatPanel chat={chat} onRequireLogin={requireLogin} />

                <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                    {/* GET /api/dishes cần JWT — chỉ hiện khi đã đăng nhập. */}
                    {isAuthenticated && <DishPicker onAsk={askWithDishes} disabled={chat.isSending} />}

                    {/* Hội thoại đã lưu — GET /api/ai/conversations */}
                    {isAuthenticated && (
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="flex items-center gap-2 font-bold text-dark">
                                    <MessageSquare className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                    {t("chat.historyTitle")}
                                </h2>
                                <Button variant="ghost" size="iconSm" onClick={chat.newConversation} aria-label={t("chat.newChat")}>
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                </Button>
                            </div>
                            {chat.conversations.length === 0 ? (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    {chat.conversationsLoading ? t("chat.loadingHistory") : t("chat.emptyHistory")}
                                </p>
                            ) : (
                                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                                    {chat.conversations.map((conversation) => (
                                        <li key={conversation.id}>
                                            <button
                                                type="button"
                                                onClick={() => chat.selectConversation(conversation.id)}
                                                disabled={chat.isSending}
                                                className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-muted-bg disabled:opacity-50"
                                            >
                                                <p className="truncate text-xs font-semibold text-dark">
                                                    {conversation.title || t("chat.untitledConversation")}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatDateLocale(conversation.updatedAt)}
                                                </p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    )}

                </aside>
            </div>
        </div>
    );
}
