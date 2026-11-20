import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormField";
import { ImageUploader } from "@/components/common/ImageUploader";
import type { AdminDish } from "../../types";
import { buildDishUpdate, toDishForm, type DishFormValues } from "./dishForm";

function Form({
    dish,
    loading,
    onSubmit,
    onClose,
}: {
    dish: AdminDish | null;
    loading: boolean;
    onSubmit: (values: DishFormValues) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation(["admin", "common"]);
    const [values, setValues] = useState<DishFormValues>(() => toDishForm(dish));

    const set = (field: "name" | "description" | "cuisineType") => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!values.name.trim()) return;
        // Không đổi gì → đóng dialog, không gọi API.
        if (dish && !buildDishUpdate(toDishForm(dish), values)) return onClose();
        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label={t("dishes.form.nameLabel")} htmlFor="dish-name" required>
                <Input
                    id="dish-name"
                    value={values.name}
                    maxLength={255}
                    placeholder={t("dishes.form.namePlaceholder")}
                    onChange={set("name")}
                />
            </FormField>

            <FormField label={t("dishes.form.cuisineLabel")} htmlFor="dish-cuisine">
                <Input
                    id="dish-cuisine"
                    value={values.cuisineType}
                    maxLength={50}
                    placeholder={t("dishes.form.cuisinePlaceholder")}
                    onChange={set("cuisineType")}
                />
            </FormField>

            <FormField label={t("dishes.form.descriptionLabel")} htmlFor="dish-description">
                <Textarea
                    id="dish-description"
                    value={values.description}
                    maxLength={2000}
                    className="min-h-[88px]"
                    onChange={set("description")}
                />
            </FormField>

            <FormField label={t("dishes.form.imageLabel")} htmlFor="dish-image">
                <ImageUploader
                    value={values.imageUrl}
                    onChange={(imageUrl) => setValues((prev) => ({ ...prev, imageUrl }))}
                />
            </FormField>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    {t("common:cancel")}
                </Button>
                <Button type="submit" disabled={loading || !values.name.trim()}>
                    {dish ? t("dishes.form.submit") : t("dishes.form.create")}
                </Button>
            </div>
        </form>
    );
}

interface DishFormDialogProps {
    /** `null` = đóng. `{ dish: null }` = tạo mới. */
    state: { dish: AdminDish | null } | null;
    loading: boolean;
    /** Nhận giá trị thô — page tự chọn `buildDishCreate` / `buildDishUpdate` để biết POST hay PATCH. */
    onSubmit: (values: DishFormValues) => void;
    onClose: () => void;
}

export function DishFormDialog({ state, loading, onSubmit, onClose }: DishFormDialogProps) {
    const { t } = useTranslation("admin");
    const editing = state?.dish ?? null;

    return (
        <Dialog
            open={state !== null}
            onClose={onClose}
            title={t(editing ? "dishes.form.editTitle" : "dishes.form.createTitle")}
            description={editing ? t("dishes.form.editSubtitle", { name: editing.name }) : undefined}
            className="max-w-xl"
        >
            {state && (
                <Form
                    key={editing?.id ?? "new"}
                    dish={editing}
                    loading={loading}
                    onSubmit={onSubmit}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
}
