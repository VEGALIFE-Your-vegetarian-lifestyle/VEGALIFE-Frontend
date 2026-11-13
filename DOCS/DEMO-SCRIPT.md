# VEGALIFE — Kịch bản demo

4 flow, tổng ~12–15 phút. Mọi bước dưới đây dùng **API thật**, không mock.
Dữ liệu nhập tay lấy từ `DOCS/DEMO-DATA.md`.

**Chuẩn bị trước khi lên sân (làm trước 10 phút):**

- [ ] Mở `https://vegalife-backend.onrender.com/api/health` để đánh thức Render free tier (ngủ sau 15 phút).
- [ ] Đăng nhập sẵn **1 tài khoản user** đã `activated` (tab 1), **1 tài khoản admin** (tab 2) nếu demo thêm `/admin`.
- [ ] User demo đã **claim gói FREE** ở `/ai-nutrition` (5 lượt hỏi) — nếu chưa claim, flow 4 sẽ đứng ở banner "0 requests".
- [ ] Có sẵn ≥ 1 bài `published` trong feed và ≥ 1 bài nháp ở `/my-posts`.
- [ ] Trình duyệt đã **cho phép vị trí** (flow 3) — DevTools → Sensors → Location `10.7769, 106.7009`.
- [ ] Đăng xuất sẵn nếu muốn mở màn bằng trạng thái khách.

---

## Flow 1 — Khách lướt Home + Explore, bị chặn ở comment/vote/tạo bài

**Mục tiêu nói với khán giả:** "Nội dung công khai, tương tác mới cần tài khoản."

### 1.1 Home — `/` (chưa đăng nhập)

1. Mở `/`. Cuộn chậm qua: hero nền động, dải pill danh mục (lấy từ `GET /api/categories`), "Editorial Showcase", khối cộng đồng.
2. Bấm 1 pill danh mục → nhảy `/explore?q=<tên danh mục>`.
3. Gõ từ khoá vào ô search trên navbar → Enter → `/explore?q=...`.

**Nói:** Hero dùng số thật từ `GET /api/posts/feed` (`totalElements`) và `GET /api/categories`. Khối "Nearby picks" bên phải đang hiện **lời mời đăng nhập** vì endpoint địa điểm cần JWT — đúng thiết kế, không phải lỗi.

### 1.2 Explore — `/explore`

1. Gõ từ khoá, đổi tab All / Recipe / Blog, bấm vài category ở panel lọc trái, đổi sort Popular ↔ Recent.
2. Bấm **thẻ bài viết** → `/posts/:id` → xem chi tiết: nội dung, công thức đính kèm, bài liên quan.
3. Quay lại `/explore`.

**Nói:** lọc/sort chạy client-side trên trang feed đã tải (`GET /api/posts/feed`), nên đổi bộ lọc là tức thì.

### 1.3 Điểm chặn — vote / comment

1. Trên card feed, bấm mũi tên **▲** → toast báo cần đăng nhập. Bấm lại lần nữa, chỉ vào toast.
   *(Số vote vẫn hiện vì `GET /api/posts/{id}/votes` là public; `PUT` mới cần JWT.)*
2. Bấm nút comment trên card → dialog bình luận mở, danh sách comment public đọc được, ô nhập thay bằng dòng **"đăng nhập để bình luận"**.
3. Bấm link đó → `/login`.

### 1.4 Đăng nhập và quay lại

1. Điền identifier (**email** — không phải display name) + mật khẩu → vào Home.
2. Vào lại `/explore` → bấm **▲** → số vote +1 ngay (optimistic update), bấm lại → bỏ vote (toggle).
3. Mở dialog comment → gõ bình luận (dữ liệu mẫu §5.4 trong `DEMO-DATA.md`) → Gửi → comment xuất hiện đầu danh sách, tổng số tăng.

**Nói:** vote là optimistic — UI đổi trước, rollback nếu API lỗi. Comment gửi xong `POST` không trả đủ field nên FE invalidate và đọc lại cây comment từ `GET`, tránh hiển thị thiếu.

---

## Flow 2 — Tạo bài viết (dialog, không có route riêng)

**Điều kiện:** đang đăng nhập.

1. Bấm nút **"+ New post"** trên navbar (hoặc `+` ở `/my-posts`) → dialog soạn bài bật lên tại chỗ.
2. Nhập:
   - **Tiêu đề:** `Nước dùng chay trong 4 giờ: rang gừng trước khi ninh`
   - **Danh mục:** `Soups`
   - **Nội dung:** dán khối text §5.1 trong `DEMO-DATA.md` (3 nguyên tắc nấu nước dùng).
   - **Ảnh bìa:** bấm ô ảnh → chọn **file ảnh ≤ 5 MB** (tuỳ chọn; không có ô dán URL).
   - **Gắn công thức:** bấm chip công thức → chọn 1 recipe đã duyệt (tuỳ chọn).
3. Chỉ vào rail phải: checklist điều kiện + preview card.
4. Bấm **Publish** → toast thành công, dialog đóng.
5. Vào `/my-posts` → bài mới nằm đầu danh sách, badge **Published**.
6. Bấm bài → `/posts/:id` → thấy bài công khai; mở `/explore` xác nhận bài có trong feed.

**Nói (kỹ thuật, nếu khán giả là giảng viên):**
`POST /api/posts` chỉ tạo **draft** → FE gọi tiếp `PATCH` để publish và gắn category/recipe. Thiếu danh mục hoặc nội dung rỗng thì **FE chặn ngay dưới ô nhập** (không gửi request). Soạn bài là **một dialog dùng chung cho cả tạo và sửa**, mount một lần ở `Layout`, mở bằng `useUiStore().openComposer(postId?)`.

**Biến thể nếu còn thời gian:** mở `/my-posts` → bấm **Sửa** trên bài nháp → đổi tiêu đề → Lưu. Hoặc dán bài dài §5.3 để demo `estimateReadMinutes` ≥ 10 phút trên card.

> Lưu ý: backend kiểm duyệt — bài publish có thể vào hàng chờ duyệt tuỳ cấu hình. Nếu bài chưa lên feed ngay, mở `/admin/posts` (tab admin) → Approve → quay lại feed.

---

## Flow 3 — Tìm địa điểm ăn chay quanh bạn (`/nearby`)

⚠️ **Trang này KHÔNG có ô tìm theo tên quán.** Backend chỉ có `GET /api/locations/nearby?lat&lng&radius` (theo toạ độ) và `GET /api/locations?placeType&minRating&maxPriceLevel` — không có tham số `q`/`name`. Đừng hứa "gõ tên quán" trong lúc demo. Demo theo 3 trục có thật: **khu vực / GPS → loại hình → sắp xếp**, rồi vào chi tiết.

1. Mở `/nearby`. Trình duyệt hỏi quyền vị trí → **Cho phép**.
2. Nếu muốn tránh popup GPS: chọn **quận** ở ô dropdown bên trái (mặc định Quận 1) — dùng toạ độ tâm quận, bán kính 10 km.
3. Bấm pill **100% Vegan Restaurant** / **Vegetarian Cafe** / **Organic Grocery** / **Vegan Market** → danh sách + marker trên bản đồ lọc ngay, số đếm trên pill khớp kết quả.
4. Đổi sort **Closest first ↔ Highest rated**.
5. Đổi chế độ xem **Split / List / Map**.
6. Bấm 1 marker hoặc card → card được chọn (viền xanh, marker đổi màu cam) → bấm **View Details** → `/nearby/:id`.
7. Trang chi tiết: banner tên + rating + địa chỉ, trạng thái mở/đóng theo giờ thật, bản đồ, giờ mở cửa cả tuần, liên hệ (điện thoại/website).
8. Bấm **Get Directions** → mở Google Maps tab mới, điểm xuất phát là GPS nếu đã cho phép.

**Nói:** bán kính cố định 10 km, một request lấy hết rồi lọc client-side để pill có số đếm chính xác. `/nearby/:id` yêu cầu đăng nhập (dữ liệu chi tiết thuộc member), `/nearby` thì public.

> **Nếu bị hỏi "sao không tìm theo tên":** trả lời thẳng — FE đã có `GET /api/locations` phân trang nhưng backend chưa nhận tham số tên; khi backend thêm `q` thì chỉ cần nối vào ô search của trang, không phải sửa kiến trúc.

---

## Flow 4 — AI chatbot dinh dưỡng + tự lập thực đơn tuần

**Điều kiện:** đang đăng nhập, đã claim gói FREE (5 lượt).

### 4.1 Chat — `/ai-nutrition`

1. Mở trang. Chỉ vào panel phải: **BMI & Protein Target** (cao `165`, nặng `61`, mức vận động) → BMI ~22.4 tính ngay tại client.
2. Bấm **Claim 5 Free Requests** (nếu chưa claim) → toast "đã nhận".
3. Bấm 1 **quick prompt** có sẵn, hoặc gõ:
   `Gợi ý thực đơn chay 1 ngày đủ 60g đạm cho người 61kg, ưu tiên món Việt.`
4. Enter → câu trả lời hiện dưới, số lượt còn lại giảm.
5. Bấm **Dish Picker** trong rail → tìm món (`GET /api/dishes`) → tick 3–4 món → **Ask** → AI trả lời dựa trên **tên** các món đã chọn.
6. Chỉ vào "Conversations" — lịch sử lưu server, bấm 1 hội thoại để tải lại; bấm **New** để mở hội thoại mới.

**Nói:** `POST /api/ai/messages` trả `reply` + `usage`. Gửi lỗi thì câu hỏi được giữ lại để **Retry**, không bịa câu trả lời. Hết lượt → 429 → banner mời mua gói.

### 4.2 Tự lập thực đơn — `/meal-plan/create`

1. Từ `/meal-plan` bấm **Create** (hoặc sidebar **Meal plan** → nút tạo) → `/meal-plan/create?from=<thứ 2>`.
2. Với một vài ô bữa: gõ tên món vào ô **Search dish** → dropdown gợi ý (debounce 300 ms) → chọn món.
3. Chỉ vào rail "Yêu cầu của tuần" đang đếm **Món khác nhau x / 5** và **Món lặp nhiều nhất**: chọn 4 món → nút Lưu còn khoá; chọn món thứ 5 → đạt; chọn món thứ 4 lần → vượt luật, nút khoá lại.
4. Điền đủ ≥ 5 món khác nhau, mỗi món ≤ 3 lần → thêm **Ghi chú tuần** → bấm **Lưu thực đơn**.
5. Tự chuyển về `/meal-plan?status=drafted` → menu vừa tạo hiện trên lưới 7 ngày.
6. Trên card menu bấm **Lên lịch** → trạng thái `scheduled` → chuyển pill **Scheduled** thấy menu.
7. Bấm tên một món trong ô bữa → dialog chi tiết món (dựng từ chính response tuần, không gọi thêm API).

**Nói:** luật BR-MENU-005 là **≥ 5 món khác nhau và ≤ 3 lần/món**, validate phía client bằng hàm thuần (không Yup) vì đây là quan hệ giữa các ô; backend vẫn chặn lần nữa. Menu tạo ra luôn là `drafted`; không có endpoint xoá — `cancelled` là đường bỏ duy nhất.

> Nếu muốn khép vòng: quay lại `/ai-nutrition`, hỏi "lập thực đơn 7 ngày từ các món tôi vừa chọn" → AI trả plan → rồi nhập tay vào form tạo tuần. Đây là 2 bước rời nhau, FE **không** có nút đẩy kết quả chat thành menu.

---

## Thứ tự trình bày gợi ý & thời lượng

| # | Flow | Thời lượng | Điểm nhấn |
|---|---|---|---|
| 1 | Home + Explore → login khi vote/comment | 4 phút | Public đọc, member tương tác |
| 2 | Tạo bài bằng dialog | 3 phút | Draft → publish, attach recipe |
| 3 | Nearby + chi tiết địa điểm | 3 phút | Bản đồ thật, GPS, 3 chế độ xem |
| 4 | AI chat + tạo thực đơn tuần | 5 phút | Quota, Dish picker, luật 5 món |

## Câu chốt

- Toàn bộ dữ liệu là API thật (`DOCS/API-COVERAGE.md`); chỉ dashboard admin và vài field hiển thị bài viết còn mock (`DOCS/MOCK-FIELDS.md`).
- 14 namespace i18n, đổi EN ↔ VI ngay trên navbar — bấm thử 1 lần ở flow 1 hoặc 2.
- Phân quyền ở route guard: `/nearby/:id`, `/my-posts`, `/meal-plan*`, `/recipes*`, `/ai-nutrition` (chat) cần đăng nhập; `/admin/*` cần role ADMIN.

## Phương án dự phòng

| Sự cố | Xử lý |
|---|---|
| Backend Render vừa ngủ, spinner quá 20 s | F5 lại; nói "cold start free tier", đã mở `/api/health` trước |
| GPS bị từ chối | Chọn quận từ dropdown — vẫn có dữ liệu |
| Bài vừa tạo chưa lên feed | Vào `/admin/posts` → Approve (tab admin) |
| Hết lượt AI giữa demo | Claim gói FREE ở tab khác, hoặc chuyển sang flow 4.2 (không cần quota) |
| Bản đồ OSM không tải tile | Component tự chuyển sang nguồn Esri; nói "có fallback 2 nguồn tile" |
| Mạng yếu, ảnh không tải | Placeholder đã có sẵn, không vỡ layout |
