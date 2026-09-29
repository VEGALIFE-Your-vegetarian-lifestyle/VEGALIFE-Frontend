import { Check, X } from "lucide-react";
import { PostStatusBadge } from "@/components/blog/PostStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/utils/formatDate";
import type { Post } from "@/types/post";

interface PostPreviewDialogProps {
    open: boolean;
    post: Post | null;
    approving: boolean;
    onApprove: (post: Post) => void;
    onReject: (post: Post) => void;
    onClose: () => void;
}

export function PostPreviewDialog({ open, post, approving, onApprove, onReject, onClose }: PostPreviewDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} title={post?.title ?? ""} className="max-w-2xl">
            {post && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <PostStatusBadge status={post.status} />
                        <span>@{post.author.username}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {post.categories.map((category) => (
                            <Badge key={category.id} variant="outline">
                                {category.name}
                            </Badge>
                        ))}
                    </div>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-dark">{post.content}</p>
                    {post.rejectReason && (
                        <div className="rounded-lg bg-cream p-3 text-sm text-dark">
                            <span className="font-medium">Lý do từ chối: </span>
                            {post.rejectReason}
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Đóng
                        </Button>
                        {post.status === "processed" && (
                            <>
                                <Button variant="outline" onClick={() => onReject(post)}>
                                    <X className="h-4 w-4" />
                                    Từ chối
                                </Button>
                                <Button disabled={approving} onClick={() => onApprove(post)}>
                                    <Check className="h-4 w-4" />
                                    Duyệt bài
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}