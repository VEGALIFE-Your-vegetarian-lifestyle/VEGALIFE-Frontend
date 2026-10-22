import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
// TipTap v3 gộp Table/Row/Cell/Header vào một package, chỉ có named export.
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { cn } from "@/shared/utils/cn";
import { EditorToolbar } from "./EditorToolbar";
import { EMPTY_DOC, editorJsonToText } from "./editorContent";

interface RichTextEditorProps {
    value: JSONContent | null;
    onChange: (doc: JSONContent, text: string) => void;
    placeholder?: string;
    /** Ảnh chèn trong bài dùng lại luồng upload sẵn có. */
    onRequestImage?: () => void;
    /** Đưa instance ra ngoài để chỗ gọi chèn ảnh sau khi upload xong. */
    onReady?: (editor: Editor) => void;
    disabled?: boolean;
    error?: boolean;
    className?: string;
}

/**
 * Editor nội dung bài viết.
 *
 * Chỉ dùng extension có whitelist — KHÔNG bật `HTMLAttributes` tự do, nên
 * người dùng không chèn được thẻ lạ. Nội dung lưu dạng JSON ProseMirror và
 * render lại qua `PostContent`, không đi qua `dangerouslySetInnerHTML`.
 */
export function RichTextEditor({
    value,
    onChange,
    placeholder,
    onRequestImage,
    onReady,
    disabled,
    error,
    className,
}: RichTextEditorProps) {
    const { t } = useTranslation("common");

    const editor = useEditor({
        editable: !disabled,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                codeBlock: false,
                // StarterKit v3 đã gói sẵn `link` — tắt để dùng cấu hình Link bên dưới.
                link: false,
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                protocols: ["http", "https"],
            }),
            Image.configure({ inline: false, allowBase64: false }),
            Placeholder.configure({ placeholder: placeholder ?? "" }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: value ?? EMPTY_DOC,
        editorProps: {
            attributes: {
                class: "vega-prose min-h-[320px] px-4 py-3 focus:outline-none",
            },
        },
        onUpdate: ({ editor: instance }) => {
            const doc = instance.getJSON();
            // Text suy từ chính doc vừa đổi — không đọc lại DOM.
            onChange(doc, editorJsonToText(doc));
        },
    });

    // Nạp lại nội dung khi bài được tải xong ở chế độ sửa.
    useEffect(() => {
        if (!editor || !value) return;
        if (JSON.stringify(editor.getJSON()) === JSON.stringify(value)) return;
        editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [editor, disabled]);

    useEffect(() => {
        if (editor) onReady?.(editor);
    }, [editor, onReady]);

    if (!editor) {
        return <div className={cn("h-[380px] rounded-xl border border-border bg-surface", className)} />;
    }

    return (
        <div
            className={cn(
                "overflow-hidden rounded-xl border bg-surface shadow-sm focus-within:ring-2 focus-within:ring-vegan-green",
                error ? "border-danger" : "border-border",
                disabled && "opacity-60",
                className,
            )}
        >
            <EditorToolbar editor={editor} onRequestImage={onRequestImage} disabled={disabled} />
            <EditorContent editor={editor} />
            <p className="border-t border-border px-4 py-2 text-right text-xs text-muted-foreground">
                {t("editor.wordCount", { count: editorJsonToText(editor.getJSON()).split(/\s+/).filter(Boolean).length })}
            </p>
        </div>
    );
}
