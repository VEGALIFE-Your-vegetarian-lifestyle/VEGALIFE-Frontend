import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { POST_FLAG_VARIANT } from "../constants";
import type { FlagDetail, PostFlag, PostStatus } from "../types";

/**
 * Verdict của lần kiểm duyệt tự động gần nhất + bằng chứng (`flagDetail`).
 *
 * `flag` chỉ mô tả máy đã thấy gì, KHÔNG quyết định bài có hiển thị hay không —
 * câu trả lời đó là `status`. Vì vậy bài `published` vẫn có thể mang `FILTER_FAILED`
 * (admin duyệt đè); khi đó hiện thêm chip "Duyệt dù máy chặn" thay vì giấu flag.
 */
export function PostFlagBadge({
    status,
    flag,
    flagDetail,
}: {
    status: PostStatus;
    flag: PostFlag | null;
    flagDetail?: FlagDetail | null;
}) {
    const { t } = useTranslation(["admin", "common"]);

    if (!flag) return <span className="text-muted-foreground">—</span>;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={POST_FLAG_VARIANT[flag]} size="sm">
                {t(`common:postFlag.${flag}`)}
            </Badge>

            {/* Chỉ so sánh score khi BE snapshot đủ cả 2 vế; threshold thiếu = "không rõ". */}
            {flagDetail?.kind === "FILTER_FAILED" &&
                flagDetail.score !== undefined &&
                flagDetail.threshold !== undefined && (
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                        {t("posts.list.flagDetail.score", {
                            score: flagDetail.score,
                            threshold: flagDetail.threshold,
                        })}
                    </span>
                )}

            {flagDetail?.kind === "SIMILAR_CONTENT" && flagDetail.similarity !== undefined && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                    {flagDetail.postId ? (
                        <Link to={`/posts/${flagDetail.postId}`} className="hover:text-vegan-green hover:underline">
                            {t("posts.list.flagDetail.similarity", {
                                percent: Math.round(flagDetail.similarity * 100),
                            })}
                        </Link>
                    ) : (
                        t("posts.list.flagDetail.similarity", {
                            percent: Math.round(flagDetail.similarity * 100),
                        })
                    )}
                </span>
            )}

            {status === "published" && flag !== "FILTER_PASSED" && (
                <Badge variant="cream" size="sm">
                    {t("posts.list.overFilter")}
                </Badge>
            )}
        </div>
    );
}
