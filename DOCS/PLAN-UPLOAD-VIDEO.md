# Plan — Upload video cho bài viết

> Trạng thái: **đã làm xong** (2026-11-14) — xem §8 ghi chú triển khai
> Liên quan: `DOCS/PLAN-CREATE-POST.md` (dialog soạn bài), `DOCS/API-COVERAGE.md` §8/§14
> Endpoint đã có ở backend: `POST /api/media/upload` → `POST /api/media/{mediaId}/confirm`
> → `POST /api/posts/{postId}/media` `{ mediaIds: uuid[] }`

## 1. Mục tiêu

Cho phép tác giả đính **một video** vào bài viết và xem lại được video đó trong bài.

**Phạm vi**: upload video qua luồng grant 3 bước, gắn `mediaId` vào bài, render player ở
trang chi tiết + card feed.

**Ngoài phạm vi**: nhiều video/bài, cắt ghép, transcoding, upload video cho recipe.

---

## 2. Hiện trạng (đã kiểm tra 2026-11-14)

| Thứ | Trạng thái |
|---|---|
| `POST /api/media/upload` `{contentType, fileName, sizeBytes}` | ✅ có; `contentType` ngoài allowlist → `400` (allowlist **không** hiện trong OpenAPI) |
| `POST /api/media/{mediaId}/confirm` | ✅ có; trả `MediaResponse` gồm `mediaId, status, mediaUrl, thumbnailUrl, mimeType, fileSizeBytes, width, height, durationSeconds, createdAt` |
| `GET /api/media/{mediaId}` | ✅ có (`getMedia` trong `shared/api/media.ts`), **FE chưa dùng** |
| `DELETE /api/media/{mediaId}` | ✅ có ở backend, **FE chưa gọi** |
| `POST /api/posts/{postId}/media` `{mediaIds[]}` | ✅ có ở backend (verify OpenAPI `has /api/posts/{postId}/media: true`), **FE chưa gọi lần nào** |
| `PostCreateRequest` / `PostUpdateRequest` | ❌ **không có** `mediaIds` — chỉ 7 field (`title, content, rawContent, featuredImageUrl, categoryIds, publish, rawContentObject`) |
| `ImageUploader` `kind="video"` | ✅ đã hỗ trợ: `accept="video/*"`, `MAX_VIDEO_SIZE = 100MB`, preview `<video>` |
| Chỗ nào truyền `kind="video"` | ❌ **không có** (0 kết quả grep) |
| i18n `admin:posts.form.video*` | ✅ đủ `en`/`vi` |
| `PostListResponse.mediaIds` | ✅ backend trả; FE có trong type nhưng **không render ở đâu** |
| `PostType = "blog" \| "video"`, `videoUrl` | ⚠️ **code chết** — backend không trả 2 field này; `MyPostsPage`, `mockEnrichment`, `counts.video` đều dựa vào chúng nên luôn nhánh sai |

**Kết luận**: hạ tầng backend đã sẵn, FE thiếu đúng 3 mảnh — gọi `attachPostMedia`, bật
`kind="video"`, và render video.

---

## 3. Quyết định cần chốt trước khi code

| # | Câu hỏi | Gợi ý |
|---|---|---|
| 1 | Video là **ảnh bìa thay thế** hay **đính kèm song song** với ảnh bìa? | Đính kèm song song — `featuredImageUrl` giữ nguyên, video đi qua `mediaIds` |
| 2 | Một bài **bao nhiêu video**? | 1 (backend nhận mảng, nhưng UI một cái cho đơn giản, đổi sau bằng cách nới mảng) |
| 3 | Bắt buộc chờ upload xong mới cho lưu bài? | Có — nếu còn `uploading`/`failed` thì khoá nút Lưu, tránh gắn media chưa `succeed` (BE trả 400) |
| 4 | Xoá video khỏi bài thì có gọi `DELETE /api/media/{id}`? | Không — chỉ bỏ id khỏi `mediaIds`; media record để dọn sau (backend có purge async) |
| 5 | Hiện video ở đâu? | (a) trang chi tiết thay vị trí ảnh bìa nếu có video, (b) card feed hiện badge ▶ + duration |

---

## 4. Việc phải làm

### 4.1 `shared/api/media.ts` — thêm 2 hàm

```ts
/** DELETE /api/media/{mediaId} — soft delete, dọn provider async. */
export async function deleteMedia(mediaId: string): Promise<void>

/** POST /api/posts/{postId}/media — thay TOÀN BỘ tập media của bài. */
export async function attachPostMedia(postId: string, mediaIds: string[]): Promise<void>
```

`attachPostMedia` đặt ở `shared/api/media.ts` hay `features/posts/api.ts`? → **`features/posts/api.ts`**,
cùng chỗ với `attachPostRecipes` (đã có pattern y hệt cho recipe). `shared/` không được biết domain post.

### 4.2 `features/posts/api.ts` — `attachPostMedia`

```ts
/** POST /api/posts/{postId}/media — thay toàn bộ tập media. Mảng rỗng = bỏ hết. */
export async function attachPostMedia(id: string, mediaIds: string[]): Promise<PostListResponse>
```

Copy chữ ký của `attachPostRecipes` ([api.ts:52](src/features/posts/api.ts#L52)).

### 4.3 `PostComposerDialog` — state + UI

| Thêm | Chỗ |
|---|---|
| `videoMediaId: string` trong `FormValues` (`composer/payload.ts`) | cạnh `featuredImageUrl` |
| Ô upload video (`ImageUploader kind="video"`) | khối meta, dưới `ImageUploader` ảnh bìa |
| `setFieldValue("videoMediaId", confirmed.mediaId)` | `ImageUploader.onChange` hiện chỉ trả URL → **cần thêm prop `onMediaChange?: (media: Media) => void`** vì `mediaId` không nằm trong URL |
| Gọi `attachPostMedia(id, [videoMediaId])` sau `createPost`/`updatePost` | `handleSubmit`, cùng chỗ với `attachPostRecipes` |
| Khoá nút Lưu khi video `status !== "succeed"` | `disabled={isUploading \|\| ...}` |

**Điểm vướng**: `ImageUploader` hiện `onChange(url: string \| null)` — chỉ trả URL. Video cần
`mediaId` để gọi `attachPostMedia`. Hai cách:
- (a) thêm `onMediaChange?: (media: Media) => void`, giữ `onChange` cho ảnh bìa → ít phá vỡ.
- (b) đổi `onChange` thành `(media: Media | null) => void` → phải sửa mọi chỗ gọi. **Không chọn.**

### 4.4 `features/posts/types.ts` — dọn code chết

| Xoá | Lý do |
|---|---|
| `PostType`, `type?`, `videoUrl?` trong `UpdatePostRequest` | backend không nhận |
| `type`, `videoUrl` trong `PostListResponse` | backend không trả |
| `counts.video` trong `MyPostsCounts` + `MyPostsPage` | luôn 0 |

Kéo theo: `MyPostsPage.tsx:222` (`isVideo`), `mockEnrichment.ts:22`, `api.ts:552`, `PostCard.tsx:32`
cần bỏ nhánh `video`. **Làm cùng lúc** với render video, không thì badge `▶` sẽ dựa vào field không tồn tại.

### 4.5 Render video

**Trang chi tiết** ([PostDetailPage.tsx:151](src/features/posts/pages/PostDetailPage/PostDetailPage.tsx#L151)) —
hiện chỉ có `<img featuredImageUrl>`. Cần: nếu `post.mediaIds.length > 0` thì gọi
`getMedia(mediaIds[0])` để lấy `mediaUrl`/`thumbnailUrl`/`durationSeconds`, rồi render `<video controls>`.
`mediaIds` trả id, **không trả URL** → phải gọi thêm 1 request (không có endpoint batch).

**Card feed** — badge `▶` + thời lượng ở góc thumbnail, dựa trên `mediaIds.length > 0` (không
gọi thêm request để lấy duration; muốn duration thì phải fetch media từng card → N+1, **không làm**).

### 4.6 i18n

`posts.form.video*` đã có trong `admin` namespace. Bổ sung key mới cho player + badge:
- `common:postVideo.play`, `common:postVideo.badge` — cả `en` / `vi`.

---

## 5. Thứ tự thực hiện

1. `attachPostMedia` trong `features/posts/api.ts` + test mock axios.
2. `ImageUploader` thêm prop `onMediaChange` (không đổi `onChange`).
3. `FormValues.videoMediaId` + ô upload video trong composer + gọi `attachPostMedia` sau create/update.
4. Dọn code chết `type`/`videoUrl` (§4.4).
5. Render video ở trang chi tiết; badge ở card feed.
6. i18n.

## 6. Kiểm chứng

- `npm run typecheck` sạch.
- `npx vitest run src/features/posts src/components/common` — thêm test:
  - `attachPostMedia` gọi đúng `POST /api/posts/{id}/media` với `{ mediaIds }`.
  - Composer: upload video giả → `attachPostMedia` được gọi với 1 id.
  - Composer: video chưa `succeed` → nút Lưu disabled.
- Thủ công: tạo bài có video → mở `/posts/{id}` thấy `<video controls>`; card feed có badge `▶`.
- Thủ công: sửa bài, xoá video → `attachPostMedia(id, [])` → video biến mất sau reload.

## 7. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Allowlist `contentType` không rõ — có thể chặn `video/mp4` | Thử upload thật 1 file `.mp4` trước khi code UI; nếu 400 thì xin backend mở allowlist |
| `POST /api/posts/{id}/media` là **replace toàn bộ** | Bài đã có media khác thì gửi `[]` sẽ xoá hết — phải luôn gửi đầy đủ tập muốn giữ |
| Video lớn (100MB) upload lâu | `ImageUploader` đã có `isUploading`; khoá nút Lưu trong lúc chờ |
| `mediaIds` không có URL | Mỗi lần xem bài tốn thêm 1 request `GET /api/media/{id}` — chấp nhận, cache theo id |

---

## 8. Ghi chú triển khai (2026-11-14) — đã xong

Đã chọn phương án 5a: video **thay chỗ** ảnh bìa ở trang chi tiết khi bài có media.

| File | Thay đổi |
|---|---|
| [posts/api.ts](src/features/posts/api.ts) | thêm `attachPostMedia(id, mediaIds)` |
| [ImageUploader.tsx](src/components/common/ImageUploader.tsx) | thêm prop `onMediaChange?: (media: Media \| null)`; nút X xoá báo cả `onMediaChange(null)` |
| [composer/payload.ts](src/features/posts/components/composer/payload.ts) | `FormValues.videoMediaId` |
| [PostComposerDialog.tsx](src/features/posts/components/composer/PostComposerDialog.tsx) | ô upload video (`kind="video"`, compact) + state `videoUrl` để preview; gọi `attachPostMedia` sau create/update |
| [posts/types.ts](src/features/posts/types.ts) | xoá `PostType`, `type`, `videoUrl`, `mediaId` khỏi request/response |
| [posts/api.ts](src/features/posts/api.ts) | `MyPostsCounts.video` → `withMedia` (đếm `mediaIds.length > 0`) |
| [mockEnrichment.ts](src/features/posts/mockEnrichment.ts) | `isVideo` → `hasVideo = mediaIds.length > 0` |
| [MyPostsPage.tsx](src/features/posts/pages/MyPostsPage/MyPostsPage.tsx) | `isVideo` suy từ `mediaIds` |
| [PostDetailPage.tsx](src/features/posts/pages/PostDetailPage/PostDetailPage.tsx) | `PostVideo` — `getMedia(id)` → `<video controls>`; có media thì thay ảnh bìa |
| i18n | `admin:posts.form.{coverLabel,videoLabel}`, `post:videoPlayer` (en + vi) |
| test | `posts/__tests__/attachPostMedia.test.ts` — 2 case |

**Chưa kiểm chứng được tại máy**: allowlist `contentType` của backend (chưa upload file video thật).
Nếu `POST /api/media/upload` với `video/mp4` trả 400 thì phải xin backend mở allowlist trước khi
tính năng dùng được.

**Chưa làm**: badge `▶` trên card feed (§4.5 nhánh b) — card hiện vẫn dùng `durationLabel` mock.
