import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock, Eye, FileText, Link2, PenLine, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "../../components/PostCard";
import { PostStatusBadge } from "../../components/PostStatusBadge";
import { PostContent } from "../../components/editor/PostContent";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/features/auth/useAuth";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { getPostDetail, getRelatedPosts } from "../../api";
import { useUiStore } from "@/shared/ui/uiStore";
import { showFallbackImage } from "@/shared/utils/display";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { CommentsSection } from "./CommentsSection";
import { AttachedRecipes } from "./AttachedRecipes";

/** Số bài "Related" hiện ở chân trang. */
const RELATED_COUNT = 3;

/**
 * Chi tiết bài viết — bố cục tạp chí 2 cột.
 *
 * Trái: cột đọc ~68ch (ảnh bìa → tiêu đề → meta → nội dung → chip danh mục).
 * Phải: thẻ meta → bình luận → công thức đính kèm.
 * Sidebar **không** `sticky`: khối bình luận cao tuỳ ý, dính sẽ khoá chân trang.
 *
 * Chỉ render field thật: `GET /api/posts/{id}` trả `title/content/contentJson/
 * featuredImageUrl/categoryIds/recipeIds/status/flag/viewCount/publishedAt/createdAt`
 * — **không có tác giả, rating, macro, nguyên liệu hay số bình luận**. Công thức lấy từ
 * `GET /api/recipes/{id}`, bài liên quan từ `GET /api/posts/{id}/related`
 * (xem `DOCS/MOCK-FIELDS.md` § Post Detail).
 */
export default function PostDetailPage() {
    const { t } = useTranslation(["post", "home"]);
    const { id = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const language = useUiStore((state) => state.language);
    const openComposer = useUiStore((state) => state.openComposer);
    const { isAuthenticated } = useAuth();

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ["post-detail", id],
        queryFn: () => getPostDetail(id),
        enabled: id !== "",
    });

    const { data: relatedPosts } = useQuery({
        queryKey: ["post-related", id],
        queryFn: () => getRelatedPosts(id, RELATED_COUNT),
        enabled: id !== "",
        retry: false,
    });

    // Bài chỉ trả categoryIds — tra tên qua danh mục public, chưa có thì hiện UUID.
    const categoryNames = useCategoryNames();
    const categoryLabels = (post?.categoryIds ?? [])
        .map((categoryId) => categoryNames.get(categoryId))
        .filter((label): label is string => !!label);

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success(t("shareCopied"));
        } catch {
            toast.error(t("shareCopied"));
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-56" />
                        <Skeleton className="h-[420px] w-full rounded-2xl" />
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                    <div className="hidden space-y-4 lg:block">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-72 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="mx-auto max-w-app px-4 py-16 sm:px-6 lg:px-8">
                <EmptyState
                    icon={FileText}
                    title={t("notFound.title")}
                    description={t("notFound.description")}
                    action={<Button onClick={() => navigate("/explore")}>{t("notFound.action")}</Button>}
                />
            </div>
        );
    }

    // ponytail: PostListResponse không trả authorId — chỉ hiện nút Sửa khi đã đăng nhập,
    // quyền sở hữu do backend chặn ở PATCH /api/posts/{id}.
    const canEdit = isAuthenticated;
    const views = post.viewCount.toLocaleString(language === "vi" ? "vi-VN" : "en-US");
    const publishedDate = formatDateLocale(post.publishedAt ?? post.createdAt, language);
    const readMinutes = estimateReadMinutes(post.content);
    const related = (relatedPosts ?? []).map((item) => item.post);

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb — toàn bề rộng, tách khỏi lưới 2 cột. */}
            <nav aria-label="Breadcrumb" className="mx-auto mb-8 flex max-w-6xl items-center justify-between gap-4">
                <ol className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                    <li>
                        <Link to="/" className="hover:text-vegan-green">
                            {t("breadcrumbHome")}
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                        <Link to="/explore" className="hover:text-vegan-green">
                            {t("explore:title")}
                        </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li className="line-clamp-1 font-medium text-dark" aria-current="page">
                        {post.title}
                    </li>
                </ol>
                <Link
                    to="/explore"
                    className="hidden whitespace-nowrap text-sm font-semibold text-vegan-green hover:underline sm:block"
                >
                    <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {t("backToExplore")}
                </Link>
            </nav>

            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* ── Cột đọc ─────────────────────────────────────────── */}
                <article className="min-w-0">
                    {post.featuredImageUrl && (
                        <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-muted-bg shadow-sm">
                            <img
                                src={post.featuredImageUrl}
                                onError={showFallbackImage()}
                                alt={post.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    )}

                    <header className="mt-8">
                        <div className="flex flex-wrap items-center gap-2">
                            {categoryLabels.length > 0 ? (
                                categoryLabels.map((label) => (
                                    <Badge key={label} variant="lightgreen">
                                        {label}
                                    </Badge>
                                ))
                            ) : (
                                <Badge variant="lightgreen">{t("home:card.blog")}</Badge>
                            )}
                            <PostStatusBadge status={post.status} />
                        </div>

                        <h1 className="font-display mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-dark sm:text-[2.6rem]">
                            {post.title}
                        </h1>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" aria-hidden="true" />
                                {t("publishedOn", { date: publishedDate })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                {t("readTime", { count: readMinutes })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="h-4 w-4" aria-hidden="true" />
                                {t("views", { count: views })}
                            </span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-y border-border py-4">
                            {canEdit && (
                                <Button variant="outline" size="sm" onClick={() => openComposer(post.id)}>
                                    <PenLine className="h-4 w-4" aria-hidden="true" />
                                    {t("editPost")}
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={handleShare}>
                                <Link2 className="h-4 w-4" aria-hidden="true" />
                                {t("share")}
                            </Button>
                        </div>
                    </header>

                    {/* Nội dung — cột đọc ~68 ký tự, chữ 1.0625rem cho dễ đọc đường dài. */}
                    <div className="mt-8 max-w-[68ch]">
                        <PostContent doc={post.contentJson} fallbackText={post.content} className="text-[1.0625rem]" />
                    </div>

                    {post.categoryIds.length > 0 && (
                        <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                            <Tag className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            {post.categoryIds.map((categoryId) => (
                                <Badge key={categoryId} variant="outline">
                                    {categoryNames.get(categoryId) ?? categoryId}
                                </Badge>
                            ))}
                        </div>
                    )}

                </article>

                {/* ── Sidebar ─────────────────────────────────────────── */}
                <aside className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                            {t("sidebar.aboutTitle")}
                        </p>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-muted-foreground">{t("sidebar.published")}</dt>
                                <dd className="text-right font-medium text-dark">{publishedDate}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-muted-foreground">{t("sidebar.readTime")}</dt>
                                <dd className="text-right font-medium text-dark">
                                    {t("readTime", { count: readMinutes })}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-muted-foreground">{t("sidebar.views")}</dt>
                                <dd className="text-right font-medium text-dark tabular-nums">{views}</dd>
                            </div>
                            {categoryLabels.length > 0 && (
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-muted-foreground">{t("sidebar.categories")}</dt>
                                    <dd className="text-right font-medium text-dark">{categoryLabels.join(", ")}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <CommentsSection postId={id} />

                    {post.recipeIds.length > 0 && <AttachedRecipes recipeIds={post.recipeIds} />}
                </aside>
            </div>

            {related.length > 0 && (
                <section className="mx-auto mt-16 max-w-6xl border-t border-border pt-10">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-vegan-green">
                                {t("relatedEyebrow")}
                            </p>
                            <h2 className="font-display mt-1 text-2xl font-semibold text-dark">{t("relatedTitle")}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{t("relatedSubtitle")}</p>
                        </div>
                        <Link to="/explore" className="text-sm font-semibold text-vegan-green hover:underline">
                            {t("relatedViewAll")}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((item) => (
                            <PostCard key={item.id} post={item} language={language} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
