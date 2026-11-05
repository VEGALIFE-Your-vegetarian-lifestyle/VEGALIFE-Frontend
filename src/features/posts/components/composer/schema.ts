import * as Yup from "yup";
import type { TFunction } from "i18next";

/** Mockup screen05 đếm `48 / 90`. BE cho 255 nhưng 90 khớp thẻ feed preview (tiêu đề line-clamp). */
export const MAX_TITLE_LENGTH = 90;
export const MAX_SUMMARY_LENGTH = 180;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Schema validate của form soạn bài. Tách khỏi page để sửa rule không phải mở file 600 dòng. */
export function buildValidationSchema(t: TFunction) {
    return Yup.object({
        title: Yup.string()
            .trim()
            .required(t("validation:required"))
            .max(MAX_TITLE_LENGTH, t("validation:maxLength", { count: MAX_TITLE_LENGTH })),
        // `content` là object JSON — kiểm ở onSubmit, xem `handleSubmit`.
        featuredImageUrl: Yup.string()
            .url(t("posts.form.invalidUrl", { ns: "admin" }))
            .optional(),
        categoryIds: Yup.array().of(Yup.string().required()),
    });
}
