import * as Yup from "yup";
import type { TFunction } from "i18next";

export const MAX_TITLE_LENGTH = 255;
export const MAX_SUMMARY_LENGTH = 180;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Schema validate của form soạn bài. Tách khỏi page để sửa rule không phải mở file 600 dòng. */
export function buildValidationSchema(t: TFunction, isEditing: boolean) {
    return Yup.object({
        title: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_TITLE_LENGTH, t("validation:maxLength", { count: MAX_TITLE_LENGTH })),
        type: Yup.string()
            .oneOf(["blog", "video"] as const)
            .required(t("validation:required")),
        // `content` là object JSON — kiểm ở onSubmit, xem `handleSubmit`.
        featuredImageUrl: Yup.string()
            .url(t("posts.form.invalidUrl", { ns: "admin" }))
            .optional(),
        videoUrl: Yup.string().when("type", {
            is: "video",
            then: (schema) => schema.url(t("posts.form.invalidUrl", { ns: "admin" })).optional(),
            otherwise: (schema) => schema.notRequired(),
        }),
        categoryIds: Yup.array().of(Yup.string().required()),
    }).test("videoSource", t("posts.form.videoSourceRequired", { ns: "admin" }), (values) => {
        // Khi sửa, nguồn video đã có sẵn trên server — không bắt nhập lại.
        if (isEditing || values.type !== "video") return true;
        return Boolean(values.videoUrl?.trim());
    });
}
