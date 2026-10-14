import type { JSONContent } from "@tiptap/react";
import type { PostType, UpdatePostRequest } from "@/types/post";

export interface FormValues {
    title: string;
    type: PostType;
    summary: string;
    /** JSON ProseMirror — gửi lên ở field `rawContent` (object). */
    content: JSONContent;
    /** Text thuần suy từ `content` — gửi lên ở field `content`. */
    rawContent: string;
    featuredImageUrl: string;
    videoUrl: string;
    categoryIds: string[];
}

/** `content` là text thuần để BE index; `rawContent` là object JSON ProseMirror. */
export function buildContentPayload(values: FormValues) {
    return {
        content: values.rawContent.trim(),
        rawContent: values.content,
    };
}

/** Body PATCH /api/posts/{id}. Chỉ gửi field có giá trị — bỏ trống nghĩa là giữ nguyên. */
export function buildPatch(values: FormValues): UpdatePostRequest {
    const { content, rawContent } = buildContentPayload(values);

    const patch: UpdatePostRequest = {
        title: values.title.trim(),
        content,
        rawContent,
    };
    // Bỏ trống thì giữ nguyên ảnh cũ, không gửi chuỗi rỗng để xoá.
    if (values.featuredImageUrl.trim()) patch.featuredImageUrl = values.featuredImageUrl.trim();
    if (values.type === "video" && values.videoUrl.trim()) patch.videoUrl = values.videoUrl.trim();
    if (values.categoryIds.length > 0) patch.categoryIds = values.categoryIds;

    return patch;
}
