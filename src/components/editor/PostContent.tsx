import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
// TipTap v3 gộp Table/Row/Cell/Header vào một package, chỉ có named export.
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { cn } from "@/lib/utils";

interface PostContentProps {
    /** JSON ProseMirror. */
    doc: JSONContent | null | undefined;
    /** Text thuần của bài cũ (chưa có JSON) — hiện giữ nguyên xuống dòng. */
    fallbackText?: string | null;
    className?: string;
}

/**
 * Hiển thị nội dung bài viết.
 *
 * Chỉ dựng lại từ JSON qua schema của ProseMirror — không nhận HTML thô, nên
 * không có đường chèn script. Bài cũ (text thuần) rơi về nhánh `whitespace-pre-wrap`.
 */
export function PostContent({ doc, fallbackText, className }: PostContentProps) {
    const editor = useEditor(
        {
            editable: false,
            extensions: [
                StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, link: false }),
                Link.configure({ openOnClick: true, protocols: ["http", "https"] }),
                Image.configure({ inline: false, allowBase64: false }),
                Table.configure({ resizable: false }),
                TableRow,
                TableHeader,
                TableCell,
            ],
            content: doc ?? { type: "doc", content: [] },
            editorProps: { attributes: { class: "vega-prose focus:outline-none" } },
        },
        [doc],
    );

    if (!doc && fallbackText) {
        return <div className={cn("whitespace-pre-wrap text-base leading-relaxed text-dark", className)}>{fallbackText}</div>;
    }

    if (!editor) return null;

    return (
        <div className={className}>
            <EditorContent editor={editor} />
        </div>
    );
}
