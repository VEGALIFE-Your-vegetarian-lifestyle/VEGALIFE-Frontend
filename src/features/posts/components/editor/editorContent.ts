import type { JSONContent } from "@tiptap/react";

/**
 * Nội dung bài viết được lưu ở HAI dạng:
 * - `content`     — text thuần, để tìm kiếm / trích đoạn / hiển thị ở card.
 * - `rawContent`  — object JSON của ProseMirror, dùng để render lại (không có đường XSS).
 */

/** Duyệt cây ProseMirror, gom text của mọi node lá. */
export function editorJsonToText(doc: JSONContent | null | undefined): string {
    if (!doc) return "";

    const parts: string[] = [];

    const walk = (node: JSONContent) => {
        if (typeof node.text === "string") {
            parts.push(node.text);
            return;
        }
        const isBlock = node.type === "paragraph" || node.type === "heading" || node.type === "blockquote";
        node.content?.forEach(walk);
        // Xuống dòng SAU khối, để text không dính liền nhau.
        if (isBlock) parts.push("\n");
    };

    walk(doc);

    return parts
        .join("")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{2,}/g, "\n")
        .trim();
}

/** Editor rỗng vẫn là một doc hợp lệ — Yup `required` sẽ cho qua nếu không kiểm riêng. */
export function isEditorEmpty(doc: JSONContent | null | undefined): boolean {
    return editorJsonToText(doc).length === 0;
}

/** Doc rỗng chuẩn, dùng làm giá trị khởi tạo. */
export const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/**
 * `rawContent` là JSON ProseMirror — object khi BE trả, chuỗi khi bài cũ.
 * Trả `null` khi không phải doc hợp lệ → chỗ gọi rơi về `content` (text thuần).
 */
export function parseStoredContent(rawContent: JSONContent | string | null | undefined): JSONContent | null {
    if (!rawContent) return null;
    if (typeof rawContent === "object") return rawContent.type === "doc" ? rawContent : null;
    const trimmed = rawContent.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
        const parsed = JSON.parse(trimmed) as JSONContent;
        return parsed?.type === "doc" ? parsed : null;
    } catch {
        return null;
    }
}

/** Text thuần → doc, để bài cũ mở được trong editor mà không mất nội dung. */
export function textToDoc(text: string): JSONContent {
    const blocks = text.split(/\n{2,}/).filter((block) => block.trim().length > 0);
    if (blocks.length === 0) return EMPTY_DOC;
    return {
        type: "doc",
        content: blocks.map((block) => ({
            type: "paragraph",
            content: [{ type: "text", text: block.trim() }],
        })),
    };
}
