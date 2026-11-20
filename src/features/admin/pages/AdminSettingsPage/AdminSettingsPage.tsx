import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/common/SectionCard";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/common/FormField";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { useUiStore } from "@/shared/ui/uiStore";
import { getAdminSettings, updateAdminSettings } from "../../settingsApi";
import type { SettingGroup, SettingItem } from "../../settingsApi";
import {
    SETTING_SPECS,
    validateSettings,
    type SettingError,
    type SettingSpec,
} from "../../settingsSchema";

/** Nhãn + icon từng nhóm; nhóm lạ của backend vẫn render, chỉ thiếu icon. */
const CATEGORY_ICON = {
    media: Megaphone,
    content: ShieldCheck,
    ai: Sparkles,
} as const;

/** Thứ tự hiển thị — response sắp theo alphabet (`ai` đứng đầu), không phải thứ tự mong muốn. */
const CATEGORY_ORDER = ["media", "content", "ai"] as const;

const QUERY_KEY = ["admin-settings"];

export default function AdminSettingsPage() {
    const { t } = useTranslation("admin");
    const language = useUiStore((state) => state.language);
    const queryClient = useQueryClient();

    /** Bản nháp theo key — chỉ chứa key người dùng đã gõ, phần còn lại đọc từ server. */
    const [draft, setDraft] = useState<Record<string, string>>({});

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getAdminSettings,
    });

    const saveMutation = useMutation({
        mutationFn: updateAdminSettings,
        onSuccess: (groups, variables) => {
            queryClient.setQueryData(QUERY_KEY, groups);
            // Bỏ nháp của đúng những key vừa lưu — giá trị giờ là server state.
            setDraft((previous) => {
                const next = { ...previous };
                for (const key of Object.keys(variables)) delete next[key];
                return next;
            });
            toast.success(t("settings.toast.saved"));
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("settings.toast.saveFailed")));
        },
    });

    const onError = (error: SettingError) => t(`settings.errors.${error.code}`, error);

    if (isError) {
        return (
            <div className="space-y-6">
                <PageHeader
                    breadcrumb={[t("dashboard.adminLabel"), t("settings.title")]}
                    title={t("settings.title")}
                    description={t("settings.description")}
                />
                <div className="rounded-2xl border border-border bg-card p-6">
                    <ErrorState onRetry={() => void refetch()} />
                </div>
            </div>
        );
    }

    const groups = [...(data ?? [])].sort(
        (a, b) =>
            CATEGORY_ORDER.indexOf(a.category as (typeof CATEGORY_ORDER)[number]) -
            CATEGORY_ORDER.indexOf(b.category as (typeof CATEGORY_ORDER)[number]),
    );
    const byCategory = new Map(groups.map((group) => [group.category, group]));

    const renderGroup = (category: string) => {
        const group = byCategory.get(category);
        if (!group) return null;
        return (
            <SettingGroupCard
                group={group}
                draft={draft}
                language={language}
                saving={saveMutation.isPending}
                onError={onError}
                onChange={(key, value) => setDraft((previous) => ({ ...previous, [key]: value }))}
                onReset={(keys) =>
                    setDraft((previous) => {
                        const next = { ...previous };
                        for (const key of keys) delete next[key];
                        return next;
                    })
                }
                onSave={(values) => saveMutation.mutate(values)}
            />
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                breadcrumb={[t("dashboard.adminLabel"), t("settings.title")]}
                title={t("settings.title")}
                description={t("settings.description")}
            />

            {isLoading || !data ? (
                /* Cột trái cao hơn (AI + Uploads) — khớp bố cục bên dưới. */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Skeleton className="h-20 rounded-2xl" />
                        <Skeleton className="h-80 rounded-2xl" />
                    </div>
                    <Skeleton className="h-56 rounded-2xl" />
                </div>
            ) : (
                /* Cột trái: AI (mảnh) + Uploads. Cột phải: Content Filter — mọi card co theo nội dung. */
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        {byCategory.has("ai") && (
                            <ToggleGroupCard
                                group={byCategory.get("ai")!}
                                saving={saveMutation.isPending}
                                onToggle={(key, value) => saveMutation.mutate({ [key]: value })}
                            />
                        )}
                        {renderGroup("media")}
                    </div>

                    {renderGroup("content")}
                </div>
            )}
        </div>
    );
}

/** Công tắc dùng chung — chưa có primitive nào trong `components/ui`. */
function Switch({
    checked,
    onChange,
    disabled,
    label,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-vegan-green" : "bg-muted-foreground/30",
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-[22px]" : "translate-x-0.5",
                )}
            />
        </button>
    );
}

interface SettingGroupCardProps {
    group: SettingGroup;
    draft: Record<string, string>;
    language: string;
    /** Một PATCH đang chạy — khoá mọi nút Save để không gửi chồng. */
    saving: boolean;
    onError: (error: SettingError) => string;
    onChange: (key: string, value: string) => void;
    /** Bỏ nháp của các key này — sau khi lưu hoặc khi bấm Huỷ. */
    onReset: (keys: string[]) => void;
    onSave: (values: Record<string, string>) => void;
}

function SettingGroupCard({ group, draft, language, saving, onError, onChange, onReset, onSave }: SettingGroupCardProps) {
    const { t } = useTranslation("admin");

    const saved = Object.fromEntries(group.items.map((item) => [item.key, item.value]));
    /**
     * Validate trên giá trị đã merge, không chỉ ô đang gõ: luật `reject < accept` so hai key,
     * validate lẻ sẽ bỏ sót khi admin chỉ sửa một vế.
     */
    const errors = validateSettings({ ...saved, ...draft });
    const values = { ...saved, ...draft };

    const changedKeys = group.items
        .map((item) => item.key)
        .filter((key) => draft[key] !== undefined && draft[key] !== saved[key]);
    const hasChanges = changedKeys.length > 0;
    const hasErrors = group.items.some((item) => errors[item.key]);

    const Icon = CATEGORY_ICON[group.category as keyof typeof CATEGORY_ICON];

    const handleSave = () => {
        const changes = Object.fromEntries(
            changedKeys.map((key) => {
                const spec = SETTING_SPECS[key];
                const raw = draft[key].trim();
                // Backend chỉ hiểu dấu chấm thập phân — bàn phím VN gõ "0,7" phải chuẩn hoá.
                return [key, spec?.type === "DECIMAL" ? raw.replace(",", ".") : raw];
            }),
        );
        onSave(changes);
    };

    return (
        <SectionCard
            title={t(`settings.categories.${group.category}.title`, { defaultValue: group.category })}
            subtitle={t(`settings.categories.${group.category}.description`, { defaultValue: "" })}
            eyebrow={
                Icon ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-vegan-green-light text-vegan-green">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                ) : null
            }
            inlineHeader
            aside={
                <Badge variant={hasChanges ? "amber" : "secondary"} size="sm">
                    {hasChanges
                        ? t("settings.unsaved", { count: changedKeys.length })
                        : t("settings.allSaved")}
                </Badge>
            }
        >
            <div className="space-y-3">
                {group.items.map((item) => (
                    <SettingField
                        key={item.key}
                        item={item}
                        value={values[item.key] ?? ""}
                        error={errors[item.key]}
                        language={language}
                        onError={onError}
                        onChange={(value) => onChange(item.key, value)}
                    />
                ))}

                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={!hasChanges || saving}
                        onClick={() => onReset(changedKeys)}
                    >
                        {t("settings.actions.reset")}
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2"
                        disabled={!hasChanges || hasErrors || saving}
                        onClick={handleSave}
                    >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {t("settings.actions.save")}
                    </Button>
                </div>
            </div>
        </SectionCard>
    );
}

interface ToggleGroupCardProps {
    group: SettingGroup;
    saving: boolean;
    onToggle: (key: string, value: string) => void;
}

/** Nhóm chỉ gồm cờ bật/tắt — mỗi lần gạt là một PATCH một key, không có draft/Save. */
function ToggleGroupCard({ group, saving, onToggle }: ToggleGroupCardProps) {
    const { t } = useTranslation("admin");
    const Icon = CATEGORY_ICON[group.category as keyof typeof CATEGORY_ICON];

    return (
        <section className="rounded-2xl border border-border bg-card px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        {Icon && (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vegan-green-light text-vegan-green">
                                <Icon className="h-4 w-4" aria-hidden="true" />
                            </span>
                        )}
                        <h2 className="text-base font-bold text-dark">
                            {t(`settings.categories.${group.category}.title`, { defaultValue: group.category })}
                        </h2>
                    </div>
                    {group.items.map((item) => (
                        <div key={item.key} className="mt-1.5 sm:ml-[42px]">
                            <p className="text-sm font-medium text-dark">
                                {t(`settings.keys.${item.key}.label`, { defaultValue: item.key })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t(`settings.keys.${item.key}.helper`, { defaultValue: "" })}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                    {group.items.map((item) => (
                        <Switch
                            key={item.key}
                            checked={item.value === "true"}
                            disabled={saving}
                            label={t(`settings.keys.${item.key}.label`, { defaultValue: item.key })}
                            onChange={(next) => onToggle(item.key, String(next))}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface SettingFieldProps {
    item: SettingItem;
    value: string;
    error?: SettingError;
    language: string;
    onError: (error: SettingError) => string;
    onChange: (value: string) => void;
}

function SettingField({ item, value, error, language, onError, onChange }: SettingFieldProps) {
    const { t } = useTranslation("admin");
    const spec: SettingSpec = SETTING_SPECS[item.key] ?? { type: "STRING_LIST" };
    const inputId = `setting-${item.key}`;
    const label = t(`settings.keys.${item.key}.label`, { defaultValue: item.key });
    const helper = t(`settings.keys.${item.key}.helper`, { defaultValue: "" });
    const errorMessage = error ? onError(error) : undefined;

    // Backend chỉ trả `updatedAt`, không trả ai sửa — chỉ hiện mốc thời gian.
    const meta = (
        <span className="text-[11px] text-muted-foreground">
            {t("settings.updatedAt", { time: formatDateLocale(item.updatedAt, language) })}
        </span>
    );

    if (spec.type === "BOOLEAN") {
        return (
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-dark">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
                </div>
                <Switch checked={value === "true"} label={label} onChange={(next) => onChange(String(next))} />
            </div>
        );
    }

    return (
        <FormField
            label={label}
            htmlFor={inputId}
            helper={helper || undefined}
            error={errorMessage}
            aside={meta}
        >
            <Input
                id={inputId}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={error ? true : undefined}
                inputMode={spec.type === "INT" || spec.type === "DECIMAL" ? "decimal" : "text"}
                placeholder={spec.type === "STRING_LIST" ? t("settings.listPlaceholder") : undefined}
            />
        </FormField>
    );
}
