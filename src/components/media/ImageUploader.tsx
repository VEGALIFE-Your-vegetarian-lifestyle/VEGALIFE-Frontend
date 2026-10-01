import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmUpload, createUploadGrant, uploadFileToProvider } from "@/services/mediaService";

interface ImageUploaderProps {
    value: string | null;
    onChange: (url: string | null) => void;
    disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
    const { t } = useTranslation("admin");
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t("posts.form.invalidImageType"));
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.error(t("posts.form.imageTooLarge"));
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
            const message = error instanceof Error ? error.message : t("posts.form.uploadFailed");
            toast.error(message);
        } finally {
            setIsUploading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-3">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="hidden"
            />

            {value ? (
                <div className="relative inline-block">
                    <img
                        src={value}
                        alt="Preview"
                        className="h-40 w-full rounded-xl border border-border object-cover"
                    />
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        disabled={disabled || isUploading}
                        className="absolute -right-2 -top-2 rounded-full bg-terracotta p-1 text-white shadow-sm disabled:opacity-50"
                        aria-label={t("posts.form.removeImage")}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || isUploading}
                >
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isUploading ? t("posts.form.uploading") : t("posts.form.uploadImage")}
                </Button>
            )}
        </div>
    );
}
