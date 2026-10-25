import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { SectionCard } from "@/components/common/SectionCard";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import type { UserProfile } from "@/shared/types/user";
import {
    DIETARY_LIST_KEYS,
    MAX_DIETARY_ITEMS,
    MAX_DIETARY_ITEM_LENGTH,
    MAX_HEALTH_GOAL_LENGTH,
    buildDietaryPatch,
    toDietaryValues,
    type DietaryListKey,
    type DietaryValues,
} from "./dietary";
import { TagInput } from "./TagInput";
import { useUpdateProfile } from "./useProfile";

/**
 * Gợi ý UI cho chip — KHÔNG phải enum: backend nhận chuỗi tự do cho cả 5 field,
 * nên người dùng luôn gõ được giá trị ngoài danh sách này.
 */
const SUGGESTIONS: Record<DietaryListKey, readonly string[]> = {
    preferences: ["Vegan", "Vegetarian", "Gluten-free", "Low-carb", "High-protein"],
    allergies: ["Peanuts", "Tree nuts", "Soy", "Sesame", "Shellfish"],
    dislikes: ["Cilantro", "Mushroom", "Olives", "Onion"],
    restrictions: ["No added sugar", "Low sodium", "No fried food", "No alcohol"],
};

const GOAL_SUGGESTIONS = ["Lose weight", "Maintain weight", "Gain muscle", "Improve digestion"];

/** Dị ứng tô màu cảnh báo; 3 nhóm còn lại màu xanh thương hiệu. */
const GROUP_TONE: Record<DietaryListKey, "green" | "alert"> = {
    preferences: "green",
    dislikes: "green",
    allergies: "alert",
    restrictions: "green",
};

interface DietaryPreferencesSectionProps {
    profile?: UserProfile;
}

export function DietaryPreferencesSection({ profile }: DietaryPreferencesSectionProps) {
    const { t } = useTranslation(["profile", "common"]);
    const updateMutation = useUpdateProfile();

    const saved = useMemo(() => toDietaryValues(profile), [profile]);
    const [values, setValues] = useState<DietaryValues>(saved);
    const lastSavedRef = useRef(saved);

    // Chỉ đồng bộ lại khi dữ liệu server đổi thật — tránh xoá nháp đang gõ.
    useEffect(() => {
        const changed = JSON.stringify(saved) !== JSON.stringify(lastSavedRef.current);
        if (!changed) return;
        lastSavedRef.current = saved;
        setValues(saved);
    }, [saved]);

    const patch = buildDietaryPatch(saved, values);
    const dirty = Object.keys(patch).length > 0;
    const goalTooLong = values.healthGoal.trim().length > MAX_HEALTH_GOAL_LENGTH;

    const setList = (key: DietaryListKey) => (next: string[]) =>
        setValues((current) => ({ ...current, [key]: next }));

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!dirty || goalTooLong || updateMutation.isPending) return;

        try {
            // Mutation ghi kết quả vào cache `["profile"]` → `saved` đổi → effect đồng bộ lại chip đã trim.
            await updateMutation.mutateAsync(patch);
            toast.success(t("dietary.saved"));
        } catch (error) {
            toast.error(getApiErrorMessage(error, t("dietary.saveFailed")));
        }
    };

    // Thứ tự hiển thị = thứ tự khai báo trong DIETARY_LIST_KEYS.
    const groups = DIETARY_LIST_KEYS.map((key) => ({
        key,
        label: t(`dietary.${key}.label`),
        hint: t(`dietary.${key}.hint`),
        placeholder: t(`dietary.${key}.placeholder`),
        tone: GROUP_TONE[key],
    }));

    return (
        <form onSubmit={handleSubmit} noValidate>
            <SectionCard
                eyebrow={t("dietary.eyebrow")}
                title={t("dietary.title")}
                aside={
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!dirty || goalTooLong || updateMutation.isPending}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {updateMutation.isPending ? t("saving") : t("save")}
                    </Button>
                }
                footnote={t("dietary.footnote")}
            >
                <div className="space-y-5">
                    {groups.map(({ key, label, hint, placeholder, tone }) => (
                        <FormField key={key} label={label} htmlFor={`dietary-${key}`} helper={hint}>
                            <TagInput
                                id={`dietary-${key}`}
                                label={label}
                                value={values[key]}
                                onChange={setList(key)}
                                placeholder={placeholder}
                                suggestions={SUGGESTIONS[key]}
                                maxItems={MAX_DIETARY_ITEMS}
                                maxLength={MAX_DIETARY_ITEM_LENGTH}
                                tone={tone}
                                disabled={updateMutation.isPending}
                            />
                        </FormField>
                    ))}

                    <FormField
                        label={t("dietary.healthGoal.label")}
                        htmlFor="dietary-healthGoal"
                        helper={t("dietary.healthGoal.hint")}
                        error={goalTooLong ? t("dietary.healthGoal.tooLong", { max: MAX_HEALTH_GOAL_LENGTH }) : undefined}
                        aside={
                            <span className="text-xs tabular-nums text-muted-foreground">
                                {values.healthGoal.trim().length} / {MAX_HEALTH_GOAL_LENGTH}
                            </span>
                        }
                    >
                        <Textarea
                            id="dietary-healthGoal"
                            className="min-h-[80px]"
                            value={values.healthGoal}
                            placeholder={t("dietary.healthGoal.placeholder")}
                            disabled={updateMutation.isPending}
                            aria-invalid={goalTooLong}
                            onChange={(event) =>
                                setValues((current) => ({ ...current, healthGoal: event.target.value }))
                            }
                        />
                    </FormField>

                    <div className="flex flex-wrap gap-1.5">
                        {GOAL_SUGGESTIONS.map((goal) => (
                            <button
                                key={goal}
                                type="button"
                                disabled={updateMutation.isPending}
                                onClick={() => setValues((current) => ({ ...current, healthGoal: goal }))}
                                className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-vegan-green hover:text-vegan-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vegan-green disabled:pointer-events-none disabled:opacity-50"
                            >
                                {goal}
                            </button>
                        ))}
                    </div>

                    {dirty && (
                        <div className="flex justify-end gap-2 border-t border-border pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setValues(saved)}
                                disabled={updateMutation.isPending}
                            >
                                <X className="mr-2 h-4 w-4" />
                                {t("dietary.cancel")}
                            </Button>
                            <Button type="submit" disabled={goalTooLong || updateMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                {updateMutation.isPending ? t("saving") : t("save")}
                            </Button>
                        </div>
                    )}
                </div>
            </SectionCard>
        </form>
    );
}
