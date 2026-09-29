import { Badge } from "@/components/ui/badge";
import { POST_STATUS_LABEL, POST_STATUS_VARIANT } from "@/shared/constants/postStatus";
import type { PostStatus } from "@/types/post";

export function PostStatusBadge({ status }: { status: PostStatus }) {
    return <Badge variant={POST_STATUS_VARIANT[status]}>{POST_STATUS_LABEL[status]}</Badge>;
}