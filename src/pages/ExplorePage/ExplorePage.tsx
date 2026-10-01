import { useState } from "react";
import { PenLine, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/formatDate";
import type { PostListResponse } from "@/types/post";

interface PostCardProps {
    post: PostListResponse;
}

function PostCard({ post }: PostCardProps) {
    const [upVotes, setUpVotes] = useState(0);
    const [downVotes, setDownVotes] = useState(0);
    const [commentCount] = useState(0);

    return (
        <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">
            {post.featuredImageUrl && (
                <div className="mb-4 -mt-5 -mx-5 overflow-hidden rounded-t-2xl">
                    <img
                        src={post.featuredImageUrl}
                        alt={post.title}
                        className="h-48 w-full object-cover"
                    />
                </div>
            )}

            <div className="flex flex-wrap gap-1">
                <Badge variant="lightgreen" size="sm">
                    {post.type === "video" ? "Video" : "Blog"}
                </Badge>
            </div>

            <h3 className="mt-3 font-semibold text-dark">{post.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{post.content}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{post.viewCount} lượt xem</span>
                <span>{formatDate(post.createdAt)}</span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setUpVotes((prev) => prev + 1)}
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:bg-vegan-green-light hover:text-vegan-green"
                        aria-label="Upvote"
                    >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{upVotes}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDownVotes((prev) => prev + 1)}
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:bg-terracotta/10 hover:text-terracotta"
                        aria-label="Downvote"
                    >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{downVotes}</span>
                    </button>
                </div>

                <button
                    type="button"
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:bg-accent hover:text-vegan-green"
                    aria-label="Comments"
                >
                    <MessageCircle className="h-4 w-4" />
                    <span>{commentCount}</span>
                </button>
            </div>
        </article>
    );
}

export default function ExplorePage() {
    const { isAuthenticated } = useAuth();
    const { data, isLoading, isError, error } = useFeedPosts({ page: 0, size: 20 });

    const posts = data?.content ?? [];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark sm:text-3xl">Explore</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Khám phá bài viết và công thức từ cộng đồng</p>
                </div>
                <Button asChild variant="outline">
                    <Link to={isAuthenticated ? "/posts/create" : "/login"}>
                        <PenLine className="h-4 w-4" />
                        Tạo bài viết
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-2xl" />
                    ))}
                </div>
            ) : isError ? (
                <p className="text-sm text-terracotta">
                    {(error instanceof Error ? error.message : "Không thể tải bài viết. Vui lòng thử lại sau.")}
                </p>
            ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có bài viết nào.</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
