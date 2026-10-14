import { useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    Activity,
    ArrowRight,
    Calculator,
    ChefHat,
    Download,
    Info,
    Leaf,
    Mic,
    RefreshCw,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
    Sprout,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
    time: string;
}

/** Icon + số thứ tự cho 4 lĩnh vực, khớp mockup. */
const DOMAINS = [
    { key: "macros", icon: Sprout },
    { key: "swaps", icon: RefreshCw },
    { key: "bmi", icon: Calculator },
    { key: "recipes", icon: ChefHat },
] as const;

/** Icon gợi ý xoay vòng theo thứ tự câu hỏi. */
const PROMPT_ICONS = [Sparkles, Leaf, Activity, ChefHat];

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

function nowLabel() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * AI Nutrition Assistant — UI theo mockup.
 * ponytail: backend chưa có /api/ai/* (SRS nhóm 24) — trả lời là chuỗi tĩnh,
 * thay bằng POST /api/ai/messages khi endpoint sẵn sàng.
 */
export default function AiNutritionPage() {
    const { t } = useTranslation("aiNutrition");
    const { isAuthenticated, user } = useAuth();
    const developing = () => toast.info(t("common:featureDeveloping"));

    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const [height, setHeight] = useState("175");
    const [weight, setWeight] = useState("67");
    const [activity, setActivity] = useState("moderate");
    const logRef = useRef<HTMLDivElement>(null);
    // Bộ đếm thay `Date.now()` — react-hooks/purity chặn gọi hàm không thuần trong component.
    const messageSeq = useRef(0);

    const quickPrompts = t("quickPrompts", { returnObjects: true }) as unknown as string[];

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

    const send = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const userMessage: Message = { id: `u-${++messageSeq.current}`, role: "user", text: trimmed, time: nowLabel() };
        setMessages((prev) => [...prev, userMessage]);
        setDraft("");

        // ponytail: phản hồi tĩnh — thay bằng POST /api/ai/messages khi backend xong.
        window.setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: `a-${++messageSeq.current}`,
                    role: "assistant",
                    text: t("chat.error"),
                    time: nowLabel(),
                },
            ]);
            logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
        }, 600);

        logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        send(draft);
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
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
                    {isAuthenticated && (
                        <div className="rounded-xl bg-vegan-green-light px-4 py-3">
                            <p className="flex items-center gap-2 text-sm font-bold text-vegan-green">
                                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                {t("proMember")}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{t("unlimitedInquiries")}</p>
                        </div>
                    )}
                </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                {/* Chat panel */}
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
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                {t("chat.resetContext")}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={developing}>
                                <Download className="h-4 w-4" aria-hidden="true" />
                                {t("chat.exportLog")}
                            </Button>
                        </div>
                    </div>

                    <div ref={logRef} className="max-h-[560px] min-h-[420px] flex-1 space-y-4 overflow-y-auto p-5">
                        {/* Greeting */}
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
                                                    <span className="sr-only">{t("chat.domainLabel", { index: index + 1 })}: </span>
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
                                                onClick={() => send(prompt)}
                                                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-vegan-green-muted hover:text-vegan-green"
                                            >
                                                <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                                                {prompt}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Conversation */}
                        {messages.map((message) =>
                            message.role === "user" ? (
                                <div key={message.id} className="flex justify-end gap-3">
                                    <div className="max-w-xl rounded-2xl rounded-tr-sm bg-vegan-green p-4 text-white">
                                        <p className="text-xs font-semibold opacity-90">{t("chat.you")}</p>
                                        <p className="mt-1 text-sm">{message.text}</p>
                                        <p className="mt-1 text-right text-[10px] opacity-75">{message.time}</p>
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
                                        <p className="mt-1 text-sm text-muted-foreground">{message.text}</p>
                                        <p className="mt-1 text-[10px] text-muted-foreground">{message.time}</p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="border-t border-border p-4">
                        <div className="flex gap-2">
                            <Input
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={t("chat.placeholder")}
                                aria-label={t("chat.placeholder")}
                                className="rounded-full"
                                trailing={
                                    <button
                                        type="button"
                                        onClick={developing}
                                        aria-label={t("chat.voiceInput")}
                                        title={t("chat.voiceInput")}
                                        className="rounded-full p-2 text-muted-foreground transition hover:text-vegan-green"
                                    >
                                        <Mic className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                }
                            />
                            <Button type="submit" size="icon" className="rounded-full" aria-label={t("chat.send")}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("chat.supported")}
                            {(t("chat.supportedTags", { returnObjects: true }) as unknown as string[]).map((tag) => (
                                <span key={tag} className="rounded-full bg-muted-bg px-2 py-0.5 normal-case tracking-normal">
                                    {tag}
                                </span>
                            ))}
                            <span className="ml-auto flex items-center gap-1 normal-case tracking-normal">
                                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                                {t("chat.knowledgeBase")}
                            </span>
                        </div>
                    </form>
                </section>

                {/* Sidebar */}
                <aside className="space-y-5">
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
                                <Button variant="outline" size="sm" onClick={() => send(t("bmi.chatPlanPrompt"))}>
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
                                <dd className="font-semibold text-dark">{t("access.guestLimit")}</dd>
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
