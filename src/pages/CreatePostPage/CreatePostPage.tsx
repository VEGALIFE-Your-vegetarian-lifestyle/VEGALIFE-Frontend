import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useFormik } from "formik";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { Editor, JSONContent } from "@tiptap/react";
import {
    BadgeCheck,
    Check,
    ChevronDown,
    CloudUpload,
    Loader2,
    Save,
    Send,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/shared/components/FormField";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionCard } from "@/shared/components/SectionCard";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { EMPTY_DOC, isEditorEmpty, parseStoredContent, textToDoc } from "@/components/editor/editorContent";
import { usePublicCategories } from "@/hooks/usePublicCategories";
import { createPost, getPostDetail, updatePost } from "@/services/postService";
import { confirmUpload, createUploadGrant, uploadFileToProvider } from "@/services/mediaService";
import { ImageUploader } from "@/components/media/ImageUploader";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/utils/apiError";
import { MAX_IMAGE_SIZE, MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH, buildValidationSchema } from "./schema";
import { buildContentPayload, buildPatch, type FormValues } from "./payload";
import { ContentFormatSelector } from "./ContentFormatSelector";
import { PostSidebar } from "./PostSidebar";

type SubmitIntent = "draft" | "publish";

export default function CreatePostPage() {
    const { t } = useTranslation(["admin", "validation", "common", "post"]);
    const navigate = useNavigate();
    const { id: editingId } = useParams<{ id: string }>();
    const isEditing = Boolean(editingId);
    const [showCategories, setShowCategories] = useState(false);
    const intentRef = useRef<SubmitIntent>("draft");
    const editorRef = useRef<Editor | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const { data: categoriesData, isLoading: isCategoriesLoading } = usePublicCategories({
        page: 0,
        size: 100,
        sort: "name,asc",
    });
    const activeCategories = categoriesData?.content ?? [];

    // Chế độ sửa: nạp bài hiện có. GET /api/posts/{id} chỉ trả bài đã published.
    const { data: existingPost } = useQuery({
        queryKey: ["post-detail", editingId],
        queryFn: () => getPostDetail(editingId as string),
        enabled: isEditing,
    });

    const validationSchema = useMemo(() => buildValidationSchema(t, isEditing), [t, isEditing]);

    // POST /api/posts chỉ tạo draft; đăng bài phải PATCH riêng.
    const saveMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const publish = intentRef.current === "publish";
            const patch = buildPatch(values);

            if (isEditing) {
                // `type` bất biến — không gửi khi sửa.
                if (publish) patch.publish = true;
                return updatePost(editingId as string, patch);
            }

            const { content, rawContent } = buildContentPayload(values);
            const created = await createPost({
                title: values.title.trim(),
                content,
                rawContent,
                featuredImageUrl: values.featuredImageUrl.trim() || null,
            });

            // ponytail: POST /api/posts không nhận `type`, nên bài tạo ra mặc định là blog.
            // Bài video sẽ 400 ("type bất biến") cho tới khi backend cho set type lúc tạo.
            patch.type = values.type;
            if (publish) patch.publish = true;
            await updatePost(created.id, patch);

            return created;
        },
        onSuccess: () => {
            toast.success(t(isEditing ? "posts.toast.updated" : "posts.toast.created", { ns: "admin" }));
            navigate("/my-posts");
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, t("posts.toast.failed", { ns: "admin" })));
        },
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            title: existingPost?.title ?? "",
            type: existingPost?.type ?? "blog",
            summary: "",
            content: existingPost
                ? (existingPost.contentJson ?? parseStoredContent(existingPost.rawContent) ?? textToDoc(existingPost.content))
                : EMPTY_DOC,
            rawContent: existingPost?.content ?? "",
            featuredImageUrl: existingPost?.featuredImageUrl ?? "",
            videoUrl: existingPost?.videoUrl ?? "",
            categoryIds: existingPost?.categoryIds ?? [],
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: (values) => {
            if (intentRef.current === "publish" && values.categoryIds.length === 0) {
                formik.setFieldError("categoryIds", t("validation:required"));
                return;
            }
            // Editor rỗng vẫn là doc hợp lệ nên Yup không bắt được — kiểm riêng cho blog.
            if (values.type === "blog" && isEditorEmpty(values.content)) {
                formik.setFieldError("content", t("validation:required"));
                formik.setFieldTouched("content", true);
                return;
            }
            saveMutation.mutate(values);
        },
    });

    const toggleCategory = (categoryId: string) => {
        const next = formik.values.categoryIds.includes(categoryId)
            ? formik.values.categoryIds.filter((id) => id !== categoryId)
            : [...formik.values.categoryIds, categoryId];
        formik.setFieldValue("categoryIds", next);
    };

    const handleEditorChange = (doc: JSONContent, text: string) => {
        formik.setFieldValue("content", doc);
        formik.setFieldValue("rawContent", text);
    };

    // Ảnh chèn trong bài dùng lại đúng luồng upload 3 bước của ImageUploader.
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

    const selectedCategories = activeCategories.filter((category) => formik.values.categoryIds.includes(category.id));
    const isBlog = formik.values.type === "blog";

    const handleSubmit = (intent: SubmitIntent) => {
        intentRef.current = intent;
        formik.submitForm();
    };

    // Checklist xuất bản — suy trực tiếp từ form, không cần state riêng.
    const checklist = [
        { key: "format", done: true },
        { key: "title", done: formik.values.title.trim().length > 0 },
        { key: "category", done: formik.values.categoryIds.length > 0 },
        { key: "cover", done: formik.values.featuredImageUrl.trim().length > 0 },
        { key: "content", done: !isEditorEmpty(formik.values.content) },
        ...(isBlog ? [] : [{ key: "videoSource", done: Boolean(formik.values.videoUrl.trim()) }]),
    ];

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={[t("common:home"), t(isEditing ? "posts.edit.title" : "posts.create.title", { ns: "admin" })]}
                title={t(isEditing ? "posts.edit.title" : "posts.create.title", { ns: "admin" })}
                description={t("posts.composer.subtitle", { ns: "admin" })}
            />

            {/* Không có nút submit thật — Enter trong ô nhập sẽ submit ngầm form.
                Chặn ở đây; lưu/đăng đều đi qua handleSubmit(intent) gọi formik.submitForm(). */}
            <form onSubmit={(event) => event.preventDefault()} noValidate>
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInsertImage}
                    className="hidden"
                />

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-5">
                        {/* Trạng thái lưu nháp — mockup có badge "Draft autosaved". */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <CloudUpload className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                {t("posts.composer.draftAutosaved", { ns: "admin" })}
                            </span>
                            <Badge variant="amber" size="sm">
                                {t("common:postStatus.created")}
                            </Badge>
                        </div>

                        {/* 1. Content format */}
                        <ContentFormatSelector
                            value={formik.values.type}
                            onChange={(type) => formik.setFieldValue("type", type)}
                        />

                        {/* 2. Title & details */}
                        <SectionCard
                            eyebrow={t("posts.composer.section2", { ns: "admin" })}
                            title={t("posts.composer.titleSection", { ns: "admin" })}
                        >
                            <div className="space-y-5">
                                <FormField
                                    label={t("posts.form.titleLabel", { ns: "admin" })}
                                    htmlFor="title"
                                    required
                                    error={formik.touched.title ? (formik.errors.title as string) : undefined}
                                >
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder={t("posts.form.titlePlaceholder", { ns: "admin" })}
                                        value={formik.values.title}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        maxLength={MAX_TITLE_LENGTH}
                                        aria-invalid={formik.touched.title && !!formik.errors.title}
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formik.values.title.length}/{MAX_TITLE_LENGTH}
                                    </p>
                                </FormField>

                                {/* ponytail: BE chưa có field `summary` — ô này chỉ để đủ UI,
                                    gửi kèm khi backend khai báo. */}
                                <FormField
                                    label={t("posts.composer.summaryLabel", { ns: "admin" })}
                                    htmlFor="summary"
                                    helper={t("posts.composer.summaryHint", { ns: "admin" })}
                                >
                                    <Textarea
                                        id="summary"
                                        name="summary"
                                        rows={2}
                                        maxLength={MAX_SUMMARY_LENGTH}
                                        placeholder={t("posts.composer.summaryPlaceholder", { ns: "admin" })}
                                        value={formik.values.summary}
                                        onChange={formik.handleChange}
                                    />
                                </FormField>
                            </div>
                        </SectionCard>

                        {/* 3. Categorization */}
                        <SectionCard
                            eyebrow={t("posts.composer.section3", { ns: "admin" })}
                            title={t("posts.form.categoryLabel", { ns: "admin" })}
                            aside={
                                selectedCategories.length > 0 ? (
                                    <Badge variant="outlineGreen" size="sm">
                                        {selectedCategories.length} {t("posts.form.categorySelected", { ns: "admin" })}
                                    </Badge>
                                ) : undefined
                            }
                        >
                            <button
                                type="button"
                                id="categories"
                                onClick={() => setShowCategories((prev) => !prev)}
                                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-dark hover:border-vegan-green-muted"
                            >
                                <span className={selectedCategories.length === 0 ? "text-muted-foreground" : undefined}>
                                    {selectedCategories.length === 0
                                        ? t("posts.form.categoryPlaceholder", { ns: "admin" })
                                        : selectedCategories.map((category) => category.name).join(", ")}
                                </span>
                                <ChevronDown
                                    className={cn("h-4 w-4 text-muted-foreground transition", showCategories && "rotate-180")}
                                    aria-hidden="true"
                                />
                            </button>

                            {formik.touched.categoryIds && formik.errors.categoryIds && (
                                <p role="alert" className="mt-1 text-sm text-danger">
                                    {formik.errors.categoryIds as string}
                                </p>
                            )}

                            {(showCategories || selectedCategories.length === 0) && (
                                <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                                    {isCategoriesLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                            {t("common:loading")}
                                        </div>
                                    ) : activeCategories.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {t("posts.form.noCategories", { ns: "admin" })}
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {activeCategories.map((category) => {
                                                const selected = formik.values.categoryIds.includes(category.id);
                                                return (
                                                    <button
                                                        key={category.id}
                                                        type="button"
                                                        onClick={() => toggleCategory(category.id)}
                                                        aria-pressed={selected}
                                                        className={cn(
                                                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                                            selected
                                                                ? "border-vegan-green bg-vegan-green-light text-vegan-green"
                                                                : "border-border bg-card text-muted-foreground hover:border-vegan-green-muted",
                                                        )}
                                                    >
                                                        {selected && <Check className="h-3 w-3" aria-hidden="true" />}
                                                        {category.name}
                                                        {selected && (
                                                            <X
                                                                className="h-3 w-3"
                                                                aria-hidden="true"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    toggleCategory(category.id);
                                                                }}
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </SectionCard>

                        {/* 4. Cover & visuals */}
                        <SectionCard
                            eyebrow={t("posts.composer.section4", { ns: "admin" })}
                            title={t("posts.composer.coverSection", { ns: "admin" })}
                        >
                            <div className="space-y-5">
                                <FormField
                                    label={t("posts.form.featuredImageUrlLabel", { ns: "admin" })}
                                    htmlFor="featuredImageUrl"
                                    error={
                                        formik.touched.featuredImageUrl
                                            ? (formik.errors.featuredImageUrl as string)
                                            : undefined
                                    }
                                >
                                    <ImageUploader
                                        value={formik.values.featuredImageUrl || null}
                                        onChange={(url) => formik.setFieldValue("featuredImageUrl", url)}
                                        disabled={saveMutation.isPending}
                                    />
                                </FormField>

                                {!isBlog && (
                                    <FormField
                                        label={t("posts.form.videoFileLabel", { ns: "admin" })}
                                        htmlFor="videoUrl"
                                        error={formik.touched.videoUrl ? (formik.errors.videoUrl as string) : undefined}
                                    >
                                        <ImageUploader
                                            kind="video"
                                            value={formik.values.videoUrl || null}
                                            onChange={(url) => formik.setFieldValue("videoUrl", url ?? "")}
                                            disabled={saveMutation.isPending}
                                        />
                                    </FormField>
                                )}
                            </div>
                        </SectionCard>

                        {/* 5. Article content — editor thật */}
                        <SectionCard
                            eyebrow={t("posts.composer.section5", { ns: "admin" })}
                            title={t("posts.form.contentLabel", { ns: "admin" })}
                            footnote={
                                <>
                                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-vegan-green" aria-hidden="true" />
                                    {t("posts.composer.contentNote", { ns: "admin" })}
                                </>
                            }
                        >
                            {formik.touched.content && formik.errors.content && (
                                <p role="alert" className="mb-2 text-sm text-danger">
                                    {formik.errors.content as unknown as string}
                                </p>
                            )}
                            <RichTextEditor
                                value={formik.values.content}
                                onChange={handleEditorChange}
                                placeholder={t("common:editor.placeholder")}
                                onRequestImage={() => imageInputRef.current?.click()}
                                onReady={(editor) => {
                                    editorRef.current = editor;
                                }}
                                disabled={saveMutation.isPending || isUploadingImage}
                                error={Boolean(formik.touched.content && formik.errors.content)}
                            />
                        </SectionCard>

                        {/* Actions */}
                        <div className="flex flex-col justify-end gap-3 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saveMutation.isPending}
                                onClick={() => handleSubmit("draft")}
                            >
                                <Save className="h-4 w-4" aria-hidden="true" />
                                {t("posts.form.saveDraft", { ns: "admin" })}
                            </Button>
                            <Button
                                type="button"
                                disabled={saveMutation.isPending}
                                onClick={() => handleSubmit("publish")}
                            >
                                {saveMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                )}
                                {t("posts.form.publish", { ns: "admin" })}
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <PostSidebar checklist={checklist} />
                </div>
            </form>
        </div>
    );
}
