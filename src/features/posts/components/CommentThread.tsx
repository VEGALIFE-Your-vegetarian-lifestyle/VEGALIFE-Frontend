import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { formatDateLocale } from "@/shared/utils/formatDate";
import { cn } from "@/shared/utils/cn";
import type { PostCommentThread } from "../types";

interface CommentThreadProps {
    comment: PostCommentThread;
    depth?: number;
    language: string;
}

/**
 * Một comment gốc + cả cây reply. Comment đã xoá mềm vẫn hiện (giữ chỗ cho reply)
 * nhưng không có tác giả và nội dung là chuỗi `[deleted]` do BE trả.
 *
 * Dùng chung Post Detail + card feed Explore — cây đệ quy là phần đắt nhất, không chép lại.
 */
export function CommentThread({ comment, depth = 0, language }: CommentThreadProps) {
    const { t } = useTranslation("post");
    const author = comment.username ?? t("comments.deletedAuthor");

    return (
        <div
            className={cn(
                "rounded-xl border p-4",
                comment.deleted ? "border-dashed border-border bg-surface" : "border-border bg-muted-bg",
                // ponytail: BE trả cây sâu tuỳ ý — thụt lề tối đa 2 cấp cho khỏi tràn trên mobile.
                depth > 0 && "ml-4 mt-3 sm:ml-8",
            )}
        >
            <div className="flex items-center gap-2.5">
                <Avatar name={comment.deleted ? undefined : author} src={comment.avatarUrl} size="sm" />
                <div className="min-w-0">
                    <p className="text-sm font-bold text-dark">{author}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {formatDateLocale(comment.createdAt, language)}
                        {comment.edited && !comment.deleted && (
                            <span className="ml-1.5 italic">{t("comments.edited")}</span>
                        )}
                    </p>
                </div>
            </div>

            <p
                className={cn(
                    "mt-2.5 text-sm leading-relaxed",
                    comment.deleted ? "italic text-muted-foreground" : "text-dark",
                )}
            >
                {comment.content}
            </p>

            {comment.replies.length > 0 && (
                <div className={cn(depth < 2 && "border-l-2 border-vegan-green-muted pl-1")}>
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            depth={Math.min(depth + 1, 2)}
                            language={language}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
