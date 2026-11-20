import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { getMedia } from "@/shared/api/media";

/**
 * Lưới media của bài để admin duyệt đúng thứ bị giữ (ADR-029: bài có media đậu ở
 * `pending` dù text đã pass).
 *
 * `mediaIds` chỉ là id — không có endpoint batch nên mỗi tile một `GET /api/media/{id}`.
 * Chỉ mount khi dialog mở, và số media mỗi bài thường rất nhỏ.
 * ponytail: N request cho N media; xin endpoint batch nếu có bài nhiều media.
 */
export function PostMediaReview({ mediaIds }: { mediaIds: string[] }) {
    const { t } = useTranslation("admin");

    const results = useQueries({
        queries: mediaIds.map((id) => ({
            queryKey: ["media", id],
            queryFn: () => getMedia(id),
            staleTime: 5 * 60 * 1000,
            retry: false,
        })),
    });

    // Media lỗi / xoá mềm → bỏ tile, không làm hỏng dialog duyệt.
    const items = results
        .map((result) => result.data)
        .filter((media): media is NonNullable<typeof media> => !!media?.mediaUrl);

    if (mediaIds.length === 0) return null;

    return (
        <div>
            <h3 className="mb-2 text-sm font-semibold text-dark">{t("posts.preview.media")}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {results.some((result) => result.isLoading)
                    ? mediaIds.map((id) => <Skeleton key={id} className="aspect-video rounded-xl" />)
                    : items.map((media) =>
                          media.mimeType?.startsWith("video/") ? (
                              <video
                                  key={media.mediaId}
                                  src={media.mediaUrl ?? undefined}
                                  poster={media.thumbnailUrl ?? undefined}
                                  controls
                                  preload="metadata"
                                  playsInline
                                  className="aspect-video w-full rounded-xl bg-black"
                              />
                          ) : (
                              <img
                                  key={media.mediaId}
                                  src={media.mediaUrl ?? ""}
                                  alt={media.description ?? ""}
                                  loading="lazy"
                                  className="aspect-video w-full rounded-xl border border-border object-cover"
                              />
                          ),
                      )}
            </div>
        </div>
    );
}
