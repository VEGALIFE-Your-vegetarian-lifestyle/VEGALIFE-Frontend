# Mock Fields — danh sách field đang bịa, theo màn hình

File **sống**: mỗi lần chỉnh UI/UX một screen thì thêm/ cập nhật mục của screen đó.
Mục đích: biết chỗ nào đang hiện dữ liệu **API không trả** — để quyết định giữ (mockup yêu cầu),
đổi sang field thật, hay bỏ hẳn.

Đọc kèm: `UI-DATA-MAP.md` (toàn bộ page ⇄ field) · `API-COVERAGE.md` (endpoint nào đã có).

Ký hiệu: **[R]** field thật · **[D]** suy ra ở client từ dữ liệu thật (giữ được) ·
**[M]** bịa hoàn toàn (không có nguồn) · **[H]** chữ tĩnh trong i18n · **[X]** field API **không hề có**.

Cập nhật: 2026-10-30 · branch `update/ui-ux`

---

## Home `/` — thiết kế lại theo mockup Stitch `screen01_home`, 2026-10-29

`HomePage.tsx` chứa cả trang lẫn mọi khối con (`HomeHero`, `SectionHeader`, `HomeWeeklyBar`,
`HomeDishes`, `HomeNearbyPicks`, `CommunityCard`) và `homeData.ts` (shim gọi API,
vì `posts` không được import `locations`/`menus`).

Data thật dùng ở Home:

| Endpoint | Dùng cho | Cần JWT |
|---|---|---|
| `GET /api/posts/feed?page=0&size=12` | hero highlight, showcase, community, latest | không |
| `GET /api/categories?page=0&size=10&sort=name,asc` | pill bar, hero metric, tên category trên card | không |
| `GET /api/dishes?page=0&size=4` | khối "Chef's Picks" | **có** (401 nếu không) |
| `GET /api/locations?page=0&size=4` | khối "Curated Vegan Gems" | **có** (401 nếu không) |
| `GET /api/menus/details?from&to` | lưới 7 ngày "Weekly Meal Strategy" | **có** |

Khách vãng lai: `HomeWeeklyBar` và `HomeDishes` **tự ẩn hẳn** (`return null`); `HomeNearbyPicks`
vẫn giữ cột `lg:col-span-5` và hiện thẻ mời đăng nhập (`home:nearbyPicks.loginRequired` + link
`/login`) cao bằng cột Community — hàng "Community Buzz | Curated Vegan Gems" luôn 2 cột 7/5 dù
đăng nhập hay chưa, để bố cục không nhảy. Query đều đặt `enabled: isAuthenticated` cho khỏi gọi
API chắc chắn 401.

`/nearby/:id` (`LocationDetailPage`) đã bọc `ProtectedRoute` — bấm chi tiết một quán thì phải
đăng nhập; đăng nhập xong `LoginPage` đọc `location.state.from` để quay lại đúng trang đó.

### Chia lát feed (không lặp bài)

BE không có cờ `featured`/`pinned` → cắt tuỳ ý từ 1 trang feed: hero 1 bài
(`posts[0]`), showcase 3 (`[1..3]`), community 3 (`[4..6]`), latest 4 (`[7..10]`).
Trước đây hero + showcase + community cùng `slice(0,3)` nên 3 bài đầu hiện 3 lần.

### Field từng khối

| Vị trí trên UI | Field | Loại | Ghi chú |
|---|---|---|---|
| Hero: badge / h1 / câu hỏi / 4 chip điều hướng / subtitle | `home:hero.*` | **[H]** | chip chỉ là link `/explore`, `/meal-plan/create`, `/nearby`, `/ai-nutrition` |
| Hero: ô search → `/explore?q=` | — | **[D]** | `GET /api/search` **chưa làm** (API-COVERAGE §16) |
| Hero: thẻ "Daily Highlight" phải | `featuredImageUrl`, `title`, `content`, `categoryIds` | **[R]/[D]** | nhãn thời gian = `estimateReadMinutes(content)` |
| Hero: 2 con số chân khối | `feed.totalElements`, `categoriesData.totalElements` | **[R]** | |
| Pill bar: pill "All" + pill category | `category.name`, `categoriesData.totalElements` (query `size=10` → **chỉ 10 danh mục đầu**) | **[R]** | `description` BE có nhưng không hiện |
| Showcase "Editorial Showcase" + eyebrow "Curated Selections" | `home:featuredEyebrow` | **[D]** | nhãn trang trí trên 3 bài đầu **sau** bài hero |
| Weekly: lưới 7 ô ngày | `days[].date`, `meals[].dish.{name,imageUrl}`, `meals[].mealType`, `status` | **[R]** | ngày không có bữa bị BE bỏ khỏi `days` → client tự bù từ `currentWeekRange().days` |
| Weekly: thanh tiến độ | ngày có ≥1 bữa / 7 | **[D]** | mockup vẽ "Completion 85%" |
| Dishes: ảnh / tên món / nhãn cuisine | `imageUrl`, `name`, `cuisineType` | **[R]** | bấm món → `/explore?q=<tên món>` |
| Nearby: thẻ lớn + hàng nhỏ | `name`, `address`, `placeType`, `rating`, `priceLevel` | **[R]** | `priceLevel` 1–4 → `$`; null thì bỏ trống. BE xếp sẵn rating giảm dần. `LocationItem` **không có ảnh** → thẻ lớn dùng nền gradient + icon |
| Community: card 2 cột | `title`, `content`, `featuredImageUrl`, `createdAt`, `viewCount`, `categoryIds` | **[R]** | mockup vẽ thêm avatar + tên tác giả + số tim/bình luận — BE không trả |
| Card: ảnh bìa | `featuredImageUrl` | **[R]** | fallback ảnh Unsplash khi null |
| Card: nhãn Recipe/Blog trên ảnh + nhãn nút CTA | `categoryIds` → tên qua `GET /api/categories` | **[D]** | có category = Recipe, không = Blog |
| Card: nhãn thời gian góc ảnh | `durationLabel` | **[D]/[M]** | suy từ `content` (số từ /200) — tạm được |
| Card: **khối tác giả** (avatar, tên, "by X") | `authorCard` | **[M]** | `mockAuthors.ts` — 6 người bịa; BE không trả author trong feed. **Vẫn còn ở Home**; nên bỏ khi có `GET /api/profile/{userId}` (API-COVERAGE §4) |
| Card: icon bookmark góc ảnh | — | **[M]** | chỉ trang trí, **không có API lưu bài**. Chỉ bật ở 3 card Showcase |
| Card: số lượt xem 👁 | `viewCount` | **[R]** | hiện **0** ở mọi bài trên prod |
| Card: nhãn Video / nút play ▶ | — | **[X]** | `PostListResponse` **không có** `type`/`videoUrl` → mọi bài coi là blog; tab "Videos" ở Explore luôn rỗng |
| Dải CTA cuối trang | `home:ctaBand.*` | **[H]** | CTA đổi đích theo `isAuthenticated` (`/register` vs `/meal-plan/create`) |

### Bỏ hẳn khi redesign (mockup có, BE không có — không bịa thay)

Số tổng marketing: "2,400+ / 850+ / 45k+" ở hero, "Join 45,000+ Green Foodies" ở dải CTA ·
"★ 4.9 / 1.2k foodies cooked this" · tỉ lệ macro tuần (Carb 45% / Protein 30% / Fats 25%) ·
kcal + protein mỗi ngày ("520 kcal • 24g P") · "High Iron & Zinc"/"Dietitian Certified" ·
chip "Trending: #HighProtein…" · "0.4 km away" · "(340)" review · "15m prep" ·
tên tác giả bịa (Sarah Jenkins, Chef Linh Nguyen…) · nhãn tag "Farm-to-Table"/"Gluten-Free
Options"/"Open Until 10 PM" · số tim/bình luận (348/29, 512/41).

### Còn nợ ở Home (chưa sửa, chờ quyết)

- Khối tác giả trên card vẫn là người bịa (`mockAuthors.ts`).
- Feed chỉ lấy 12 bài — phần còn lại của prod không có đường tới ngoài `/explore`.
- `/api/locations?page=0&size=4` **cần JWT** (curl 401) → Home không dựng được list địa điểm thật
  cho khách, chỉ hiện thẻ mời đăng nhập. Muốn khách thấy list phải nới quyền endpoint ở backend.
- Chưa có `GET /api/recipes` → "Chef's Picks" thực chất là dish, không phải recipe.
- Nhãn "Video" vẫn còn trong `home:card.video` + tab Videos ở Explore (dữ liệu không có).

---

## Explore `/explore` — bám mockup `stich_design/screen_explore`, 2026-11-02

**Không có route `/search` và không có endpoint `GET /api/search`** (API-COVERAGE §16) —
màn "search results" của mockup chính là `/explore`; ô search ở hero Home trỏ vào `/explore?q=`.

File: `ExplorePage.tsx` (khung + state lọc) · `ExploreFilterPanel.tsx` (cột lọc trái) ·
`FeedPostCard.tsx` (card) · `PostCommentsDialog.tsx` (dialog bình luận) · `__tests__/FeedPostCard.test.tsx`.

Bố cục: hero giữa (eyebrow pill / h1 / phụ đề) → search pill full-width → `PillTabs` → thanh điều khiển
(số biên niên + sort) → lưới `lg:grid-cols-4`: **cột trái = panel lọc sticky** (Category / Content Format /
Reading Time + card CTA tạo bài), **cột phải = feed dọc** (card → "Showing N of M" + `Pagination` số).
Mobile: panel lọc ẩn, category chuyển thành hàng chip cuộn ngang phía trên feed.

Trang giới hạn `max-w-6xl` (không `max-w-app`): feed 3/4 của 96rem cho ra card ~1100px — quá rộng
để đọc và đẩy ảnh bìa thành khối cao lấn màn.

Card (bám mockup): hàng tác giả (avatar + tên + badge vai trò + ngày • category) → ảnh bìa
**cao cố định** — `h-56 sm:h-72` cho card đầu (featured), `h-44 sm:h-52` cho các card sau. Không dùng
tỉ lệ (`aspect-*`) vì cột rộng thì 16:9 cho ra ảnh cao ~570px. + pill thời gian đọc & category →
tiêu đề (`text-2xl sm:text-3xl` featured / `text-xl sm:text-2xl`) → trích đoạn `stripMarkdown`
(3 dòng featured / 2 dòng) → meta (👁 viewCount, 🔥 nếu có recipe) → **block công thức đính kèm**
(chỉ bài có `recipeIds`) → thanh hành động (vote · 💬 số bình luận · đọc tiếp).

Bấm 💬 mở `PostCommentsDialog`: tóm tắt bài (ảnh nhỏ + trích đoạn + link "Đọc bài đầy đủ")
→ vote + `Comments · N` → cây bình luận (cuộn trong `max-h-[45vh]`) → `Pagination` → form gửi.
**Không rời trang.** Vote dùng `PostVoteButtons` chung với card nên cùng `queryKey` → số khớp nhau.

Data thật:

| Dữ liệu | Nguồn | Loại |
|---|---|---|
| Danh sách bài | `GET /api/posts/feed?page=0&size=60` (`page`/`size` only, **không** có keyword/category/sort) | **[R]** |
| Tên category trên card + chip lọc | `GET /api/categories?page=0&size=100&sort=name,asc` — trùng cache `useCategoryNames` | **[R]** |
| Số vote ↑ ↓ trên card | `GET /api/posts/{id}/votes` — **public** | **[R]** |
| Bấm vote | `PUT /api/posts/{id}/votes` — **cần JWT**; khách bấm → toast `post:votes.loginRequired` | **[R]** |
| Số bình luận trên card | `GET /api/posts/{id}/comments?size=1` — chỉ lấy `totalElements`, `staleTime` 5 phút, lỗi thì hiện 0 | **[R]** |
| Cây bình luận trong dialog | `GET /api/posts/{id}/comments?page=0&size=20` — public, **chỉ gọi khi dialog mở** (`enabled: !!post`) | **[R]** |
| Gửi bình luận trong dialog | `POST /api/posts/{id}/comments` — `CommentComposer` dùng chung với Post Detail | **[R]** |
| Block công thức đính kèm | `GET /api/recipes/{recipeIds[0]}` — `queryKey ["recipe", id]` dùng chung cache với Post Detail; **chỉ mount khi `recipeIds` không rỗng** | **[R]** |
| Hàng tác giả trên card (tên, vai trò) | `post.authorCard` — **`mockEnrichment.ts` bơm sẵn**; `PostListResponse` không có `username`/`avatar`/`role` | **[M]** |
| Pill tab `All / Recipes / Blogs` + số | đếm client trên feed, **đã áp keyword + category, chưa áp tab** → pill "All" khớp badge "N items" | **[D]** |
| Từ khóa `q`, category `cat` (lặp nhiều lần), tab, sort | `useSearchParams` — state nằm trên URL | **[D]** |
| Lọc keyword | `title` + `content` + tên category, `.toLowerCase().includes()` | **[D]** |
| Lọc Content Format | `recipeIds.length > 0` = có công thức, ngược lại = chỉ bài viết | **[D]** |
| Lọc Reading Time | `estimateReadMinutes(content) < 5` = nhanh, `> 10` = chuyên sâu | **[D]** |
| Sort `popular` / `recent` | `viewCount` desc / `createdAt` desc | **[R]** |
| Meta card: thời gian đọc | `estimateReadMinutes(content)` | **[D]** |
| Phân trang số | cắt client 8 card/trang; đổi filter tự về trang 1 qua khóa `filterKey` | **[D]** |
| Chữ tĩnh (hero, placeholder, nhóm lọc, CTA, empty state) | `explore:*` | **[H]** |

### `ponytail:` trong file

`GET /api/search` chưa có và feed chỉ nhận `page`/`size` → từ khoá, category, định dạng, thời gian đọc
**đều lọc client trên tối đa 60 bài**. Prod nhiều bài hơn thì phải nới backend.

Phân trang cắt client thay vì phân trang server (`GET /api/posts/feed` không tôn trọng `page`/`size`
thật sự — luôn trả 1 trang). Đổi bộ lọc thì khoá `filterKey` lệch → tự về trang 1, **không** dùng
`useEffect` (vi phạm `react-hooks/set-state-in-effect`).

### Đã bỏ khỏi mockup (không có field/API — không bịa thay)

Nhóm lọc "Topic & Dietary Focus" + "Author Role" · bookmark/share (không có API lưu bài) ·
block xem trước bình luận ngay trên card · bố cục 4 kiểu card (science pull-quote, discussion
"Post Answer", media collage) — chỉ dựng 1 kiểu vì feed chỉ trả 1 shape ·
số tổng marketing ("148 community chronicles") → thay bằng số đếm thật.

### Còn nợ ở Explore

- **Feed thật hiện không có bài nào có `recipeIds`** (kiểm 2026-11-02: 0/17 bài) → block công thức
  đính kèm và nhóm lọc "Recipe Attached" luôn rỗng cho tới khi có bài gắn recipe
  (`POST /api/posts/{id}/recipes` đã có ở FE, chỉ thiếu dữ liệu/đường gắn trên UI).
- **Mọi bài ~1 phút đọc** (content dài nhất 427 ký tự) → "Quick read" trùng "Any length",
  "In-depth (> 10 min)" luôn 0. Ngưỡng nằm ở `QUICK_MAX` / `DEEP_MIN` trong `ExplorePage.tsx`.
- **Tab "Videos" đã bỏ**: `PostListResponse` không có `type`/`videoUrl` → tab luôn rỗng.
  Nhãn `home:card.video` vẫn còn trong locale (dùng chỗ khác).
- Card **không có tên tác giả thật** — hàng tác giả lấy từ `mockEnrichment`.
- Vote là `PUT` toggle: bấm lại cùng chiều để bỏ. Khách chưa đăng nhập đọc được số nhưng
  bấm bị chặn ở client (không gửi request).
- Danh sách category lấy nguyên từ BE nên lẫn category test ("test categories 1") — cần dọn ở backend.
---

## Post Detail `/posts/:id` — bố cục tạp chí 2 cột, 2026-11-02

**Quyết định: bỏ hết mock, chỉ render field API trả.** `PostDetailPage.tsx` + `CommentsSection.tsx`
+ `AttachedRecipes.tsx` + `__tests__/`. Bốn file mock đã xoá hẳn:
`FactStrip`, `IngredientsCard`, `InstructionsCard`, `ChefSecretCard`. `mockEnrichment.ts` cũng bỏ
`enrichDetail`/`getMockComments`; file này giờ chỉ còn phục vụ **card** ở Home/Explore
(`enrichListItem`).

Bố cục 2026-11-02: lưới `lg:grid-cols-[minmax(0,1fr)_360px]` — cột đọc (ảnh bìa → tiêu đề →
meta → nội dung 68ch → chip danh mục) + sidebar (thẻ meta → bình luận → công thức đính kèm).
Breadcrumb và lưới "Related" nằm ngoài lưới, cùng `max-w-6xl`.

Sidebar **không** `sticky` (từ 2026-11-02, sau khi bình luận dời vào đây): khối bình luận cao tuỳ
ý, dính sẽ khoá chân trang không cuộn tới được.

Data thật dùng ở Post Detail:

| Endpoint | Dùng cho | Cần JWT |
|---|---|---|
| `GET /api/posts/{id}` | toàn bộ phần thân bài | **không** (curl anon 2026-10-29 → 200) |
| `GET /api/posts/{id}/related?limit=3` | lưới "Related" — điểm tương đồng thật | **có** (mới dùng 2026-11-02) |
| `GET /api/recipes/{id}` (× `recipeIds.length`) | thẻ công thức đính kèm | **có** |
| `GET /api/categories?page=0&size=100&sort=name,asc` | tên category ở badge + chip + sidebar | không |
| `GET /api/posts/{id}/comments?page&size` | cây bình luận | không |
| `POST /api/posts/{id}/comments` | form gửi bình luận | **có** |

| Vị trí trên UI | Field | Loại | Ghi chú |
|---|---|---|---|
| Breadcrumb + link "Back to Explore" | `post.title`, `post:*` | **[D]/[H]** | |
| Badge category cạnh tiêu đề | `categoryIds` → `GET /api/categories` | **[D]** | chưa tra được tên thì hiện `home:card.blog` (nhãn chung, **không** bịa tên). **Hiện đủ mọi category**, không chỉ cái đầu |
| Badge trạng thái | `status` | **[R]** | `PostStatusBadge` |
| H1 | `title` | **[R]** | |
| Hàng meta: ngày | `publishedAt ?? createdAt` | **[R]** | |
| Hàng meta: thời gian đọc | `content` | **[D]** | `estimateReadMinutes` |
| Hàng meta: lượt xem | `viewCount` | **[R]** | hiện **0** ở mọi bài trên prod |
| Nút Share | `navigator.clipboard` + toast | **[D]** | |
| Nút Edit | `isAuthenticated` | **[D]** | `PostDetailResponse` không có `authorId` → hiện cho **mọi** user đã đăng nhập; quyền sở hữu do BE chặn ở `PATCH` |
| Ảnh hero 16:9 | `featuredImageUrl` | **[R]** | null thì **ẩn cả khối** (không có ảnh bìa giả) |
| Thân bài | `contentJson` (parse từ `rawContent`), fallback `content` | **[R]** | `PostContent` (TipTap), cột `max-w-[68ch]` |
| Chip category chân bài | `categoryIds` → tên | **[D]** | chưa tra được thì hiện **UUID** |
| Sidebar thẻ meta (đầu sidebar) | `publishedAt`, `content`, `viewCount`, `categoryIds` | **[R]/[D]** | không có tác giả (xem dưới) |
| Sidebar bình luận (giữa sidebar) | `id`, `username`, `avatarUrl`, `content`, `edited`, `deleted`, `createdAt`, `replies[]` | **[R]** | xoá mềm → BE trả `content: "[deleted]"` + author null; reply lồng sẵn trong mỗi root, không phân trang riêng |
| Phân trang bình luận | `totalPages`, `totalElements` | **[R]** | 20 root/trang, `Pagination` 1-based ↔ Spring 0-based |
| Sidebar công thức đính kèm (cuối sidebar) | `recipeIds` → `GET /api/recipes/{id}` | **[R]** | ẩn hẳn khi `recipeIds` rỗng; id nào lỗi thì bỏ im lặng |
| Lưới "Related" | `GET /api/posts/{id}/related` | **[R]** | 2026-11-02 bỏ cách cắt từ feed |
| Chữ tĩnh còn lại (breadcrumb, Related, empty/error, comment) | `post:*` | **[H]** | |

### Không có khối tác giả

`PostListResponse` **không có** `userId`/`username`/`authorId`, và `mockAuthors.ts` (6 người bịa)
chỉ còn dùng ở **card** Home/Explore. Post Detail 2026-11-02 **bỏ hẳn** khối tác giả — không
avatar, không tên, không bio, không follow. Khi backend mở `GET /api/profile/{userId}` (và trả
`userId` trong post) thì thêm lại.

### Bỏ hẳn khi redesign (mockup có, BE không có — không bịa thay)

Khối macro (kcal/protein/carb/fat) · `servings` / `difficulty` / `prepTimeMinutes` của **bài**
(công thức đính kèm thì có, vì đến từ `GET /api/recipes/{id}`) ·
`PostNutrition` · `PostIngredientGroup` (nguyên liệu + khối "chef secret") · `PostStep` (các bước nấu) ·
dải fact strip (`FactStrip`) · thẻ tác giả (avatar + tên + bio + follow) · **toàn bộ danh sách bình
luận bịa** (`COMMENT_POOL`, số tim, "load more" ảo) · nút Save Post / Save Recipe ·
**thanh vote like/dislike** (`GET/PUT .../votes` BE có nhưng UI bỏ 2026-11-02, không nằm trong
mockup chốt) · nhánh
`<video>` (`type`/`videoUrl` BE đã bỏ) · dòng "Prep 15m / Cook 25m / Serves 4".

### Còn nợ ở Post Detail

- **`viewCount` trên prod luôn 0** (như mọi màn khác).
- **Related/recipes cần JWT**: khách vãng lai thấy lưới Related rỗng và sidebar thiếu công thức.
  `getRelatedPosts` đặt `retry: false` để 401 không retry, nhưng vẫn gọi 1 request.
  Muốn tránh hẳn thì gate bằng `isAuthenticated` — đổi khi cần.
- Chưa có UI **trả lời** bình luận: `createComment` đã nhận `parentId` nhưng form luôn gửi `null`.
- Chưa có sửa/xoá bình luận (`PATCH`/`DELETE` comment BE đã có, UI chưa dùng).
- Nút "Xem tất cả công thức của tôi" ở `AttachedRecipes` trỏ `/recipes` — trang đó chỉ hiện
  công thức **của chính mình**, chưa có trang công thức công khai (`GET /api/recipes` chưa có).

---

## Create Recipe `/recipes/create` — thiết kế lại theo mockup Stitch "Create New Recipe", 2026-10-29 · tinh chỉnh 2026-10-30

`CreateRecipePage.tsx` + 6 file con cùng thư mục (`schema`, `payload`, `IngredientEditor`,
`StepEditor`, `AutocompleteField`, `RecipeSidebar`, `RecipePreviewCard`).

Data thật dùng ở Create Recipe:

| Endpoint | Dùng cho | Cần JWT |
|---|---|---|
| `POST /api/recipes` | tạo công thức | **có** |
| `GET /api/dishes?name&size=8` | gợi ý tên món (find-or-create ở BE) | **có** (401 nếu không) |
| `GET /api/ingredients?name&size=8` | gợi ý tên nguyên liệu | **có** |

| Vị trí trên UI | Nguồn | Loại | Ghi chú |
|---|---|---|---|
| Khối 1–4: tên, tên món, mô tả, nguyên liệu, bước nấu, khẩu phần, thời gian, độ khó | giá trị form → `POST /api/recipes` | **[R]** | 9 field form gửi; 5 field dinh dưỡng của body **không còn ô nhập** (2026-10-30) |
| Đếm `n / 255 ký tự` ở ô tên | `name.length` | **[D]** | khớp `maxLength: 255` |
| "`n` / 50 nguyên liệu · nhận số thập phân" | `ingredients.length` | **[D]** | khớp `maxItems: 50` |
| Mỗi bước nấu = 1 ô (tiêu đề + thân), "Thêm bước", mũi tên lên/xuống | `values.steps[]` → `joinSteps()` gộp thành `instructions` | **[D]** | BE nhận `instructions` là **một chuỗi TEXT**, không có mảng bước — gộp `"tiêu đề — thân"` mỗi bước một dòng |
| Servings − / + | `servings` | **[D]** | kẹp ≥ 1 theo `minimum: 1` |
| "Tổng `n` phút" | `prep + cook` | **[D]** | ẩn khi cả hai trống |
| Nhãn mức công sức dưới Độ khó | `difficulty` | **[H]** | `readiness.rank.*` — chữ tĩnh |
| ~~5 ô dinh dưỡng~~ | — | — | **bỏ 2026-10-30** theo mockup; BE vẫn nhận, `schema`/`payload` vẫn hỗ trợ nếu thêm lại |
| Thẻ xem trước cột phải | chính giá trị form + `user.username` từ `authStore` | **[D]** | ảnh bìa **không có** (endpoint không nhận) → nền gradient, như thẻ địa điểm ở Home |
| Checklist 4 dòng | `name`/`dishName`/`ingredients`/`instructions`/`servings`+time | **[D]** | phản hồi tức thì, không phải điều kiện gửi |
| Chữ tĩnh (tiêu đề khối, helper, tiêu chuẩn) | `recipe:*` | **[H]** | |

### Bỏ hẳn khi redesign (mockup có, BE không có — không bịa thay)

Chip danh mục recipe (Tofu Bowl / Tempeh Stir-Fry…) + "Browse All (48)" — body **không có**
`categoryId`/`dishCategoryId`; chỗ đó dùng ô **Tên món** có autocomplete `GET /api/dishes` ·
**Preview Card** / **Save Draft** / **Publish Recipe** (3 nút riêng) — chỉ có 1 `POST`, không
`PATCH`, không draft; gộp thành 1 nút gửi · "Draft autosaved 1m ago" + `✨ AI Suggested` — không
có autosave lẫn gợi ý AI · "+ Add Seasoning Base" / "+ Add Fresh Herb Garnish" — không có preset
nhóm nguyên liệu · nút "Recipe Checker" + "Estimated intake: 380 kcal" (tự tính) — thay bằng badge
"sẵn sàng n%" và kcal lấy từ **ô người dùng nhập** · ô "Xem trước JSON gửi đi" — bỏ, payload thật
chỉ hiện qua toast khi gửi · "⌨ Shift + Enter to add sub-notes" ở khối bước — mỗi bước chỉ có
tiêu đề + thân · nút bookmark trên thẻ xem trước · ảnh bìa thẻ xem trước → nền gradient (endpoint
không nhận ảnh) · grip ⋮⋮ mỗi bước là **trang trí**, đổi thứ tự bằng mũi tên lên/xuống ·
ảnh thật + bio của tác giả trên thẻ xem trước — chỉ có `user.username` (avatar = chữ viết tắt).

### Còn nợ ở Create Recipe

- Dinh dưỡng là **số người dùng tự nhập**, không phải tính toán.
- `GET /api/recipes/{id}` chưa gọi (BE đã có) — chưa cần vì `/recipes` render dialog từ row.
- Recipe mới luôn `PENDING` (ADR-016), chưa có UI nói rõ với người dùng ngoài dòng
  `standards.moderate` ở sidebar.

---

## My Recipes `/recipes` — mockup Stitch "My Recipes", 2026-10-30

`MyRecipesPage/MyRecipesPage.tsx` (1 file: page + `RecipeManageCard` + `RecipeDetailDialog`).

Data thật dùng ở My Recipes:

| Endpoint | Dùng cho | Cần JWT |
|---|---|---|
| `GET /api/recipes/me` | **toàn bộ** page — 1 request, trả **mảng phẳng** | **có** |

`/api/recipes/me` không nhận `page`/`size`/`q`/`sort` → tìm kiếm, lọc độ khó, tab trạng thái,
sort và phân trang (6 thẻ/trang) đều **cắt ở client** (cùng cách `ExplorePage`).

| Vị trí trên UI | Field | Loại | Ghi chú |
|---|---|---|---|
| Breadcrumb, "CREATOR STUDIO" pill, "Auto-sync active", H1, subtitle, "Pro Creator Tip" | `recipe:myRecipes.*` | **[H]** | chữ tĩnh |
| Nút "+ Create New Recipe" (header + empty state) | → `/recipes/create` | **[D]** | trang tạo đã có sẵn |
| 4 `StatCard`: Total / Published / Under review / Quick meals | đếm `recipes` (APPROVED / PENDING / `prep+cook ≤ 30`) | **[D]** | mockup có "This Month" + trend %; BE không trả mốc thời gian → bỏ. Layout **icon nằm ngang** với số/nhãn (2026-10-30) |
| Pill tab `All / Published / Under Review / Needs Changes` + số | `moderationStatus` | **[R]** | `MODERATION_VARIANT` dùng lại của admin |
| Ô search | `name` + `dishName` + `ingredients[].name` | **[D]** | mockup ghi "name, ingredient, or tag" — recipe **không có tag** |
| Select độ khó | `difficulty` | **[R]** | **thay** cho "All Categories" của mockup (xem dưới) |
| Select sort `Recently modified / Recently created / Name (A–Z)` | `updatedAt` / `createdAt` / `name` | **[D]** | **không còn nút đổi chiều** (bỏ 2026-10-30): hướng cố định theo khoá — ngày giảm dần, tên A–Z |
| "Showing N–M of T recipes · Sorted by …" | `filtered.length` | **[D]** | |
| "Drafts synced from the server" | — | **[H]** | mockup ghi "All drafts synced locally" — app **không** có autosave |
| Nhãn trên cùng thẻ (overline) | `dishName` | **[R]** | **thay** category overline của mockup |
| Tiêu đề / mô tả thẻ | `name`, `description` (null → `noDescription`) | **[R]** | |
| Hàng đầu thẻ: badge trạng thái + pill độ khó, servings ở **góc phải** | `moderationStatus`, `difficulty`, `servings` | **[R]** | mockup đặt 2 badge trên ảnh bìa + "2 Servings" góc phải hàng đầu — không có ảnh bìa nên dồn vào hàng đầu |
| Nền gradient + icon lá ở mockup | — | **[X]** | recipe **không có** ảnh bìa → bỏ hẳn khối gradient, thẻ gọn còn nội dung |
| Hàng meta: **Prep** / **Cook** / số nguyên liệu | `prepTimeMinutes`, `cookTimeMinutes`, `ingredients.length` | **[R]** | `null` → `—`; **tách riêng** prep và cook (trước gộp "tổng N phút") |
| 4 ô macro (kcal / Protein / Carbs / Fiber) | — | **[X]** | **đã bỏ khỏi thẻ** 2026-10-30 (mockup không có); 4 field vẫn gửi được ở `POST /api/recipes` |
| Nút trên thẻ | "View Recipe" → mở `Dialog` | **[D]** | dialog dựng từ chính row, không gọi thêm API |
| Footer dialog chi tiết | chỉ "Close" | **[H]** | **bỏ nút "Enhance with AI Nutrition"** 2026-10-30 — banner "Pro Creator Tip" bên dưới trang vẫn giữ |
| Nút xoá 🗑 của mockup | — | **[X]** | **không có** endpoint xoá/sửa recipe cho member → bỏ hẳn nút |
| Banner "Pro Creator Tip" + "Enhance with AI Nutrition" | → `/ai-nutrition` | **[H]/[D]** | |
| Phân trang `Previous / 1 2 3 / Next` | cắt client 6 thẻ/trang | **[D]** | |

### Bỏ hẳn khi redesign (mockup có, BE không có — không bịa thay)

Select **"All Categories (6)"** + overline category trên thẻ — `RecipeResponse` **không có**
category (`categoryIds` chỉ có ở `AdminRecipe`); thay bằng lọc **độ khó** + tên món ·
nút 🗑 xoá và nút "✎ Edit / Continue Editing" — BE **không có** `PATCH`/`DELETE` recipe cho
member (chỉ admin có) → thẻ chỉ mở dialog chi tiết ·
nhãn **DRAFT** cho bản nháp — BE không lưu draft recipe, mọi recipe mới đều `PENDING` ·
"Last saved 0m ago" / autosave · bộ lọc theo tag (`Cuisine: Asian`, `Diet: High Protein`) —
recipe không có tag/diet field · số "This Month" + phần trăm tăng trưởng ở 4 card ·
nút "Import Recipe" (đã thống nhất **không làm**) ·
**4 ô macro dinh dưỡng trên thẻ** + khối gradient/ảnh bìa (bỏ 2026-10-30) ·

### Còn nợ ở My Recipes

- Không có API sửa/xoá recipe của member → "quản lý" hiện chỉ là **xem + theo dõi kiểm duyệt**.
  Muốn sửa/xoá phải nới backend (`PATCH`/`DELETE /api/recipes/{id}`).
- Dialog chi tiết dựng từ row trong list; nếu list rút gọn field thì phải gọi `GET /api/recipes/{id}`.
- Lọc + sort + phân trang đều **client-side trên một lần gọi**; user nhiều recipe thì phải nới backend.

---

## Các screen khác

Chưa audit chi tiết từng cái — xem bảng tổng hợp ở `UI-DATA-MAP.md` §1.
Sẽ bổ sung khi tới lượt từng screen.

| Screen | Trạng thái |
|---|---|
| Post Detail `/posts/:id` | ✅ đã audit — **không còn mock**, xem mục riêng ở trên |
| Create Recipe `/recipes/create` | ✅ đã audit — xem mục riêng ở trên |
| My Recipes `/recipes` | ✅ đã audit — xem mục riêng ở trên |
| My Posts `/my-posts` | mock activity feed; tab My Videos / Saved Recipes chưa có API |
| Nearby / Location Detail | `MOCK_AREAS`, review/ảnh/sustainability badges |
| AI Nutrition | swaps hardcode, BMI 175/67, model name |
| Create Post (dialog) / MealPlan | summary không gửi BE, 2 pill tĩnh "Draft autosaved" + "Plant Verified"; servings mặc định |
| Auth | "10,000+ recipes", "4.2" model rating |
| Admin | dashboard số giả, `contentCount` giả |
