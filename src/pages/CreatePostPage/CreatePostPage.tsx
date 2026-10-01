import { useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as Yup from "yup";
import { Check, ChevronDown, FileText, Film, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/shared/components/FormField";
import { PageHeader } from "@/shared/components/PageHeader";
import { usePublicCategories } from "@/hooks/usePublicCategories";
import { createPost } from "@/services/postService";
import { ImageUploader } from "@/components/media/ImageUploader";
import type { CreatePostRequest, PostType } from "@/types/post";

interface FormValues {
    title: string;
    type: PostType;
    content: string;
    featuredImageUrl: string;
    videoUrl: string;
    mediaId: string;
    categoryIds: string[];
}

const MAX_TITLE_LENGTH = 255;

type SubmitIntent = "draft" | "publish";

export default function CreatePostPage() {
    const { t } = useTranslation(["admin", "validation", "common"]);
    const navigate = useNavigate();
    const [showCategories, setShowCategories] = useState(false);
    const intentRef = useRef<SubmitIntent>("draft");

    const { data: categoriesData, isLoading: isCategoriesLoading } = usePublicCategories({
        page: 0,
        size: 100,
        sort: "name,asc",
    });
    const activeCategories = categoriesData?.content ?? [];

    const validationSchema = useMemo(
        () =>
            Yup.object({
                title: Yup.string()
                    .trim()
                    .required(t("validation:required"))
                    .max(MAX_TITLE_LENGTH, t("validation:maxLength", { count: MAX_TITLE_LENGTH })),
                type: Yup.string().oneOf(["blog", "video"] as const).required(t("validation:required")),
                content: Yup.string().when("type", {
                    is: "blog",
                    then: (schema) => schema.required(t("validation:required")),
                    otherwise: (schema) => schema,
                }),
                featuredImageUrl: Yup.string().url(t("posts.form.invalidUrl", { ns: "admin" })).optional(),
                videoUrl: Yup.string().when("type", {
                    is: "video",
                    then: (schema) => schema.url(t("posts.form.invalidUrl", { ns: "admin" })).optional(),
                    otherwise: (schema) => schema.notRequired(),
                }),
                mediaId: Yup.string().when("type", {
                    is: "video",
                    then: (schema) => schema.optional(),
                    otherwise: (schema) => schema.notRequired(),
                }),
                categoryIds: Yup.array().of(Yup.string().required()),
            }).test("videoSource", t("posts.form.videoSourceRequired", { ns: "admin" }), (values) => {
                if (values.type !== "video") return true;
                return Boolean(values.videoUrl?.trim()) || Boolean(values.mediaId?.trim());
            }),
        [t],
    );

    const createMutation = useMutation({
        mutationFn: (payload: CreatePostRequest) => createPost(payload),
        onSuccess: () => {
            toast.success(t("posts.toast.created", { ns: "admin" }));
            navigate("/");
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { message?: string } } };
            const message = axiosError.response?.data?.message || t("posts.toast.failed", { ns: "admin" });
            toast.error(message);
        },
    });

    const formik = useFormik<FormValues>({
        initialValues: {
            title: "",
            type: "blog",
            content: "",
            featuredImageUrl: "",
            videoUrl: "",
            mediaId: "",
            categoryIds: [],
        },
        validationSchema,
        onSubmit: (values) => {
            const publish = intentRef.current === "publish";

            if (publish && values.categoryIds.length === 0) {
                formik.setFieldError("categoryIds", t("validation:required"));
                return;
            }

            const payload: CreatePostRequest = {
                title: values.title.trim(),
                type: values.type,
                content: values.content.trim(),
                featuredImageUrl: values.featuredImageUrl.trim() || null,
                videoUrl: values.type === "video" ? values.videoUrl.trim() || null : null,
                mediaId: values.type === "video" ? values.mediaId.trim() || null : null,
                categoryIds: publish ? values.categoryIds : [],
                publish,
            };

            createMutation.mutate(payload);
        },
    });

    const toggleCategory = (categoryId: string) => {
        const next = formik.values.categoryIds.includes(categoryId)
            ? formik.values.categoryIds.filter((id) => id !== categoryId)
            : [...formik.values.categoryIds, categoryId];
        formik.setFieldValue("categoryIds", next);
    };

    const selectedCategories = activeCategories.filter((category) => formik.values.categoryIds.includes(category.id));
    const isBlog = formik.values.type === "blog";

    const handleSubmit = (intent: SubmitIntent) => {
        intentRef.current = intent;
        formik.submitForm();
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <PageHeader
                breadcrumb={["Home", t("posts.create.title", { ns: "admin" })]}
                title={t("posts.create.title", { ns: "admin" })}
                description={t("posts.create.description", { ns: "admin" })}
            />

            <form onSubmit={formik.handleSubmit} noValidate className="space-y-8">
                {/* Content format selector */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("posts.form.contentFormat", { ns: "admin" })}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => formik.setFieldValue("type", "blog")}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                                isBlog
                                    ? "border-vegan-green bg-vegan-green-light text-vegan-green"
                                    : "border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green"
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            {t("posts.form.typeBlog", { ns: "admin" })}
                        </button>
                        <button
                            type="button"
                            onClick={() => formik.setFieldValue("type", "video")}
                            className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-semibold transition ${
                                !isBlog
                                    ? "border-vegan-green bg-vegan-green-light text-vegan-green"
                                    : "border-border bg-surface text-muted-foreground hover:border-vegan-green-muted hover:text-vegan-green"
                            }`}
                        >
                            <Film className="h-4 w-4" />
                            {t("posts.form.typeVideo", { ns: "admin" })}
                        </button>
                    </div>
                </div>

                {/* Basic info */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                        </FormField>

                        <FormField
                            label={t("posts.form.contentLabel", { ns: "admin" })}
                            htmlFor="content"
                            required={isBlog}
                            error={formik.touched.content ? (formik.errors.content as string) : undefined}
                        >
                            <Textarea
                                id="content"
                                name="content"
                                placeholder={
                                    isBlog
                                        ? t("posts.form.contentPlaceholderBlog", { ns: "admin" })
                                        : t("posts.form.contentPlaceholderVideo", { ns: "admin" })
                                }
                                value={formik.values.content}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                aria-invalid={formik.touched.content && !!formik.errors.content}
                                className="min-h-[200px]"
                            />
                        </FormField>

                        <FormField
                            label={t("posts.form.featuredImageUrlLabel", { ns: "admin" })}
                            htmlFor="featuredImageUrl"
                            error={formik.touched.featuredImageUrl ? (formik.errors.featuredImageUrl as string) : undefined}
                        >
                            <ImageUploader
                                value={formik.values.featuredImageUrl || null}
                                onChange={(url) => formik.setFieldValue("featuredImageUrl", url)}
                                disabled={createMutation.isPending}
                            />
                        </FormField>

                        {!isBlog && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label={t("posts.form.videoUrlLabel", { ns: "admin" })}
                                    htmlFor="videoUrl"
                                    error={formik.touched.videoUrl ? (formik.errors.videoUrl as string) : undefined}
                                >
                                    <Input
                                        id="videoUrl"
                                        name="videoUrl"
                                        placeholder={t("posts.form.videoUrlPlaceholder", { ns: "admin" })}
                                        value={formik.values.videoUrl}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        aria-invalid={formik.touched.videoUrl && !!formik.errors.videoUrl}
                                    />
                                </FormField>
                                <FormField
                                    label={t("posts.form.mediaIdLabel", { ns: "admin" })}
                                    htmlFor="mediaId"
                                    error={formik.touched.mediaId ? (formik.errors.mediaId as string) : undefined}
                                >
                                    <Input
                                        id="mediaId"
                                        name="mediaId"
                                        placeholder={t("posts.form.mediaIdPlaceholder", { ns: "admin" })}
                                        value={formik.values.mediaId}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        aria-invalid={formik.touched.mediaId && !!formik.errors.mediaId}
                                    />
                                </FormField>
                            </div>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <FormField
                        label={t("posts.form.categoryLabel", { ns: "admin" })}
                        htmlFor="categories"
                        error={formik.touched.categoryIds ? (formik.errors.categoryIds as string) : undefined}
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
                                    : `${selectedCategories.length} ${t("posts.form.categorySelected", { ns: "admin" })}`}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${showCategories ? "rotate-180" : ""}`} />
                        </button>
                    </FormField>

                    {showCategories && (
                        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                            {isCategoriesLoading ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("common:loading")}
                                </div>
                            ) : activeCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t("posts.form.noCategories", { ns: "admin" })}</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {activeCategories.map((category) => {
                                        const selected = formik.values.categoryIds.includes(category.id);
                                        return (
                                            <label
                                                key={category.id}
                                                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                                                    selected
                                                        ? "border-vegan-green bg-vegan-green-light text-vegan-green"
                                                        : "border-border bg-card text-dark hover:border-vegan-green-muted"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleCategory(category.id)}
                                                    className="h-4 w-4 rounded border-border text-vegan-green focus:ring-vegan-green"
                                                />
                                                <span className="truncate">{category.name}</span>
                                                {selected && <Check className="ml-auto h-4 w-4" />}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedCategories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {selectedCategories.map((category) => (
                                <Badge key={category.id} variant="lightgreen" className="gap-1">
                                    {category.name}
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category.id)}
                                        className="ml-1 rounded-full hover:bg-vegan-green/20"
                                        aria-label={t("posts.form.removeCategory", { ns: "admin" })}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={createMutation.isPending}
                        onClick={() => handleSubmit("draft")}
                    >
                        {t("posts.form.saveDraft", { ns: "admin" })}
                    </Button>
                    <Button
                        type="button"
                        disabled={createMutation.isPending}
                        onClick={() => handleSubmit("publish")}
                    >
                        <Plus className="h-4 w-4" />
                        {t("posts.form.publish", { ns: "admin" })}
                    </Button>
                </div>
            </form>
        </div>
    );
}
