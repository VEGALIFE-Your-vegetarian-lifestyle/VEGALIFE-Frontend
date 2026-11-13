# Kế hoạch cập nhật FE — post `status` + verdict `flag` (BE V56/V57/V58)

**Spec nguồn:** `DOCS/frontend-api-changes-post-status-flag.md`
**Date:** 2026-11-13
**Trạng thái:** kế hoạch, chưa implement.

---

## Context

BE (VEGALIFE-backend, migration V56/V57/V58, đã merge `dev`) đổi mô hình kiểm duyệt bài:

- `status` đổi tên/rút gọn: `created`→`drafted`, `processed`→`processing`, `hidden` biến mất. Còn đúng 4 giá trị: `drafted | processing | published | unpublished`.
- `flag` không còn là "filter verdict" mà là **verdict cuối**, sống sót qua publish/approve/reject. Vocab mới: `FILTER_PASSED | FILTER_FAILED | SIMILAR_CONTENT | FILTER_SKIPPED | null`.
- `flag`/`flagDetail` **bị bỏ khỏi mọi response member** (`PostListResponse`); chỉ còn ở admin endpoints.
- `flagDetail` giờ là **object** (`{kind, outcome?, score?, threshold?, postId?, similarity?, cause?}`) thay cho string.
- `publish: true` **không còn publish ngay** — chỉ submit, trả `processing`, filter chạy async mới flip `published`.
- Admin list default `flag` là `all` (không phải `NEEDS_REVIEW`).
- `PATCH /api/posts/{id}/visibility` đã xoá (FE chưa từng gọi — không phải việc).

Hiện FE compile được nhưng render sai toàn bộ vocabulary và sẽ vỡ khi payload mới về (`POST_STATUS_VARIANT[status]` → `undefined`).

Kết quả mong muốn: FE dùng đúng vocab, member UI không đọc `flag` nữa, admin UI hiện được bằng chứng verdict, và trạng thái `processing` tự cập nhật khi filter trả kết quả.

---

## 1. Types — `src/features/posts/types.ts`

```ts
export type PostStatus = "drafted" | "processing" | "published" | "unpublished";

export type PostFlag = "FILTER_PASSED" | "FILTER_FAILED" | "SIMILAR_CONTENT" | "FILTER_SKIPPED";

/** Bằng chứng verdict — field nào không thuộc kind đó thì VẮNG MẶT (không phải null). */
export type FlagDetail = {
    kind: PostFlag;
    outcome?: "FAIL" | "UNCERTAIN";
    score?: number;
    threshold?: number;
    postId?: string;
    similarity?: number;
    cause?: "DISABLED" | "SWEPT" | "UNAVAILABLE";
};
```

- `AdminPost`: giữ `flag: PostFlag | null`, thêm `flagDetail?: FlagDetail | null`, `rejectionReason?: string | null`.
- `PostListResponse`: **xoá `flag`**; giữ `status`, `rejectionReason`. Sửa comment `rejectionReason` từ "chỉ dùng khi `flag === REJECTED`" → "chỉ có khi `status === "unpublished"`".
- `CreatePostResponse`: xoá `flag`, thêm `rejectionReason?: string | null`.
- Sửa comment đầu file (dòng 3-5) và `UpdatePostRequest.publish` (true = submit → `processing`, false = withdraw → `drafted`).
- `src/features/saved/types.ts`: xoá field `flag`, bỏ `PostFlag` khỏi import (member endpoint không trả nữa).

## 2. Constants — `src/features/posts/constants.ts`

- `POST_STATUS_VARIANT` keys → `drafted: "secondary"`, `processing: "cream"`, `published: "lightgreen"`, `unpublished: "destructive"`.
- `POST_FLAG_VARIANT: Record<PostFlag, ...>` → `FILTER_PASSED: "lightgreen"`, `FILTER_FAILED: "destructive"`, `SIMILAR_CONTENT: "cream"`, `FILTER_SKIPPED: "secondary"`.
- `canPublish(status)` → `status === "processing" || status === "unpublished"` (bài `drafted` approve = 400 nên phải ẩn nút; approve bài đã published chỉ để duyệt tên component — FE chưa có UI đó). Kèm `ponytail:` ghi rõ: thêm `published` khi có màn duyệt component.
- `canReject(status)` → `status === "processing" || status === "unpublished"`.
- Xoá comment tham chiếu `PATCH /api/posts/{id}/visibility` / `hidden` (endpoint đã chết).

## 3. i18n

`src/i18n/locales/{en,vi}/common.json`

```jsonc
"postStatus": {
  "drafted":      "Draft"           / "Bản nháp",
  "processing":   "Pending review"  / "Đang chờ duyệt",
  "published":    "Published"       / "Đã đăng",
  "unpublished":  "Rejected"        / "Bị từ chối"
},
"postFlag": {
  "FILTER_PASSED":   "Cleared by the automatic check" / "Đã qua kiểm tra tự động",
  "FILTER_FAILED":   "Automatic check not confident"  / "Máy kiểm tra chưa chắc chắn",
  "SIMILAR_CONTENT": "Possible duplicate"             / "Có thể trùng nội dung",
  "FILTER_SKIPPED":  "Automatic check did not run"    / "Không kiểm tra được nội dung"
}
```

`{en,vi}/profile.json`:
- `statusUnpublished` → "Rejected" / "Bị từ chối" (giờ chỉ admin từ chối mới tới trạng thái này).
- thêm `statusPending` → "Pending review" / "Chờ duyệt".
- xoá `underReview` (dòng 113) — nhánh dùng nó bị bỏ ở §5.

`{en,vi}/admin.json`:
- `posts.toast.submitted` → "Post submitted for review" / "Đã gửi bài, đang chờ duyệt".
- `posts.list.overFilter` → "Approved over filter" / "Duyệt dù máy chặn".
- thêm `posts.list.flagDetail.score` = "{{score}} / {{threshold}}", `posts.list.flagDetail.similarity` = "{{percent}}% similar" / "{{percent}}% giống bài".

## 4. Component mới (dùng chung bảng admin + dialog preview)

`src/features/posts/components/PostFlagBadge.tsx`

```tsx
export function PostFlagBadge({ status, flag, flagDetail }: {
    status: PostStatus; flag: PostFlag | null; flagDetail?: FlagDetail | null;
})
```

- `flag === null` → `—` (span muted), không render gì khác.
- Badge `variant={POST_FLAG_VARIANT[flag]}` + `t("common:postFlag." + flag)`.
- Chi tiết theo `kind`:
  - `FILTER_FAILED` → chỉ hiện `score` khi **cả** `score` và `threshold` có mặt: `{{score}} / {{threshold}}`.
  - `SIMILAR_CONTENT` → `Math.round(similarity * 100)%` + `<Link to={"/posts/" + postId}>` (chỉ khi có `postId`).
  - `FILTER_PASSED` / `FILTER_SKIPPED` → không thêm text.
- `status === "published" && flag !== "FILTER_PASSED"` → thêm chip `posts.list.overFilter`.
- Không bao giờ suy trạng thái từ `flag` (chỉ đọc để mô tả bằng chứng).

`RejectionReason.tsx`: chỉ sửa comment dòng 8 (`flag === "REJECTED"` → `status === "unpublished"`); logic không đổi.

## 5. Member-side

**`src/features/posts/pages/MyPostsPage/MyPostsPage.tsx`**
- `STATUS_FILTERS` (39-44): `created` → `drafted`; thêm `{ value: "processing", labelKey: "statusPending", countKey: "processing" }` (đặt giữa Published và Drafts).
- `PostManageRow`:
  - `:245` `status === "created"` → `"drafted"`.
  - **Xoá** block `flag === "NEEDS_REVIEW"` (253-257) — member response không còn `flag`, tab Pending + `PostStatusBadge` đã đủ thông tin.
  - `:259` `flag === "REJECTED"` → `status === "unpublished"` cho `<RejectionReason>`.

**`src/features/account/AccountOverviewPage.tsx`**
- `:47` `status === "created"` → `"drafted"`.
- `:264-265` bỏ mapping tay (`statusPublished`/`statusDraft`) → dùng `<PostStatusBadge status={post.status} />` để `processing`/`unpublished` không bị gộp thành "Draft".
- `:270` `status === "created"` → `"drafted"` (draft mở composer, còn lại link detail).

**`src/features/posts/pages/PostDetailPage/PostDetailPage.tsx`**
- `:47-51` thêm polling theo đúng pattern `usePayment` (`src/features/subscription/useBilling.ts:27`):
  ```ts
  // ponytail: 3s cố định trong lúc chờ filter; đổi sang backoff 3/5/10/30 nếu tải server thành vấn đề.
  refetchInterval: (query) => (query.state.data?.status === "processing" ? 3000 : false),
  ```
  Tự dừng khi status khác `processing`.
- `:34` sửa comment: `flag` không còn trong response member.

## 6. Composer — `src/features/posts/components/composer/PostComposerDialog.tsx`

`onSuccess` (126-131) đang toast chung "Đã tạo/Đã cập nhật" bất kể intent. Sửa:

```ts
onSuccess: () => {
    toast.success(
        intentRef.current === "publish"
            ? t("posts.toast.submitted", { ns: "admin" })
            : t(isEditing ? "posts.toast.updated" : "posts.toast.created", { ns: "admin" }),
    );
    void queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    if (postId) void queryClient.invalidateQueries({ queryKey: ["post-detail", postId] });
    onClose();
}
```

Không đổi `mutationFn` (create vẫn `createPost` → `updatePost(publish)`); `return created` giữ nguyên vì toast không đọc status. Không chặn editor chờ verdict (spec §8).

## 7. Admin — `src/features/admin/pages/PostsPage/`

- `PostsPage.tsx:31` `POST_STATUSES` → `["drafted", "processing", "published", "unpublished"]`.
- `:178-186` cột Moderation → `<PostFlagBadge status={post.status} flag={post.flag} flagDetail={post.flagDetail} />`, bỏ `Badge` + `POST_FLAG_VARIANT` + `t(common:postFlag.*)` tại chỗ.
- `PostPreviewDialog.tsx:41-45` → cùng component.
- `:19` comment "chỉ hiện cho bài `processed`" → `processing`.
- Không thêm dropdown lọc `flag`; `getPosts` vẫn dùng default `all` — sửa comment `api.ts:427` ("BE mặc định `all`").
- `posts.list.action.unpublish` (i18n key chết) → xoá khỏi en/vi.
- `src/features/posts/api.ts:544-560`: sửa doc comment (`hidden` → `drafted`, approve/reject **giữ** `flag`). Giữ `Promise<void>` + `invalidateQueries` như hiện tại — refetch đã cho kết quả đúng, ít diff hơn patch row từ response.

## 8. `getMyPosts` counts — `src/features/posts/api.ts:488-541`

- `MyPostsCounts` thêm `processing: number`.
- `:519` `draft` đếm `status === "drafted"`.
- thêm `processing: all.filter((p) => p.status === "processing").length`.
- `:23` comment "luôn tạo ở status `created`" → `drafted`.

## 9. Test cập nhật

- `src/features/posts/__tests__/constants.test.ts` — `canReject("processing")` true, `canReject("drafted")` false, `canPublish("processing")` true, `canPublish("drafted")` false.
- `src/features/posts/pages/ExplorePage/__tests__/FeedPostCard.test.tsx:27-28` — xoá `flag: null` khỏi fixture (field đã bỏ khỏi `PostListResponse`, sẽ lỗi excess property).
- `src/features/posts/__tests__/postApi.test.ts:170` — sửa comment "BE mặc định NEEDS_REVIEW" → `all`.
- `AdminPages.test.tsx` giữ nguyên (label "Filter by status" không đổi).

## 10. Ngoài phạm vi (ghi nhận, không làm)

- Admin dashboard `pendingPosts`: FE vẫn mock categories, không có field này → không có gì để sửa. Khi nối `GET /api/admin/dashboard`, link counter trỏ `/admin/posts?status=processing`.
- `GET /api/admin/posts/{id}` (component list) chưa nối — `flagDetail` lấy từ list response là đủ.
- `unpublishPost` (`src/features/posts/api.ts:645`) vẫn không có caller (bài gốc cũng vậy).
- Doc `DOCS/API-COVERAGE.md:64,71,284` còn mô tả `hidden` / visibility endpoint — cập nhật cùng đợt nếu muốn doc khớp.

## 11. Verify

1. `npm run typecheck` — phải sạch; mọi literal `"created"`/`"processed"` còn sót trong `src/features/posts|admin|account` sẽ fail (union type bắt được).
2. `npm test` — `constants.test.ts`, `FeedPostCard.test.tsx`, `postApi.test.ts`, `adminPages.test.tsx`.
3. Chạy `npm run dev`, với backend đã deploy V56-V58:
   - Tạo bài → chọn Đăng → toast "Đã gửi bài, đang chờ duyệt"; `/my-posts` có tab **Chờ duyệt**, bài hiện badge "Đang chờ duyệt"; để mở ~10s thấy bài tự flip sang "Đã đăng" (polling) mà không cần F5.
   - `/admin/posts` không tham số → thấy cả bài `drafted`; lọc status `processing` → thấy bài có badge verdict + `0.31 / 0.45`; bài `SIMILAR_CONTENT` có `%` + link.
   - Admin approve bài `FILTER_FAILED` → row vẫn giữ badge "Máy kiểm tra chưa chắc chắn" **và** chip "Duyệt dù máy chặn", status `published`.
   - `/my-posts` không còn render bất kỳ nhánh `flag` nào; bài bị từ chối hiện `rejectionReason` khi `status === "unpublished"`.
4. Trước khi backend deploy migrations: các giá trị cũ (`created`/`processed`) sẽ không khớp `POST_STATUS_VARIANT` → badge rơi về variant mặc định. Chấp nhận trong khoảng deploy; không thêm code tương thích hai vocab.
