import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useFormik } from "formik";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Editor, JSONContent } from "@tiptap/react";
import { BadgeCheck, Check, Circle, CloudUpload, Leaf, Loader2, Plus, Save, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CategorySelect } from "@/components/common/CategorySelect";
import { ImageUploader } from "@/components/common/ImageUploader";
import { RichTextEditor } from "../editor/RichTextEditor";
import { EMPTY_DOC, isEditorEmpty, parseStoredContent, textToDoc } from "../editor/editorContent";
import { usePublicCategories } from "@/features/categories/usePublicCategories";
import { getMyRecipes } from "@/features/recipes/api";
import { attachPostRecipes, createPost, getPostDetail, updatePost } from "../../api";
import { confirmUpload, createUploadGrant, uploadFileToProvider } from "@/shared/api/media";
import { useUiStore } from "@/shared/ui/uiStore";
import { getApiErrorMessage } from "@/shared/utils/apiError";
import { cn } from "@/shared/utils/cn";
import { MAX_IMAGE_SIZE, MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH, buildValidationSchema } from "./schema";
import { buildContentPayload, buildPatch, type FormValues } from "./payload";
import { PostPreviewCard } from "./PostPreviewCard";
import { RecipePickerDialog } from "./RecipePickerDialog";

type SubmitIntent = "draft" | "publish";

/** Đếm từ của text thuần — dùng cho checklist "N words". */
function countWords(text: string): number {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Dialog soạn bài dùng chung cho tạo mới và sửa.
 *
 * Layout: một mặt phẳng duy nhất (tiêu đề → meta → editor → chip công thức),
 * chỉ vùng editor cuộn; rail phải giữ checklist + preview; footer giữ nút gửi.
 */
export function PostComposerDialog() {
    const composer = useUiStore((state) => state.composer);
    const closeComposer = useUiStore((state) => state.closeComposer);

    if (!composer) return null;

    // `key` đặt lại state form mỗi lần mở / đổi bài — không cần tự reset.
    return <Composer key={composer.postId ?? "new"} postId={composer.postId} onClose={closeComposer} />;
}

function Composer({ postId, onClose }: { postId: string | null; onClose: () => void }) {
    const { t } = useTranslation(["admin", "validation", "common", "post"]);
    const queryClient = useQueryClient();
    const isEditing = postId !== null;

    const intentRef = useRef<SubmitIntent>("draft");
    const editorRef = useRef<Editor | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { data: categoriesData, isLoading: isCategoriesLoading } = usePublicCategories({
        page: 0,
        size: 100,
        sort: "name,asc",
    });
    const categories = useMemo(
        () => (categoriesData?.content ?? []).map((category) => ({ id: category.id, name: category.name })),
        [categoriesData],
    );

    // Bài đang sửa — GET /api/posts/{id} trả mọi status (BR-POST-011), kể cả draft.
    const { data: existingPost } = useQuery({
        queryKey: ["post-detail", postId],
        queryFn: () => getPostDetail(postId as string),
        enabled: isEditing,
    });

    // Tên công thức đã gắn — cùng cache với RecipePickerDialog nên mở picker không gọi lại.
    const { data: myRecipes } = useQuery({
        queryKey: ["my-recipes"],
        queryFn: getMyRecipes,
        staleTime: 60_000,
    });

    const validationSchema = useMemo(() => buildValidationSchema(t), [t]);

    // POST /api/posts chỉ tạo draft; publish và gắn category/recipe phải gọi tiếp.
    const saveMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const publish = intentRef.current === "publish";
            const patch = buildPatch(values);
            if (publish) patch.publish = true;

            if (isEditing) {
                const updated = await updatePost(postId as string, patch);
                // Sửa: luôn đồng bộ (mảng rỗng = bỏ hết công thức đã gắn).
                await attachPostRecipes(postId as string, values.recipeIds);
                return updated;
            }

            const { content, rawContent } = buildContentPayload(values);
            const created = await createPost({
                title: values.title.trim(),
                content,
                rawContent,
                featuredImageUrl: values.featuredImageUrl.trim() || null,
            });
            await updatePost(created.id, patch);
            if (values.recipeIds.length > 0) await attachPostRecipes(created.id, values.recipeIds);
            return created;
        },
        onSuccess: () => {
            toast.success(t(isEditing ? "posts.toast.updated" : "posts.toast.created", { ns: "admin" }));
            void queryClient.invalidateQueries({ queryKey: ["my-posts"] });
            if (postId) void queryClient.invalidateQueries({ queryKey: ["post-detail", postId] });
            onClose();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("posts.toast.failed", { ns: "admin" })));
        },
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            title: existingPost?.title ?? "",
            summary: "",
            content: existingPost
                ? (existingPost.contentJson ??
                  parseStoredContent(existingPost.rawContent) ??
                  textToDoc(existingPost.content))
                : EMPTY_DOC,
            rawContent: existingPost?.content ?? "",
            featuredImageUrl: existingPost?.featuredImageUrl ?? "",
            categoryIds: existingPost?.categoryIds ?? [],
            recipeIds: existingPost?.recipeIds ?? [],
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: (values) => {
            // Publish bắt buộc danh mục + nội dung; draft thì không. Chỉ `setFieldError` —
            // `setFieldTouched` sẽ validate lại và xoá luôn lỗi vừa đặt.
            if (intentRef.current === "publish") {
                if (values.categoryIds.length === 0) {
                    formik.setFieldError("categoryIds", t("validation:required"));
                    return;
                }
                // Editor rỗng vẫn là doc hợp lệ nên Yup không bắt được.
                if (isEditorEmpty(values.content)) {
                    formik.setFieldError("content", t("validation:required"));
                    return;
                }
            }
            saveMutation.mutate(values);
        },
    });

    const handleEditorChange = (doc: JSONContent, text: string) => {
        void formik.setFieldValue("content", doc);
        void formik.setFieldValue("rawContent", text);
    };

    // Ảnh chèn trong bài dùng lại đúng luồng upload 3 bước.
    const handleInsertImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t("posts.form.invalidImageType", { ns: "admin" }));
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            toast.error(t("posts.form.imageTooLarge", { ns: "admin" }));
            return;
        }

        setIsUploadingImage(true);
        try {
            const grant = await createUploadGrant({
                contentType: file.type,
                fileName: file.name,
                sizeBytes: file.size,
            });
            await uploadFileToProvider(grant.upload.url, grant.upload.fields, file);
            const confirmed = await confirmUpload(grant.mediaId);
            if (confirmed.mediaUrl) {
                editorRef.current?.chain().focus().setImage({ src: confirmed.mediaUrl }).run();
            }
        } catch {
            toast.error(t("posts.form.uploadFailed", { ns: "admin" }));
        } finally {
            setIsUploadingImage(false);
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    const handleSubmit = (intent: SubmitIntent) => {
        intentRef.current = intent;
        void formik.submitForm();
    };

    // Esc / bấm nền / nút X / Cancel: có thay đổi chưa lưu thì hỏi trước.
    const handleBeforeClose = () => {
        if (saveMutation.isPending) return false;
        if (!formik.dirty) return true;
        setConfirmOpen(true);
        return false;
    };

    const handleCancel = () => {
        if (handleBeforeClose()) onClose();
    };

    const words = countWords(formik.values.rawContent);
    const checklist = [
        { key: "title", done: formik.values.title.trim().length > 0, value: t("posts.checklist.value.ready", { ns: "admin" }) },
        { key: "cover", done: formik.values.featuredImageUrl.trim().length > 0, value: t("posts.checklist.value.uploaded", { ns: "admin" }) },
        { key: "content", done: !isEditorEmpty(formik.values.content), value: t("posts.checklist.value.words", { ns: "admin", count: words }) },
        { key: "recipes", done: formik.values.recipeIds.length > 0, value: String(formik.values.recipeIds.length) },
        {
            key: "categories",
            done: formik.values.categoryIds.length > 0,
            value: t("posts.checklist.value.missing", { ns: "admin" }),
            required: true,
        },
    ];
    const doneCount = checklist.filter((item) => item.done).length;

    const attachedRecipes = (myRecipes ?? []).filter((recipe) => formik.values.recipeIds.includes(recipe.id));
    const titleError = formik.touched.title && formik.errors.title ? (formik.errors.title as string) : undefined;
    // Chỉ `setFieldError` ở `onSubmit` đặt 2 lỗi này (Yup không có rule tương ứng),
    // nên đọc thẳng `errors` — không gate bằng `touched`.
    const categoryError = formik.errors.categoryIds ? t("validation:required") : undefined;
    const contentError = formik.errors.content ? t("validation:required") : undefined;

    return (
        <>
            <Dialog
                open
                onClose={onClose}
                title={t(isEditing ? "posts.edit.title" : "posts.create.title", { ns: "admin" })}
                description={t(isEditing ? "posts.composer.dialogSubtitleEdit" : "posts.composer.dialogSubtitle", {
                    ns: "admin",
                })}
                padded={false}
                bodyClassName="flex h-full min-h-0 flex-col"
                headerClassName="mb-0 items-center gap-3 border-b border-border px-4 py-2.5"
                titleClassName="text-[15px] leading-tight"
                descriptionClassName="mt-0.5 text-[11.5px]"
                headerActions={
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted-bg px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <CloudUpload className="h-3 w-3 text-vegan-green" aria-hidden="true" />
                            {t("posts.composer.draftAutosaved", { ns: "admin" })}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-vegan-green-light px-2 py-0.5 text-[11px] font-semibold text-vegan-green max-sm:hidden">
                            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                            {t("posts.composer.plantVerified", { ns: "admin" })}
                        </span>
                    </div>
                }
                className="h-[min(740px,calc(100dvh-2rem))] w-[min(1120px,calc(100%-2rem))] max-h-none max-w-none overflow-hidden max-sm:h-[100dvh] max-sm:w-full max-sm:rounded-none"
                onBeforeClose={handleBeforeClose}
            >
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInsertImage}
                    className="hidden"
                />

                <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:overflow-hidden">
                    <div className="flex min-h-0 min-w-0 flex-col lg:border-r lg:border-border">
                        {/* Tiêu đề là headline, không phải ô nhập có viền. */}
                        <div className="flex flex-none items-end gap-2.5 px-4 pt-3">
                            <input
                                value={formik.values.title}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                name="title"
                                maxLength={MAX_TITLE_LENGTH}
                                aria-label={t("posts.form.titleLabel", { ns: "admin" })}
                                aria-invalid={Boolean(titleError)}
                                placeholder={t("posts.form.titlePlaceholder", { ns: "admin" })}
                                className={cn(
                                    "min-w-0 flex-1 border-0 border-b bg-transparent px-0 pb-2 text-[21px] font-semibold tracking-tight text-dark placeholder:font-semibold placeholder:text-muted-foreground/60 focus:outline-none",
                                    titleError ? "border-danger" : "border-transparent",
                                )}
                            />
                            <span className="flex-none pb-2.5 text-[11px] tabular-nums text-muted-foreground">
                                {formik.values.title.length} / {MAX_TITLE_LENGTH}
                            </span>
                        </div>
                        {titleError && (
                            <p role="alert" className="px-4 text-xs text-danger">
                                {titleError}
                            </p>
                        )}

                        {/* Meta: ảnh bìa thumbnail + tóm tắt + danh mục. */}
                        <div className="grid flex-none grid-cols-1 gap-3 border-b border-border px-4 pb-3 pt-2.5 sm:grid-cols-[104px_minmax(0,1.1fr)_minmax(0,1fr)]">
                            <ImageUploader
                                variant="compact"
                                value={formik.values.featuredImageUrl || null}
                                onChange={(url) => void formik.setFieldValue("featuredImageUrl", url ?? "")}
                                disabled={saveMutation.isPending}
                            />

                            <div className="flex min-w-0 flex-col gap-1">
                                <label
                                    htmlFor="composer-summary"
                                    className="text-[10.5px] font-semibold text-dark"
                                >
                                    {t("posts.composer.summaryLabel", { ns: "admin" })}{" "}
                                    <span className="font-medium text-muted-foreground">
                                        · {t("common:optional")}
                                    </span>
                                </label>
                                <textarea
                                    id="composer-summary"
                                    name="summary"
                                    rows={2}
                                    maxLength={MAX_SUMMARY_LENGTH}
                                    value={formik.values.summary}
                                    onChange={formik.handleChange}
                                    placeholder={t("posts.composer.summaryPlaceholder", { ns: "admin" })}
                                    className="min-h-[52px] w-full resize-none rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-dark focus:border-vegan-green-muted focus:outline-none focus:ring-2 focus:ring-vegan-green-light"
                                />
                                <span className="text-[10px] tabular-nums text-muted-foreground">
                                    {formik.values.summary.length} / {MAX_SUMMARY_LENGTH}
                                </span>
                            </div>

                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-[10.5px] font-semibold text-dark">
                                    {t("posts.form.categoryLabel", { ns: "admin" })}{" "}
                                    <span className="text-danger">*</span>
                                </span>
                                <CategorySelect
                                    options={categories}
                                    value={formik.values.categoryIds}
                                    onChange={(ids) => void formik.setFieldValue("categoryIds", ids)}
                                    loading={isCategoriesLoading}
                                    invalid={Boolean(categoryError)}
                                    disabled={saveMutation.isPending}
                                    ariaLabel={t("posts.form.categoryLabel", { ns: "admin" })}
                                />
                                {categoryError && (
                                    <p role="alert" className="text-[10px] text-danger">
                                        {categoryError}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col p-2 lg:p-3">
                            <RichTextEditor
                                fill
                                className="max-lg:min-h-[320px] border-0 shadow-none"
                                value={formik.values.content}
                                onChange={handleEditorChange}
                                placeholder={t("common:editor.placeholder")}
                                onRequestImage={() => imageInputRef.current?.click()}
                                onReady={(editor) => {
                                    editorRef.current = editor;
                                }}
                                disabled={saveMutation.isPending || isUploadingImage}
                                error={Boolean(contentError)}
                            />
                        </div>

                        {/* Chip công thức đã gắn — một dải mảnh thay cho khối card. */}
                        <div className="flex flex-none flex-wrap items-center gap-2 border-t border-border bg-vegan-green-subtle px-4 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                {t("posts.composer.section4Title", { ns: "admin" })}
                            </span>
                            {attachedRecipes.map((recipe) => (
                                <span
                                    key={recipe.id}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-0.5 pl-1 pr-2 text-[11.5px] font-semibold text-dark"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-vegan-green text-white/80">
                                        <Leaf className="h-2.5 w-2.5" aria-hidden="true" />
                                    </span>
                                    <span className="max-w-[160px] truncate">{recipe.name}</span>
                                    <button
                                        type="button"
                                        disabled={saveMutation.isPending}
                                        aria-label={t("posts.composer.detachRecipe", { ns: "admin" })}
                                        onClick={() =>
                                            void formik.setFieldValue(
                                                "recipeIds",
                                                formik.values.recipeIds.filter((id) => id !== recipe.id),
                                            )
                                        }
                                        className="text-muted-foreground hover:text-danger disabled:opacity-50"
                                    >
                                        <X className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}
                            <button
                                type="button"
                                disabled={saveMutation.isPending}
                                onClick={() => setPickerOpen(true)}
                                className="inline-flex items-center gap-1 rounded-full border border-dashed border-vegan-green-muted px-2.5 py-0.5 text-[11.5px] font-semibold text-vegan-green transition-colors hover:bg-vegan-green-light disabled:opacity-50"
                            >
                                <Plus className="h-3 w-3" aria-hidden="true" />
                                {t("posts.composer.attachRecipeShort", { ns: "admin" })}
                            </button>
                        </div>
                    </div>

                    {/* Rail: checklist + preview. Mobile: xuống dưới, cả trang cuộn. */}
                    <aside className="flex min-w-0 flex-col gap-2.5 border-t border-border p-3 lg:overflow-y-auto lg:border-t-0">
                        <div className="rounded-xl border border-border bg-card p-3">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <h3 className="text-[11.5px] font-bold text-dark">
                                    {t("posts.checklist.heading", { ns: "admin" })}
                                </h3>
                                <span className="text-[10.5px] font-bold tabular-nums text-vegan-green">
                                    {doneCount} / {checklist.length}
                                </span>
                            </div>
                            <Progress
                                value={(doneCount / checklist.length) * 100}
                                tone={doneCount === checklist.length ? "green" : "amber"}
                            />
                            <ul className="mt-2 flex flex-col gap-1">
                                {checklist.map((item) => (
                                    <li key={item.key} className="flex items-center justify-between gap-2 text-[11.5px]">
                                        <span className="flex min-w-0 items-center gap-1.5">
                                            {item.done ? (
                                                <Check className="h-3 w-3 flex-none text-vegan-green" aria-hidden="true" />
                                            ) : (
                                                <Circle className="h-3 w-3 flex-none text-muted-foreground/50" aria-hidden="true" />
                                            )}
                                            <span className={cn("truncate", item.done ? "text-dark" : "text-muted-foreground")}>
                                                {t(`posts.checklist.${item.key}`, { ns: "admin" })}
                                                {item.required && <b className="text-danger"> *</b>}
                                            </span>
                                        </span>
                                        <span
                                            className={cn(
                                                "flex-none tabular-nums",
                                                item.done ? "text-muted-foreground" : "font-semibold text-danger",
                                            )}
                                        >
                                            {item.done || !item.required ? item.value : t("posts.checklist.value.missing", { ns: "admin" })}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <PostPreviewCard values={formik.values} />
                    </aside>
                </div>

                <footer className="flex flex-none flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
                    <span className="text-[11px] text-muted-foreground max-sm:hidden">
                        {t(isEditing ? "posts.composer.footerHintEdit" : "posts.composer.footerHintNew", { ns: "admin" })}
                    </span>
                    <div className="ml-auto flex gap-2 max-sm:w-full">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="max-sm:hidden"
                            disabled={saveMutation.isPending}
                            onClick={handleCancel}
                        >
                            {t("common:cancel")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="max-sm:flex-1"
                            disabled={saveMutation.isPending}
                            onClick={() => handleSubmit("draft")}
                        >
                            <Save className="h-3.5 w-3.5" aria-hidden="true" />
                            {t(isEditing ? "posts.form.saveChanges" : "posts.form.saveDraft", { ns: "admin" })}
                        </Button>
                        <Button
                            size="sm"
                            className="max-sm:flex-1"
                            disabled={saveMutation.isPending}
                            onClick={() => handleSubmit("publish")}
                        >
                            {saveMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {t(isEditing ? "posts.form.update" : "posts.form.publish", { ns: "admin" })}
                        </Button>
                    </div>
                </footer>
            </Dialog>

            <RecipePickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                selected={formik.values.recipeIds}
                onConfirm={(recipeIds) => {
                    void formik.setFieldValue("recipeIds", recipeIds);
                    setPickerOpen(false);
                }}
            />

            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={t("posts.composer.discardTitle", { ns: "admin" })}
                description={t("posts.composer.discardBody", { ns: "admin" })}
            >
                <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                        {t("posts.composer.keepEditing", { ns: "admin" })}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            setConfirmOpen(false);
                            onClose();
                        }}
                    >
                        {t("posts.composer.discard", { ns: "admin" })}
                    </Button>
                    <Button
                        onClick={() => {
                            setConfirmOpen(false);
                            handleSubmit("draft");
                        }}
                    >
                        {t("posts.form.saveDraft", { ns: "admin" })}
                    </Button>
                </div>
            </Dialog>
        </>
    );
}
