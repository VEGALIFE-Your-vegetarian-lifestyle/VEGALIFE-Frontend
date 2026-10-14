import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { POST_STATUS_VARIANT } from "@/shared/constants/postStatus";
import type { PostStatus } from "@/types/post";

export function PostStatusBadge({ status }: { status: PostStatus }) {
    const { t } = useTranslation("common");
    return <Badge variant={POST_STATUS_VARIANT[status]}>{t(`postStatus.${status}`)}</Badge>;
}
