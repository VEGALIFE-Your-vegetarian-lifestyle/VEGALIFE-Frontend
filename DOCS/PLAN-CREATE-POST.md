# Plan — Create Post theo mockup screen05

> Trạng thái: **đã bị thay thế (2026-11-04)** — kế hoạch dưới đây giữ làm lịch sử. Thực tế đã dựng thành **một dialog** `posts/components/composer/PostComposerDialog.tsx` (dùng chung create + edit, mở bằng `useUiStore().openComposer(postId?)`, không còn route `/posts/create` hay `/posts/:id/edit`). Chi tiết ở `DOCS/API-COVERAGE.md` §20 và `.claude/CLAUDE.md`.
> Mockup: `stich_design/screen05_create_post/` (`code.html`, `DESIGN.md`, `screen.png`)
> Endpoint: `POST /api/posts`, `PATCH /api/posts/{id}`, `GET /api/posts/{id}`,
> `POST /api/posts/{postId}/recipes`, `GET /api/recipes/me`, `POST /api/media/upload` → `.../confirm`

## 1. Mục tiêu

Dựng lại `CreatePostPage` (`/posts/create`, `/posts/:id/edit`) theo bố cục mockup screen05:
4 khối đánh số, top bar gộp breadcrumb + 2 pill + 2 nút, cột phải là Publishing Readiness
(có giá trị thật từng dòng) + Instant Feed Card Preview. Đồng thời **thêm khối Attached
Recipes** — tính năng mới, mockup là lý do duy nhất để làm.

**Phạm vi**: layout trang, gộp field, sidebar, khối gán recipe vào bài.

**Ngoài phạm vi**: crop ảnh, toggle "Short Video Reel", lưu `summary` lên BE, sửa `type`
bài (xem §8).

## 2. Hiện trạng

| Thứ | Trạng thái |
|---|---|
| `CreatePostPage.tsx` | ✅ 5 SectionCard dọc + sidebar checklist + panel AI tĩnh |
| `ContentFormatSelector.tsx` | ✅ chọn blog/video — **đường 400**: bài tạo mới luôn là blog, `patch.type` bị BE từ chối "type bất biến" (`CreatePostPage.tsx:87-91`) |
| `PostSidebar.tsx` | ✅ checklist `{key, done}` (không có cột giá trị) + 4 ô macro `—` |
| `schema.ts` | `MAX_TITLE_LENGTH = 255`, `MAX_SUMMARY_LENGTH = 180`, `videoSource` bắt buộc khi type=video |
| `payload.ts` | `FormValues` có `type`, `videoUrl` — cả 2 **không tồn tại** trong DTO |
| `POST /api/posts/{id}/recipes` | ⚠️ tài liệu ghi ❌ nhưng OpenAPI **đã có** `{recipeIds[]}` |
| `POST /api/posts/{id}/media` | ⚠️ tài liệu ghi ❌ nhưng OpenAPI **đã có** `{mediaIds[]}` |
| `getMyRecipes()` | ✅ `GET /api/recipes/me` → mảng phẳng, đã dùng ở `/recipes` |
| `estimateReadMinutes()` | ✅ có sẵn `src/shared/utils/formatDate.ts:18` |

Proxy OpenAPI (`/v3/api-docs`) xác nhận: `PostCreateRequest` = `title` (≤255), `content` (≥1),
`rawContent`, `featuredImageUrl`, `categoryIds[]`, `publish`, `rawContentObject`.
`PostUpdateRequest` tương tự. **Không có** `type`, `videoUrl`, `mediaId`, `summary`.
`PostListResponse` có `mediaIds`, `recipeIds`, không có `type`/`videoUrl`.

## 3. Quyết định đã chốt

### 3.1 Bỏ ContentFormatSelector và toàn bộ nhánh video

Mockup không có card chọn định dạng; nó gộp vào toggle "Short Video Reel". Toggle đó cũng
không dựng được (§8), nên nhánh video còn lại chỉ là **đường lỗi 400 đang tồn tại**:
`POST /api/posts` tạo bài blog → `PATCH` kèm `type: "video"` → BE trả "type bất biến".

→ Xoá `ContentFormatSelector.tsx`, xoá `type` + `videoUrl` khỏi `FormValues`, xoá
`patch.type = values.type` và điều kiện `videoSource` trong `schema.ts`. Bài video sẽ quay
lại khi nối `POST /api/posts/{id}/media` (§8) — lúc đó `type` do media quyết định, không do form.

### 3.2 `MAX_TITLE_LENGTH` 255 → 90

Mockup đếm `48 / 90`. BE cho 255, nên 90 là ràng buộc UI thuần, vẫn hợp lệ. Giữ 255 thì bộ
đếm hiện `x / 255` — lệch mockup ngay ở field đầu tiên. Chọn 90: khớp mockup, và khớp luôn
"Instant Feed Card Preview" (tiêu đề bị `line-clamp`).

→ Sửa hằng số + test `8/255` → `8/90`. `MAX_SUMMARY_LENGTH = 180` đã khớp, giữ nguyên.

### 3.3 `summary` giữ nguyên: chỉ ở client, kèm `ponytail:`

Mockup đánh dấu "Summary & Feed Teaser *" là bắt buộc, nhưng BE không có field. Ô này đã tồn
tại với đúng `ponytail:` đó (`CreatePostPage.tsx:263`). Không bịa thêm: giữ ô, giữ ghi chú,
**không** thêm validate bắt buộc (bắt buộc một field không lưu được là vô nghĩa). Đưa lên cùng
khối với Headline như mockup.

### 3.4 Category picker gộp vào khối "Post Details", không tách card

Mockup không có khối Categorization. Nhưng publish cần ≥1 category (`onSubmit` đang chặn), nên
không được xoá. Bố cục mockup sau §1 là lưới 5/12 + 7/12 — chèn card category full-width vào
giữa sẽ phá lưới đó.

→ Thu gọn chip picker hiện có (nút mở + dãy chip) thành một hàng "Categories *" **trong** khối
Post Details, dưới Summary. Giữ `aria-pressed`, giữ thông báo lỗi tại chỗ, giữ `usePublicCategories`.

### 3.5 Sidebar đổi sang `ReadinessItem {key,label,value,done}`

`RecipeSidebar.tsx` đã có đúng hình dạng này (`value` là cột phải mỗi dòng). Copy nguyên thay
vì phát minh lại. Giá trị từng dòng lấy từ form, không bịa:

| Dòng | done | value |
|---|---|---|
| Title & Summary | tiêu đề không rỗng | `{{words}} words` của summary, hoặc `Complete` |
| Cover Visual HD | `featuredImageUrl` không rỗng | mockup ghi "16:9 OK" → **đổi thành** "Uploaded" (không có width/height ở FE) |
| Article Narrative | editor không rỗng | `{{count}} words` |
| Attached Recipes | `recipeIds.length > 0` | `{{count}} Synced` |
| 100% Plant Standard | luôn `true` | `Verified` |

### 3.6 Xoá panel "AI Nutrition Snapshot"

4 ô macro đều in `—` (dữ liệu tĩnh, `ponytail:` trong `PostSidebar.tsx:43`). Mockup thay chỗ
này bằng Instant Feed Card Preview. Xoá panel + xoá key `posts.ai.*` (2 locale) + xoá dòng
Create Post khỏi `DOCS/MOCK-FIELDS.md:315`.

### 3.7 Giữ nguyên thanh công cụ editor, chỉ dời bộ đếm

Mockup vẽ 5 nút (bold/italic/quote/list/link). Thanh hiện tại có 14 nút (H2/H3, code, ảnh,
bảng, divider, undo/redo). Bỏ 9 nút = xoá khả năng thật để khớp hình.

→ Giữ đủ nút. Chỉ làm 2 việc: (a) `RichTextEditor` bỏ thanh word-count ở **đáy**, trả số liệu
qua prop; (b) header khối Article Narrative hiện `312 words` (xanh) + hàng toolbar thêm
`~2 min read` bên phải, dùng `estimateReadMinutes` + `formik.values.rawContent`.

### 3.8 Top bar thay `PageHeader` + banner draft

Mockup: breadcrumb `Home › Creator Studio › Create Post`, 2 pill bên trái (Draft autosaved ·
100% Plant-Standard Verified), 2 nút bên phải (Save Draft · Publish Post). Nút gửi **dời từ
đáy trang lên đây**. `PageHeader` không dùng nữa — đổi sang breadcrumb tự viết, copy từ
`CreateRecipePage.tsx:189-199` (đã làm đúng kiểu này). Pill "Draft autosaved" giữ text tĩnh
như hiện tại; bỏ badge `common:postStatus.created` (mockup chỉ có 2 pill).

### 3.9 Bề rộng trang dùng `max-w-app`

Hiện tại `max-w-6xl`; `CreateRecipePage` dùng `max-w-app` (token 96rem, 1536px — mockup 1280px
đã nâng có chủ ý, ghi trong `src/index.css`). Đổi để 2 trang soạn thảo thẳng nhau.

### 3.10 Badge số dùng lại `SectionBadge` của CreateRecipePage

Mockup vẽ `w-5 h-5 rounded-full bg-surface-container-high text-primary`; bản recipe dùng
`h-7 w-7 rounded-lg bg-vegan-green text-white`. Giữ bản recipe (nhất quán trong app thắng
pixel-fidelity), kèm `inlineHeader` để có đường kẻ dưới header như mockup.

## 4. Thiết kế

### 4.1 File tree sau khi xong

```text
src/features/posts/pages/CreatePostPage/
  CreatePostPage.tsx        # sửa: top bar, lưới 12 cột, 4 khối, 2 nút trên
  PostSidebar.tsx           # sửa: ReadinessItem {key,label,value,done}, bỏ panel AI
  PostPreviewCard.tsx       # MỚI: Instant Feed Card Preview (nguồn: RecipePreviewCard)
  AttachedRecipesCard.tsx   # MỚI: khối 4 — danh sách + picker
  RecipePickerDialog.tsx    # MỚI: Dialog chọn recipe từ getMyRecipes()
  schema.ts                 # sửa: 255→90, bỏ videoSource
  payload.ts                # sửa: bỏ type/videoUrl
  ContentFormatSelector.tsx # XOÁ
  __tests__/{CreatePostPage,payload}.test.tsx  # cập nhật
```

`features/posts/api.ts` thêm 1 hàm:

```ts
export async function attachPostRecipes(id: string, recipeIds: string[]): Promise<PostListResponse> {
    const { data } = await client.post<ApiResponse<PostListResponse>>(`/api/posts/${id}/recipes`, { recipeIds });
    return data.data;
}
```

`features/posts/types.ts`: `FormValues` nằm ở `payload.ts`, còn `CreatePostRequest`/
`UpdatePostRequest` không đổi (đã đúng DTO).

### 4.2 Hợp đồng API

| Bước | Gọi | Ghi chú |
|---|---|---|
| 1. tạo | `POST /api/posts` `{title, content, rawContent, featuredImageUrl}` | luôn tạo draft |
| 2. gán recipe | `POST /api/posts/{id}/recipes` `{recipeIds[]}` | **chỉ gọi khi mảng khác rỗng** |
| 3. chốt | `PATCH /api/posts/{id}` `{title?, content, rawContent, featuredImageUrl?, categoryIds?, publish?}` | publish để cuối, sau khi gán recipe xong |
| sửa bài | `PATCH /api/posts/{id}` + `POST .../recipes` nếu tập recipe đổi | `GET /api/posts/{id}` trả `recipeIds` để so |

Nguồn dữ liệu picker: `GET /api/recipes/me` → `RecipeResponse[]` (mảng phẳng, không phân trang).
`RecipeResponse` có `name`, `dishName`, `difficulty`, `prepTimeMinutes`, `cookTimeMinutes`,
`servings`, `ingredients[]` → khớp đúng dòng meta của mockup (`Prep: … • Cook: … • Yield: … • N Ingredients`).
Chip category ("Main Dish") mockup **không có field tương ứng** → thay bằng `dishName`.

### 4.3 Validate

| Field | Luật | Đổi? |
|---|---|---|
| `title` | `required`, `max(90)` | giới hạn 255 → 90 |
| `summary` | không validate (client-only) | giữ |
| `content` | editor không rỗng thì thôi (Yup không bắt được doc rỗng) | giữ |
| `categoryIds` | ≥1 khi `intent === "publish"` | giữ |
| `featuredImageUrl` | không bắt buộc | giữ |
| `recipeIds` | không bắt buộc | MỚI (không validate) |
| ~~`videoSource`~~ | — | **xoá** |

### 4.4 Bố cục

```text
┌ breadcrumb: Home › Creator Studio › Create Post ─────────────────────────────┐
│ [• Draft autosaved 2m ago] [✓ 100% Plant-Standard Verified]   [Save Draft][Publish Post] │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ ① Post Details          (full, 8/12) │  Publishing Readiness   5 / 5        │
│   Headline *            48 / 90      │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (h-1.5)         │
│   Summary & Teaser *   132 / 180     │  ① Title & Summary        Complete   │
│   Categories *  [chip][chip]+        │  ② Cover Visual HD        Uploaded   │
├──────────────┬───────────────────────┤  ③ Article Narrative      312 words  │
│ ② Cover      │ ③ Article Narrative   │  ④ Attached Recipes     2 Synced     │
│   Visual     │   312 words           │  ⑤ 100% Plant Standard   Verified   │
│   (5/12)     │   [B I " • 🔗 …]      │  ─────────────────────────────────   │
│   img h-36   │   ~2 min read         │  INSTANT FEED CARD PREVIEW           │
│   [Change]   │   ┌ editor ─────────┐ │   [ảnh][chip category]               │
├──────────────┴───────────────────────┤   tiêu đề line-clamp-1               │
│ ④ Attached Recipes      2 Attached   │   summary line-clamp-2               │
│   [thumb] tên + dishName + difficulty│  ─────────────────────────────────   │
│   Prep • Cook • Yield • 6 Ingredients│  Ethical Curation Pledge             │
│                     [Change] [detach]│  (bg surface-container-high)         │
│   [thumb] …                          │                                      │
│   [ + Add Another Recipe ]           │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

Lưới: `grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]` (copy CreateRecipePage),
bên trong cột trái `space-y-5`, riêng ②③ bọc `grid gap-6 md:grid-cols-12` với
`md:col-span-5` / `md:col-span-7`. Sidebar `lg:sticky lg:top-24 lg:self-start`.

Ảnh bìa: khối ② cao `h-36` — `ImageUploader` hiện có cao hơn thế. Dùng
`ImageUploader` nguyên trạng (đừng viết lại dropzone) và chấp nhận cao hơn mockup; nút
"Change" của mockup chính là dropzone đó. Chip `2400×1350` và nút "Crop" **không làm** (§8).

Hàng recipe trong khối ④: `rounded-xl bg-surface-container-low` → `rounded-xl bg-muted-bg`.
Thumb 12×12: `RecipeResponse` không có ảnh → nền gradient + icon `Leaf` (đúng cách
`RecipePreviewCard` đang xử lý). Nút "Change" mở lại picker, nút detach (`Link2Off`,
`text-danger hover:bg-danger-soft`) bỏ khỏi mảng cục bộ.

`RecipePickerDialog`: `Dialog` + `Input` lọc theo `name`/`dishName`/tên nguyên liệu
(client-side, mảng đã nằm trong cache `getMyRecipes`) + danh sách checkbox. **Không** cần
`useDebounce`/`useQuery` phân trang như `DishSlotPicker` — dữ liệu đã có sẵn toàn bộ.

### 4.5 Luồng lưu

```text
handleSubmit("draft"|"publish")
  → validate (title, categories nếu publish, editor nếu blog)
  → isEditing ?
      PATCH /api/posts/{id}   (+ publish nếu intent=publish)
      recipeIds đổi ? POST /api/posts/{id}/recipes
    :
      POST /api/posts                      → id
      recipeIds.length ? POST /api/posts/{id}/recipes
      PATCH /api/posts/{id}  (+ publish nếu intent=publish)
  → toast + navigate("/my-posts")
```

Publish đi **sau** cùng: tránh trường hợp bài đã public trong lúc recipe còn đang gán.
Nếu bước gán recipe lỗi → toast lỗi, **không** publish (bài vẫn là draft, user sửa được).

### 4.6 i18n

Giữ namespace `admin`, block `posts.composer.*` (đổi sang namespace mới = đụng mọi key +
test, không đổi được gì cho người dùng).

**Thêm** (cả `en` + `vi`):

| Key | en | vi |
|---|---|---|
| `composer.breadcrumb` | Creator Studio | Creator Studio |
| `composer.plantVerified` | 100% Plant-Standard Verified | Chuẩn 100% thực vật |
| `composer.section1` | Post Details | Thông tin bài viết |
| `composer.section2` | Cover Visual | Ảnh bìa |
| `composer.section3` | Article Narrative | Nội dung bài |
| `composer.section4` | Attached Recipes | Công thức đính kèm |
| `composer.narrativeWords` | {{count}} words | {{count}} từ |
| `composer.minRead` | ~{{count}} min read | ~{{count}} phút đọc |
| `composer.coverHint` | 16:9 HD · landscape works best | 16:9 HD · ảnh ngang là đẹp nhất |
| `composer.attachedCount` | {{count}} Attached | {{count}} đã gắn |
| `composer.attachRecipe` | Add Another Recipe | Thêm công thức |
| `composer.changeRecipe` | Change | Đổi |
| `composer.detachRecipe` | Detach Recipe | Bỏ công thức |
| `composer.pickerTitle` | Choose a recipe | Chọn công thức |
| `composer.pickerSearch` | Search your recipes… | Tìm công thức của bạn… |
| `composer.pickerEmpty` | You have no approved recipes yet. | Bạn chưa có công thức nào đã duyệt. |
| `composer.recipeMeta` | Prep: {{prep}}m • Cook: {{cook}}m • Yield: {{servings}} • {{ingredients}} Ingredients | Sơ chế: {{prep}}p • Nấu: {{cook}}p • {{servings}} phần • {{ingredients}} nguyên liệu |
| `composer.previewHeading` | Instant Feed Card Preview | Xem trước thẻ feed |
| `composer.previewEmpty` | Your headline and teaser will appear here. | Tiêu đề và tóm tắt sẽ hiện ở đây. |
| `composer.pledge.title` | Ethical Curation Pledge | Cam kết thuần thực vật |
| `composer.pledge.body` | Adheres to VEGALIFE 100% plant-first charter: zero animal products, testing, or derivatives. | Tuân thủ hiến chương 100% thực vật của VEGALIFE: không sản phẩm, thử nghiệm hay phụ phẩm động vật. |
| `checklist.recipes` | Attached Recipes | Công thức đính kèm |
| `checklist.standard` | 100% Plant Standard | Chuẩn 100% thực vật |
| `checklist.complete` | Complete | Hoàn tất |
| `checklist.value.words` | {{count}} words | {{count}} từ |
| `checklist.value.uploaded` | Uploaded | Đã tải lên |
| `checklist.value.synced` | {{count}} Synced | Đã đồng bộ {{count}} |
| `checklist.value.verified` | Verified | Đã xác nhận |
| `checklist.value.missing` | Missing | Còn thiếu |

**Xoá** (cả 2 locale): `posts.form.contentFormat`, `typeBlog`, `typeVideo`,
`contentPlaceholderVideo`, `videoFileLabel`, `videoUpload`, `videoFailed`, `videoInvalidType`,
`videoTooLarge`, `videoRemove`, `videoDropzoneTitle`, `videoDropzoneHint`, `videoSourceRequired`,
`posts.composer.typeBlogHint`, `typeVideoHint`, `posts.checklist.videoSource`,
`posts.ai.*`, `posts.wizard.*` (đã không còn chỗ dùng).

**Đổi tên chỗ dùng**: `posts.checklist.heading` giữ "Publishing Readiness" / "Mức sẵn sàng";
`posts.checklist.format`, `.category`, `.cover`, `.content` — `.format` xoá, `.category` chuyển
vào khối Post Details.

## 5. Thứ tự thực hiện

| # | Việc | Kiểm chứng | Trạng thái |
|---|---|---|---|
| 1 | `schema.ts` (90, bỏ `videoSource`) + `payload.ts` (bỏ `type`/`videoUrl`) | `npm run typecheck` | ⬜ |
| 2 | Xoá `ContentFormatSelector.tsx` + nhánh video + key i18n video/`wizard`/`ai` | `npm run typecheck`, `npm test` | ⬜ |
| 3 | `RichTextEditor`: bỏ thanh đếm ở đáy, trả `wordCount` ra ngoài | mở `/posts/create`, gõ thử | ⬜ |
| 4 | `CreatePostPage`: top bar + `max-w-app` + lưới 12 cột + `SectionBadge` 1–4 | so `screen.png` | ⬜ |
| 5 | `PostSidebar` → `ReadinessItem`, `PostPreviewCard` mới, xoá panel AI | 5 dòng hiện giá trị thật | ⬜ |
| 6 | `attachPostRecipes` trong `api.ts` | `npm run typecheck` | ⬜ |
| 7 | `AttachedRecipesCard` + `RecipePickerDialog` | tạo bài có 2 recipe, mở `/posts/{id}` | ⬜ |
| 8 | Nối luồng lưu 3 bước (§4.5) | tạo + sửa + publish thật | ⬜ |
| 9 | Cập nhật 2 file test + i18n en/vi | `npm test` | ⬜ |
| 10 | Cập nhật docs (§6 cuối) | đọc chéo | ⬜ |

## 6. Test

`__tests__/CreatePostPage.test.tsx`:

- Sửa: tên 4 khối ("Post Details" / "Cover Visual" / "Article Narrative" / "Attached Recipes"),
  bộ đếm `8/90`, bỏ 3 test nhánh video, bỏ assert "AI Nutrition Snapshot".
- Thêm: readiness hiện `x words` khi gõ nội dung; `RecipePickerDialog` chọn 1 recipe → hàng
  hiện `Prep: … • Cook: … • Yield: … • N Ingredients`; nút detach xoá hàng và cập nhật
  "0 Attached"; preview card hiện tiêu đề/teaser đang gõ.
- Giữ: validate required khi thiếu tiêu đề; publish thiếu category; test category từ API thật.

`__tests__/payload.test.ts`: bỏ case `type`/`videoUrl`; thêm case `attachPostRecipes` không gọi
khi mảng rỗng (mock `client.post`).

Docs cập nhật sau khi code xong: `DOCS/API-COVERAGE.md` §20 (2 endpoint attach: ❌ → ✅,
bỏ ghi chú "`buildPatch` vẫn gửi `videoUrl`"), `DOCS/MOCK-FIELDS.md:315` (bỏ dòng Create Post),
`DOCS/UI-DATA-MAP.md`, `DOCS/CODE-STRUCTURE.md` (cây file), `DOCS/TEST-COVERAGE.md`,
`.claude/CLAUDE.md` (khối "Lưu ý khi làm việc" + bảng tra cứu).

## 7. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| `POST /api/posts/{id}/recipes` từ chối bài `created` (draft) | thử ngay ở bước 8; nếu 4xx → đảo thứ tự: PATCH publish trước, gán recipe sau, và báo lại user |
| `GET /api/recipes/me` chỉ trả recipe của mình, gồm cả `PENDING` | lọc bỏ `moderationStatus === "REJECTED"` khi hiện picker; `PENDING` vẫn cho gắn (bài cũng chờ duyệt) |
| Xoá `type` khỏi form làm `MyPostsPage` mất số đếm "videos" | `MyPostsPage` đọc `post.type` từ list response (đã luôn `undefined` sau khi BE bỏ field) — không đổi hành vi, chỉ xác nhận lại khi chạy test |
| Ảnh bìa `ImageUploader` cao hơn mockup `h-36` | chấp nhận, ghi vào §8; không viết lại dropzone |
| Bỏ `posts.wizard.*` mà còn chỗ dùng | grep trước khi xoá — hiện không có tham chiếu nào trong `src/` |

## 8. Không làm (ghi rõ để reviewer khỏi hỏi)

| Mockup | Lý do |
|---|---|
| Toggle "Short Video Reel" | Không có `type`/`videoUrl` trong DTO; video chỉ vào được qua `POST /api/posts/{id}/media` → cần `ImageUploader` trả `mediaId` (hiện chỉ trả `mediaUrl`) + biết `durationSeconds`. Việc riêng, xem mục 4 "Việc cần làm trước" của `API-COVERAGE.md` |
| Nút "Crop" | Không có thư viện crop, không thêm dependency (luật repo) |
| Chip `2400×1350` | `MediaResponse` có `width`/`height` nhưng `ImageUploader` không trả ra; muốn có thì phải đổi chữ ký `onChange` của component dùng chung — không đáng cho 1 nhãn |
| Badge "Vegan • 28g Protein" ở preview | Post không có field dinh dưỡng. Thay bằng chip category đang chọn |
| Modal "Attached Recipe Spec" trong `code.html` | Trigger `btn-inspect-recipe` **không tồn tại** trong DOM → code chết; nội dung modal ("4 Sequential culinary instructions") cũng bịa. Bỏ |
| Lưu `summary` lên BE | Chưa có field (`PostCreateRequest`). Giữ `ponytail:` hiện có |
| Bộ đếm "Draft autosaved 2m ago" thành thật | Chưa có autosave. Giữ text tĩnh như hiện tại |
| Đổi `ImageUploader` sang `h-36` | Component dùng chung với ProfilePage |
