import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import {
    Bold,
    Code,
    Heading2,
    Heading3,
    ImagePlus,
    Italic,
    Link2,
    List,
    ListOrdered,
    Minus,
    Quote,
    Redo2,
    Table as TableIcon,
    Undo2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface EditorToolbarProps {
    editor: Editor;
    onRequestImage?: () => void;
    disabled?: boolean;
}

interface ToolButtonProps {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    label: string;
    children: ReactNode;
}

function ToolButton({ onClick, active, disabled, label, children }: ToolButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40",
                active ? "bg-vegan-green-light text-vegan-green" : "text-muted-foreground hover:bg-muted-bg hover:text-dark",
            )}
        >
            {children}
        </button>
    );
}

/** Thanh công cụ editor — mỗi nút chỉ gọi lệnh có sẵn của TipTap. */
export function EditorToolbar({ editor, onRequestImage, disabled }: EditorToolbarProps) {
    const { t } = useTranslation("common");

    const setLink = () => {
        const previous = editor.getAttributes("link").href as string | undefined;
        const url = window.prompt(t("editor.linkPrompt"), previous ?? "https://");
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        // Chỉ nhận http/https — chặn `javascript:` từ ô nhập.
        if (!/^https?:\/\//i.test(url)) return;
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted-bg/60 px-2 py-1.5">
            <ToolButton
                label={t("editor.bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                disabled={disabled}
            >
                <Bold className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                disabled={disabled}
            >
                <Italic className="h-4 w-4" />
            </ToolButton>

            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

            <ToolButton
                label={t("editor.h2")}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive("heading", { level: 2 })}
                disabled={disabled}
            >
                <Heading2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.h3")}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive("heading", { level: 3 })}
                disabled={disabled}
            >
                <Heading3 className="h-4 w-4" />
            </ToolButton>

            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

            <ToolButton
                label={t("editor.bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                disabled={disabled}
            >
                <List className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                disabled={disabled}
            >
                <ListOrdered className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.quote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive("blockquote")}
                disabled={disabled}
            >
                <Quote className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.code")}
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={editor.isActive("code")}
                disabled={disabled}
            >
                <Code className="h-4 w-4" />
            </ToolButton>

            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

            <ToolButton label={t("editor.link")} onClick={setLink} active={editor.isActive("link")} disabled={disabled}>
                <Link2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.image")}
                onClick={() => onRequestImage?.()}
                disabled={disabled || !onRequestImage}
            >
                <ImagePlus className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.table")}
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
                disabled={disabled}
            >
                <TableIcon className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.divider")}
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                disabled={disabled}
            >
                <Minus className="h-4 w-4" />
            </ToolButton>

            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />

            <ToolButton
                label={t("editor.undo")}
                onClick={() => editor.chain().focus().undo().run()}
                disabled={disabled || !editor.can().undo()}
            >
                <Undo2 className="h-4 w-4" />
            </ToolButton>
            <ToolButton
                label={t("editor.redo")}
                onClick={() => editor.chain().focus().redo().run()}
                disabled={disabled || !editor.can().redo()}
            >
                <Redo2 className="h-4 w-4" />
            </ToolButton>
        </div>
    );
}
