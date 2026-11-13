import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { Check, Copy } from "lucide-react";
import { cn } from "@/shared/utils/cn";

/**
 * Nội dung tin nhắn của trợ lý — render markdown thay vì `whitespace-pre-wrap`.
 *
 * Model trả về đậm/nghiêng, gạch đầu dòng, tiêu đề, bảng… nên phải parse. `react-markdown`
 * render sang React element (không `dangerouslySetInnerHTML`) nên nội dung do model sinh ra
 * không có đường XSS.
 *
 * `remark-gfm` để có bảng + gạch ngang + link tự nhận. Không bật `rehype-raw`: HTML thô trong
 * câu trả lời sẽ hiện dạng chữ, đúng ý (không chạy).
 */
export function MarkdownMessage({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed text-muted-foreground">
            <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Tiêu đề trong chat không nên to bằng trang thật — thu nhỏ toàn bộ một bậc.
                    h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-bold text-dark first:mt-0">{children}</h3>,
                    h2: ({ children }) => <h3 className="mb-1.5 mt-3 text-[15px] font-bold text-dark first:mt-0">{children}</h3>,
                    h3: ({ children }) => <h4 className="mb-1 mt-2.5 text-sm font-bold text-dark first:mt-0">{children}</h4>,
                    h4: ({ children }) => <h5 className="mb-1 mt-2.5 text-sm font-semibold text-dark first:mt-0">{children}</h5>,
                    p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-dark">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="my-1.5 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ul>,
                    ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ol>,
                    li: ({ children }) => <li className="pl-0.5">{children}</li>,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-vegan-green underline underline-offset-2 hover:no-underline"
                        >
                            {children}
                        </a>
                    ),
                    code: ({ children }) => (
                        <code className="rounded bg-surface px-1 py-0.5 font-mono text-[12.5px] text-dark">{children}</code>
                    ),
                    pre: ({ children }) => (
                        <pre className="my-2 overflow-x-auto rounded-lg bg-surface p-3 text-[12.5px] leading-relaxed">
                            {children}
                        </pre>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="my-2 border-l-2 border-vegan-green-muted pl-3 text-muted-foreground">
                            {children}
                        </blockquote>
                    ),
                    hr: () => <hr className="my-3 border-border" />,
                    table: ({ children }) => (
                        <div className="my-2 overflow-x-auto">
                            <table className="w-full border-collapse text-[13px]">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border bg-surface px-2 py-1.5 text-left font-bold text-dark">{children}</th>
                    ),
                    td: ({ children }) => <td className="border border-border px-2 py-1.5">{children}</td>,
                }}
            >
                {text}
            </Markdown>
        </div>
    );
}

/** Nút Copy dưới tin nhắn trợ lý — giống ChatGPT, chỉ chép text gốc (không kèm định dạng). */
export function CopyMessageButton({ text, className }: { text: string; className?: string }) {
    const { t } = useTranslation("aiNutrition");
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Trình duyệt chặn clipboard (không HTTPS / thiếu quyền) — im lặng, không phá UI.
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={t("chat.copy")}
            title={t("chat.copy")}
            className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-dark",
                className,
            )}
        >
            {copied ? (
                <>
                    <Check className="h-3.5 w-3.5 text-vegan-green" aria-hidden="true" />
                    {t("chat.copied")}
                </>
            ) : (
                <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("chat.copy")}
                </>
            )}
        </button>
    );
}
