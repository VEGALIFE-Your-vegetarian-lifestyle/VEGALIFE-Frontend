import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { POST_STATUS_VARIANT } from "../constants";
import type { PostStatus } from "../types";

/**
 * `raw` = hiện đúng giá trị backend trả (`drafted`/`processing`/`published`/`unpublished`)
 * thay vì nhãn dịch — dùng ở màn admin để khỏi lệch với response.
 */
export function PostStatusBadge({ status, raw = false }: { status: PostStatus; raw?: boolean }) {
    const { t } = useTranslation("common");
    return <Badge variant={POST_STATUS_VARIANT[status]}>{raw ? status : t(`postStatus.${status}`)}</Badge>;
}
