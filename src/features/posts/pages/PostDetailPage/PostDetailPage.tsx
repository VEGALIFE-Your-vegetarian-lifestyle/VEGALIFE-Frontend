import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft,
    BadgeCheck,
    Calendar,
    Eye,
    FileText,
    Link2,
    PenLine,
    Play,
    ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCardCompact } from "../../components/PostCard";
import { PostStatusBadge } from "../../components/PostStatusBadge";
import { PostContent } from "../../components/editor/PostContent";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { useAuth } from "@/features/auth/useAuth";
import { useFeedPosts } from "../../useFeedPosts";
import { useCategoryNames } from "@/features/categories/usePublicCategories";
import { getPostDetail } from "../../api";
import { useUiStore } from "@/shared/ui/uiStore";
import { estimateReadMinutes, formatDateLocale } from "@/shared/utils/formatDate";
import { ChefSecretCard } from "./ChefSecretCard";
import { CommentsSection } from "./CommentsSection";
import { FactStrip } from "./FactStrip";
import { IngredientsCard, type Scale } from "./IngredientsCard";
import { InstructionsCard } from "./InstructionsCard";

/** Bấm vào phần chưa có API → báo đang phát triển thay vì im lặng. */
function useFeatureDeveloping() {
    const { t } = useTranslation("common");
    return () => toast.info(t("featureDeveloping"));
}

export default function PostDetailPage() {
    const { t } = useTranslation(["post", "home"]);
    const { id = "" } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const language = useUiStore((state) => state.language);
    const { isAuthenticated } = useAuth();
    const developing = useFeatureDeveloping();
    const [scale, setScale] = useState<Scale>(1);

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ["post-detail", id],
        queryFn: () => getPostDetail(id),
        enabled: id !== "",
    });

    // ponytail: chưa có API "bài liên quan" — lấy feed rồi bỏ bài hiện tại ra.
    const { data: feed } = useFeedPosts({ page: 0, size: 6, enabled: !!post });
    const related = (feed?.content ?? []).filter((item) => item.id !== id).slice(0, 4);

    // Bài chỉ trả categoryIds — tra tên qua danh mục public, chưa có thì hiện UUID.
    const categoryNames = useCategoryNames();

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
            <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
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
    const isVideo = post.type === "video";
    const nutrition = post.nutrition;
    const totalMacro = nutrition ? nutrition.proteinG + nutrition.carbsG + nutrition.fatG : 0;

    const macros = nutrition
        ? [
              { key: "protein", label: t("macro.protein"), grams: nutrition.proteinG, tone: "green" as const },
              { key: "carbs", label: t("macro.carbs"), grams: nutrition.carbsG, tone: "indigo" as const },
              { key: "fat", label: t("macro.fat"), grams: nutrition.fatG, tone: "amber" as const },
              { key: "fiber", label: t("macro.fiber"), grams: nutrition.fiberG, tone: "info" as const },
          ]
        : [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-between gap-4">
                <ol className="flex items-center gap-2 text-sm text-muted-foreground">
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
                <Link to="/explore" className="hidden whitespace-nowrap text-sm font-semibold text-vegan-green hover:underline sm:block">
                    <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden="true" />
                    {t("backToExplore")}
                </Link>
            </nav>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main */}
                <article className="lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="lightgreen">{isVideo ? t("home:card.video") : t("home:card.recipe")}</Badge>
                        <PostStatusBadge status={post.status} />
                        {post.difficulty && <Badge variant="outline">{post.difficulty}</Badge>}
                    </div>

                    <h1 className="mt-3 text-3xl font-extrabold leading-tight text-dark sm:text-4xl">{post.title}</h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Avatar name={post.authorCard?.username} size="xs" />
                            {post.authorCard?.username ?? t("authorBadge")}
                            <BadgeCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            {t("publishedOn", { date: formatDateLocale(post.createdAt, language) })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            {t("views", { count: post.viewCount.toLocaleString(language === "vi" ? "vi-VN" : "en-US") })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            {t("readTime", { count: estimateReadMinutes(post.content) })}
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {canEdit && (
                            <Button variant="outline" onClick={() => navigate(`/posts/${post.id}/edit`)}>
                                <PenLine className="h-4 w-4" aria-hidden="true" />
                                {t("editPost")}
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleShare}>
                            <Link2 className="h-4 w-4" aria-hidden="true" />
                            {t("share")}
                        </Button>
                        {/* ponytail: lưu bài chưa có endpoint — nút chỉ để đủ UI. */}
                        <Button variant="outline" onClick={developing}>
                            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                            {t("savePost")}
                        </Button>
                    </div>

                    {/* Hero media */}
                    <div className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-muted-bg">
                        {isVideo && post.videoUrl ? (
                            <video src={post.videoUrl} controls className="h-auto w-full" preload="metadata">
                                <track kind="captions" />
                            </video>
                        ) : post.featuredImageUrl ? (
                            <img src={post.featuredImageUrl} alt={post.title} className="h-auto w-full object-cover" />
                        ) : (
                            <div className="flex h-64 items-center justify-center text-muted-foreground">
                                <Play className="h-12 w-12" aria-hidden="true" />
                            </div>
                        )}
                    </div>

                    {/* Fact strip — dữ liệu mock, xem features/posts/mockEnrichment.ts */}
                    <FactStrip post={post} />

                    {/* Macro bar */}
                    {nutrition && (
                        <SectionCard className="mt-6" title={t("nutrition.title")} eyebrow={t("nutrition.eyebrow")}>
                            <div className="space-y-3">
                                {macros.map((macro) => (
                                    <div key={macro.key}>
                                        <div className="mb-1 flex items-center justify-between text-xs">
                                            <span className="font-semibold text-dark">{macro.label}</span>
                                            <span className="text-muted-foreground">
                                                {macro.grams}g
                                                {totalMacro > 0 && macro.key !== "fiber" && (
                                                    <span className="ml-1">
                                                        ({Math.round((macro.grams / totalMacro) * 100)}%)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <Progress value={(macro.grams / Math.max(totalMacro, 1)) * 100} tone={macro.tone} />
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                    )}

                    {/* Content — dựng từ JSON ProseMirror, bài cũ rơi về text thuần */}
                    <div className="mt-8">
                        <PostContent doc={post.contentJson} fallbackText={post.content} />
                    </div>

                    {/* Ingredients */}
                    {post.ingredientGroups && post.ingredientGroups.length > 0 && (
                        <IngredientsCard groups={post.ingredientGroups} scale={scale} onScaleChange={setScale} />
                    )}

                    {/* Cooking instructions */}
                    {post.steps && post.steps.length > 0 && <InstructionsCard steps={post.steps} />}

                    {/* Chef's Kitchen Secret */}
                    {post.chefTip && <ChefSecretCard tip={post.chefTip} />}

                    {post.categoryIds.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                            {post.categoryIds.map((categoryId) => (
                                <Badge key={categoryId} variant="outline">
                                    {categoryNames.get(categoryId) ?? categoryId}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Community Notes */}
                    <CommentsSection postId={id} onFeatureDeveloping={developing} />
                </article>

                {/* Sidebar */}
                <aside className="space-y-6">
                    {post.authorCard && (
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <Avatar name={post.authorCard.username} src={post.authorCard.avatarUrl} size="lg" verified />
                                <div className="min-w-0">
                                    <p className="flex items-center gap-1 font-bold text-dark">
                                        {post.authorCard.username}
                                        <BadgeCheck className="h-4 w-4 text-vegan-green" aria-hidden="true" />
                                    </p>
                                    <p className="text-xs text-muted-foreground">{post.authorCard.role}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.authorCard.bio}</p>

                            <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                                <span>
                                    <strong className="text-dark">{post.authorCard.followers.toLocaleString()}</strong>{" "}
                                    {t("author.followers")}
                                </span>
                                <span>
                                    <strong className="text-dark">{post.authorCard.postCount}</strong> {t("author.posts")}
                                </span>
                            </div>

                            <div className="mt-4 flex gap-2">
                                {/* ponytail: theo dõi tác giả chưa có endpoint. */}
                                <Button block onClick={developing}>
                                    {t("author.follow")}
                                </Button>
                                <Button variant="outline" onClick={developing}>
                                    {t("author.portfolio")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {related.length > 0 && (
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <h2 className="font-bold text-dark">{t("relatedTitle")}</h2>
                            <p className="mt-1 text-xs text-muted-foreground">{t("relatedSubtitle")}</p>
                            <div className="mt-4 space-y-3">
                                {related.map((item) => (
                                    <PostCardCompact key={item.id} post={item} language={language} />
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}
