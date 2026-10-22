import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Film, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmUpload, createUploadGrant, uploadFileToProvider } from "@/shared/api/media";
import { cn } from "@/shared/utils/cn";

interface ImageUploaderProps {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
    /** `video` dùng cùng luồng upload 3 bước, chỉ khác định dạng và nhãn. */
    kind?: "image" | "video";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

/** Nhãn i18n theo loại tệp — ảnh giữ nguyên key cũ để không phải đổi chỗ gọi nào khác. */
const LABELS = {
    image: {
        invalidType: "posts.form.invalidImageType",
        tooLarge: "posts.form.imageTooLarge",
        failed: "posts.form.uploadFailed",
        remove: "posts.form.removeImage",
        dropzoneTitle: "posts.form.dropzoneTitle",
        dropzoneHint: "posts.form.dropzoneHint",
        upload: "posts.form.uploadImage",
    },
    video: {
        invalidType: "posts.form.videoInvalidType",
        tooLarge: "posts.form.videoTooLarge",
        failed: "posts.form.videoFailed",
        remove: "posts.form.videoRemove",
        dropzoneTitle: "posts.form.videoDropzoneTitle",
        dropzoneHint: "posts.form.videoDropzoneHint",
        upload: "posts.form.videoUpload",
    },
} as const;

export function ImageUploader({ value, onChange, disabled, kind = "image" }: ImageUploaderProps) {
    const { t } = useTranslation("admin");
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isVideo = kind === "video";
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    const label = LABELS[kind];

    const upload = async (file: File) => {
        if (!file.type.startsWith(`${kind}/`)) {
            toast.error(t(label.invalidType));
            return;
        }

        if (file.size > maxSize) {
            toast.error(t(label.tooLarge));
            return;
        }

        setIsUploading(true);
        try {
            const grant = await createUploadGrant({
                contentType: file.type,
                fileName: file.name,
                sizeBytes: file.size,
            });

            await uploadFileToProvider(grant.upload.url, grant.upload.fields, file);
            const confirmed = await confirmUpload(grant.mediaId);

            if (confirmed.mediaUrl) {
                onChange(confirmed.mediaUrl);
            } else {
                throw new Error("Media upload confirmation returned no URL");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : t(label.failed);
            toast.error(message);
        } finally {
            setIsUploading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (disabled || isUploading) return;
        const file = event.dataTransfer.files?.[0];
        if (file) void upload(file);
    };

    return (
        <div className="space-y-3">
            <input
                ref={inputRef}
                type="file"
                accept={isVideo ? "video/*" : "image/*"}
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="hidden"
            />

            {value ? (
                <div className="relative inline-block">
                    {isVideo ? (
                        <video src={value} controls className="w-full rounded-xl border border-border" />
                    ) : (
                        <img
                            src={value}
                            alt="Preview"
                            className="h-40 w-full rounded-xl border border-border object-cover"
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        disabled={disabled || isUploading}
                        className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white shadow-sm disabled:opacity-50"
                        aria-label={t(label.remove)}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                // Vùng kéo-thả theo mockup; bấm vào cũng mở hộp chọn tệp.
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
                        isDragging ? "border-vegan-green bg-vegan-green-subtle" : "border-border bg-muted-bg",
                    )}
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-vegan-green-light text-vegan-green">
                        {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        ) : isVideo ? (
                            <Film className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <ImagePlus className="h-5 w-5" aria-hidden="true" />
                        )}
                    </span>
                    <p className="mt-3 text-sm font-semibold text-dark">
                        {isUploading ? t("posts.form.uploading") : t(label.dropzoneTitle)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(label.dropzoneHint)}</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled || isUploading}
                    >
                        <Upload className="h-4 w-4" aria-hidden="true" />
                        {t(label.upload)}
                    </Button>
                </div>
            )}
        </div>
    );
}
