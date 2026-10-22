import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    ArrowRight,
    Calculator,
    Info,
    Leaf,
    MessageSquare,
    Plus,
    ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAiChat } from "@/hooks/useAiChat";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { formatDateLocale } from "@/utils/formatDate";
import { ChatPanel } from "./ChatPanel";

const SWAPS = [
    { from: "1 Whole Egg (Baking)", to: "Flaxseed / Chia Gel", detail: "Mix 1 tbsp ground flax with 2.5 tbsp warm water. Rest 5 mins until viscous." },
    { from: "Heavy Dairy Cream", to: "Raw Cashew Cream", detail: "Blend 1 cup soaked raw cashews with 3/4 cup water until velvety." },
    { from: "Parmesan Cheese", to: "Nutri-Yeast & Walnuts", detail: "Pulse nutritional yeast, raw walnuts, garlic powder & sea salt." },
    { from: "Dairy Buttermilk", to: "Curdled Soy Milk", detail: "1 cup unsweetened soy milk + 1 tbsp apple cider vinegar. Wait 10 mins." },
];

const ACTIVITY_FACTORS: Record<string, number> = {
    sedentary: 0.8,
    light: 1.0,
    moderate: 1.2,
    active: 1.4,
};

/**
 * AI Nutrition Assistant — UI theo mockup, nối API thật:
 * POST /api/ai/messages, GET /api/ai/conversations[/{id}], GET /api/subscriptions/me.
 */
export default function AiNutritionPage() {
    const { t } = useTranslation("aiNutrition");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [height, setHeight] = useState("175");
    const [weight, setWeight] = useState("67");
    const [activity, setActivity] = useState("moderate");

    // Mọi endpoint AI đều cần JWT → khách chưa đăng nhập thì đừng gọi.
    const chat = useAiChat(isAuthenticated);
    const subscription = useSubscription(isAuthenticated);
    const quota = chat.usage ?? subscription.data?.usage;

    const requireLogin = () => navigate("/login");

    const ask = (text: string) => {
        if (isAuthenticated) void chat.send(text);
        else requireLogin();
    };

    const bmi = useMemo(() => {
        const h = Number(height) / 100;
        const w = Number(weight);
        if (!h || !w) return null;
        return w / (h * h);
    }, [height, weight]);

    const proteinTarget = useMemo(() => {
        const w = Number(weight);
        if (!w) return null;
        const factor = ACTIVITY_FACTORS[activity] ?? 1.0;
        const min = Math.round(w * factor);
        return { min, max: min + 12 };
    }, [weight, activity]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="lightgreen">
                                <Leaf className="h-3 w-3" aria-hidden="true" />
                                {t("badgeIntelligence")}
                            </Badge>
                            <Badge variant="outline">{t("badgeScope")}</Badge>
                            <Badge variant="destructive">{t("badgeDisclaimer")}</Badge>
                        </div>
                        <h1 className="mt-3 text-3xl font-extrabold text-dark">{t("title")}</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
                    </div>
                    {isAuthenticated && subscription.data && (
                        <div className="rounded-xl bg-vegan-green-light px-4 py-3">
                            <p className="flex items-center gap-2 text-sm font-bold text-vegan-green">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                {subscription.data.currentPlan.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {t("chat.quotaLeft", {
                                    used: quota?.used ?? 0,
                                    limit: quota?.limit ?? subscription.data.currentPlan.monthlyRequestLimit,
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <ChatPanel chat={chat} onRequireLogin={requireLogin} />

                <aside className="space-y-5">
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

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-bold text-dark">
                                <Calculator className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                {t("bmi.title")}
                            </h2>
                            <Badge variant="outline" size="sm">
                                {t("bmi.tool")}
                            </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("bmi.height")}</span>
                                <Input type="number" value={height} onChange={(event) => setHeight(event.target.value)} />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("bmi.weight")}</span>
                                <Input type="number" value={weight} onChange={(event) => setWeight(event.target.value)} />
                            </label>
                        </div>

                        <label className="mt-3 block">
                            <span className="mb-1 block text-xs font-medium text-muted-foreground">{t("bmi.activity")}</span>
                            <Select value={activity} onChange={(event) => setActivity(event.target.value)}>
                                {(["sedentary", "light", "moderate", "active"] as const).map((key) => (
                                    <option key={key} value={key}>
                                        {t(`bmi.activityOptions.${key}`)}
                                    </option>
                                ))}
                            </Select>
                        </label>

                        <div className="mt-4 rounded-xl bg-vegan-green-light p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{t("bmi.estimated")}</span>
                                <span className="text-xs font-semibold text-vegan-green">{t("bmi.healthyRange")} 18.5 – 24.9</span>
                            </div>
                            <p className="mt-1 text-3xl font-extrabold text-vegan-green">
                                {bmi ? bmi.toFixed(1) : t("bmi.empty")}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">{t("bmi.dailyTarget")}</p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="font-bold text-dark">
                                    {proteinTarget
                                        ? t("bmi.perDay", { value: `${proteinTarget.min} – ${proteinTarget.max}` })
                                        : t("bmi.empty")}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => ask(t("bmi.chatPlanPrompt"))}
                                >
                                    <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                                    {t("bmi.chatPlan")}
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-bold text-dark">
                                <Leaf className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                {t("swaps.title")}
                            </h2>
                            <Badge variant="lightgreen" size="sm">
                                {t("swaps.verified")}
                            </Badge>
                        </div>
                        <ul className="mt-4 space-y-3">
                            {SWAPS.map((swap) => (
                                <li key={swap.from} className="rounded-xl border border-border p-3">
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                        <span className="rounded-full bg-muted-bg px-2 py-0.5 text-dark">{swap.from}</span>
                                        <ArrowRight className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                                        <span className="rounded-full bg-vegan-green-light px-2 py-0.5 text-vegan-green">
                                            {swap.to}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[11px] text-muted-foreground">{swap.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="rounded-2xl border border-border bg-card p-5">
                        <h2 className="flex items-center gap-2 font-bold text-dark">
                            <ShieldCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                            {t("access.title")}
                        </h2>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">{t("access.guestInquiries")}</dt>
                                <dd className="font-semibold text-dark">
                                    {quota ? t("chat.quotaLeft", { used: quota.used, limit: quota.limit }) : t("access.guestLimit")}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">{t("access.currentStatus")}</dt>
                                <dd className="font-semibold text-vegan-green">
                                    {isAuthenticated ? t("access.activeMember") : t("access.guestLimit")}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">{t("access.sessionModel")}</dt>
                                <dd className="font-semibold text-dark">{t("access.guardrail")}</dd>
                            </div>
                        </dl>
                        <p
                            className={cn(
                                "mt-4 flex gap-2 rounded-xl bg-cream p-3 text-[11px] leading-relaxed text-dark",
                            )}
                        >
                            <Info className="h-4 w-4 flex-shrink-0 text-danger" aria-hidden="true" />
                            {t("access.notice")}
                        </p>
                    </section>
                </aside>
            </div>
        </div>
    );
}
