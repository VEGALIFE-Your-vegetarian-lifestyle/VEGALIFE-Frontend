import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeStep } from "./schema";

interface StepEditorProps {
    steps: RecipeStep[];
    /** Lỗi cấp mảng của Yup (`errors.steps[index]`) — mỗi ô tự hiện lỗi của mình. */
    errors?: Array<string | undefined>;
    onChange: (index: number, field: keyof RecipeStep, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onMove: (index: number, delta: number) => void;
}

/**
 * Danh sách bước nấu: **mỗi bước một ô riêng** (số thứ tự + tiêu đề + thân bài).
 * Gộp lại thành một chuỗi `instructions` khi gửi — xem `joinSteps` trong `payload.ts`.
 */
export function StepEditor({ steps, errors, onChange, onAdd, onRemove, onMove }: StepEditorProps) {
    const { t } = useTranslation("recipe");

    return (
        <div className="space-y-3">
            {steps.map((step, index) => {
                const error = errors?.[index];

                return (
                    <div key={index} className="rounded-2xl border border-border bg-surface p-4">
                        <div className="mb-2 flex items-center gap-3 rounded-xl bg-muted p-2">
                            <span
                                className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-vegan-green text-xs font-bold text-white"
                                aria-hidden="true"
                            >
                                {index + 1}
                            </span>
                            <label htmlFor={`step-title-${index}`} className="sr-only">
                                {t("field.stepTitle", { step: index + 1 })}
                            </label>
                            <Input
                                id={`step-title-${index}`}
                                value={step.title}
                                placeholder={t("placeholder.stepTitle")}
                                className="flex-1 border-transparent bg-surface px-3 font-semibold shadow-none focus-visible:ring-0"
                                onChange={(event) => onChange(index, "title", event.target.value)}
                            />

                            {/* BE nhận thứ tự theo vị trí trong chuỗi → đổi thứ tự bằng nút, không kéo thả. */}
                            <div className="flex flex-none items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="iconSm"
                                    aria-label={t("steps.moveUp")}
                                    disabled={index === 0}
                                    onClick={() => onMove(index, -1)}
                                >
                                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="iconSm"
                                    aria-label={t("steps.moveDown")}
                                    disabled={index === steps.length - 1}
                                    onClick={() => onMove(index, 1)}
                                >
                                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="iconSm"
                                    className="text-muted-foreground hover:text-destructive"
                                    aria-label={t("steps.remove")}
                                    disabled={steps.length <= 1}
                                    onClick={() => onRemove(index)}
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </div>
                        </div>

                        <label htmlFor={`step-body-${index}`} className="sr-only">
                            {t("field.stepBody", { step: index + 1 })}
                        </label>
                        <Textarea
                            id={`step-body-${index}`}
                            rows={3}
                            className="mt-2 min-h-[88px] border-transparent bg-transparent px-0 text-muted-foreground shadow-none focus-visible:ring-0"
                            value={step.body}
                            placeholder={t("placeholder.stepBody")}
                            aria-invalid={Boolean(error)}
                            onChange={(event) => onChange(index, "body", event.target.value)}
                        />
                        {error && (
                            <p role="alert" className="text-sm text-destructive">
                                {error}
                            </p>
                        )}
                    </div>
                );
            })}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <Button type="button" variant="soft" size="sm" shape="pill" onClick={onAdd}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("steps.add")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("steps.hint")}</p>
            </div>
        </div>
    );
}
