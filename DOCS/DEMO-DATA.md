# VEGALIFE — Bộ dữ liệu demo

Copy-paste trực tiếp vào form khi demo toàn dự án. Không mock gì — mọi thứ dưới đây là dữ liệu bạn tự nhập vào app thật.

**Toàn bộ dữ liệu trong file đã được đối chiếu với validate của FE và ràng buộc của backend** (đọc 2026-11-06) — nhập đúng như dưới sẽ **không bị 400**.

Thứ tự demo gợi ý: **Đăng ký → Hồ sơ → Công thức → Thực đơn tuần → Bài viết → Bình luận → Gói AI → Admin → Unhappy case (§10)**.

> Hướng dẫn bấm từng bước nằm ở `DOCS/DEMO-SCRIPT.md`. File này chỉ chứa **dữ liệu để dán**.

---

## 1. Đăng ký & đăng nhập

### 1.1 Đăng ký (`/register`)

| Ô | Giá trị |
|---|---|
| Display name | `Minh Chay` |
| Email | `demo.vegalife@gmail.com` |
| Password | `Vegalife@2026` |
| Confirm password | `Vegalife@2026` |

Ràng buộc đang chạy:
- **Display name** 2–100 ký tự. Đây **chỉ là nhãn hiển thị**, không phải tên đăng nhập, không cần duy nhất.
- **Email** đúng định dạng, ≤ 100 ký tự. **Email là danh tính duy nhất** (ADR-019) — mọi thứ tra theo email.
- **Password** ≥ 8 ký tự, phải có **chữ hoa + chữ thường + số + ký tự đặc biệt**. `Vegalife@2026` thoả cả 4.

### 1.2 Xác thực email (`/verify-email`)

OTP gồm **đúng 6 chữ số**. Email bị khoá khi vào từ luồng đăng ký.

> Không có hộp thư thì dùng tài khoản đã `activated` sẵn để demo. Đăng ký mới **luôn** phải qua bước này.

### 1.3 Đăng nhập (`/login`)

| Ô | Giá trị |
|---|---|
| Identifier | `demo.vegalife@gmail.com` |
| Password | `Vegalife@2026` |

> **Ô identifier phải là EMAIL**, không phải display name. Backend chỉ tra theo email; gõ `Minh Chay` sẽ trả `400 Invalid email or password` (đăng nhập sai trả **400**, không phải 401 — đừng nhầm là hỏng interceptor).
> Lỗi đăng nhập của backend là **400**, không phải 401, nên **không** kích hoạt refresh token.

**Google login**: nút Google trên `/login` chạy OAuth thật, cần cấu hình client id ở backend. Nếu bấm mà toast `googleFailed` thì môi trường chưa cấu hình, bỏ qua.

### 1.4 Quên mật khẩu (`/forgot-password`)

3 bước liền mạch: `email` → `otp` (6 chữ số) → `newPassword`.

| Bước | Giá trị |
|---|---|
| Email | dùng một email **có thật trong hệ thống** |
| OTP | 6 chữ số lấy từ hộp thư |
| Mật khẩu mới | `Vegalife@2027` (vẫn đủ hoa/thường/số/đặc biệt) |

> Demo luồng này cần đọc được mail thật. Không có hộp thư thì **bỏ qua**, đừng demo nửa vời.

Tài khoản ADMIN cho `/admin` — dùng tài khoản seed của backend, **không tạo được từ UI**.

---

## 2. Hồ sơ (`/profile`)

| Ô | Giá trị |
|---|---|
| Chiều cao | `165` |
| Cân nặng | `61` |
| Tuổi | `26` |
| Giới tính | `female` |
| Giới thiệu | `Mình nấu chay cho gia đình ba người, ưu tiên nguyên liệu theo mùa và món Việt truyền thống.` |
| Mục tiêu sức khoẻ | `Giảm 3 kg trong 3 tháng, giữ đủ đạm cho buổi tập.` |

**Sở thích ăn** — gõ từng cái rồi Enter (mỗi mục 1 chip):

```
cay
nhiều rau lá
đậu hũ
nấm
cơm gạo lứt
```

**Không thích** (mỗi dòng 1 mục):

```
ngò rí
mướp đắng
```

**Dị ứng** — hiện cảnh báo **đỏ** ở `/account`:

```
đậu phộng
đậu nành
```

**Kiêng cữ**:

```
không đường thêm
không chiên dầu
```

Ràng buộc đang chạy:
- Chiều cao `0.01 – 300` · cân nặng `0.01 – 500` · tuổi `1 – 150`.
- Giới tính chỉ nhận `male` / `female` / `other`.
- Giới thiệu ≤ **2000** ký tự.
- Mỗi danh sách ≤ **50** mục, mỗi mục ≤ **100** ký tự. Mục tiêu sức khoẻ **không được validate độ dài** — ô chỉ có bộ đếm `x / 200`, gõ dài hơn vẫn lưu.
- BMI tự tính từ chiều cao + cân nặng (165 / 61 → **22.4**), hiện ở `/account` và ở widget BMI trang AI.

---

## 3. Công thức (`/recipes/create`)

> **ĐƠN VỊ CHỈ ĐƯỢC LÀ `g` · `ml` · `piece` (chữ thường).**
> Gõ `củ`, `quả`, `thìa`, `bó`, `kg`, `tbsp`, `cup` → **400 ngay**. Bảng dưới đã quy đổi sẵn.
> Không gõ được thì **để trống ô đơn vị** — nhưng chỉ khi đó là nguyên liệu **đã có sẵn** trong hệ thống (chọn từ autocomplete). Nguyên liệu mới mà bỏ trống đơn vị vẫn lưu được, chỉ là không có đơn vị.

Ràng buộc chung cho cả 3 công thức:
- Tên công thức / tên món ≤ **255** ký tự, bắt buộc.
- Tên nguyên liệu ≤ **100** ký tự, **không trùng nhau** trong cùng công thức (trùng → tô đỏ, chặn gửi).
- Số lượng: số **> 0**, tối đa 3 chữ số thập phân (`0.5` ok, `0.125` ok, `1/2` ✗).
- Tối đa **50** nguyên liệu.
- Khẩu phần: số nguyên **≥ 1**.
- Chuẩn bị / nấu: số nguyên phút, **được để trống**.
- Độ khó: `EASY` · `MEDIUM` · `HARD` (hoặc để trống).
- Mỗi bước nấu = 1 ô tiêu đề + 1 ô thân. Có tiêu đề thì **thân phải có chữ**. Cần ≥ 1 bước.
- **Không có ô dinh dưỡng** — form không nhập, backend tự tính (V49/V50). Đừng hứa "nhập calories" khi demo.
- Công thức mới luôn ở trạng thái `PENDING` — phải vào `/admin/recipes` duyệt mới hiện công khai.

### 3.1 Bún chả chay

| Ô | Giá trị |
|---|---|
| Tên công thức | `Bún chả chay` |
| Tên món | `Bún chả` |
| Mô tả | `Chả nấm và đậu hũ nướng than hoa, chan nước mắm chay chua ngọt. Ăn kèm bún tươi và rau sống.` |
| Khẩu phần | `2` |
| Chuẩn bị (phút) | `20` |
| Nấu (phút) | `25` |
| Độ khó | `MEDIUM` |

**Nguyên liệu**

| Tên | Số lượng | Đơn vị |
|---|---|---|
| Bún tươi | 300 | g |
| Đậu hũ non | 200 | g |
| Nấm hương | 100 | g |
| Nấm bào ngư | 150 | g |
| Cà rốt | 120 | g |
| Đu đủ xanh | 200 | g |
| Nước tương | 45 | ml |
| Đường thốt nốt | 15 | g |
| Giấm gạo | 30 | ml |
| Rau sống | 50 | g |

**Các bước nấu**

| Tiêu đề | Thân |
|---|---|
| Sơ chế nấm | `Nấm hương ngâm nước ấm 20 phút, cắt chân. Nấm bào ngư xé miếng vừa ăn, rửa sạch rồi vắt ráo.` |
| Ướp và nướng | `Trộn nấm với 30 ml nước tương, 15 g đường thốt nốt và chút tiêu. Ướp 15 phút rồi nướng 200°C trong 12 phút, trở mặt giữa chừng.` |
| Làm nước chấm | `Pha 15 ml nước tương còn lại với giấm gạo, đường và 60 ml nước lọc. Thêm đu đủ xanh và cà rốt bào sợi.` |
| Trình bày | `Xếp bún ra bát, đặt nấm nướng lên trên, chan nước chấm và ăn kèm rau sống.` |

### 3.2 Canh chua chay

| Ô | Giá trị |
|---|---|
| Tên công thức | `Canh chua chay` |
| Tên món | `Canh chua` |
| Mô tả | `Canh chua miền Nam bản chay, chua bằng me và cà chua, ngọt từ dứa.` |
| Khẩu phần | `3` |
| Chuẩn bị (phút) | `10` |
| Nấu (phút) | `15` |
| Độ khó | `EASY` |

**Nguyên liệu**

| Tên | Số lượng | Đơn vị |
|---|---|---|
| Cà chua | 200 | g |
| Dứa | 200 | g |
| Giá đỗ | 150 | g |
| Đậu bắp | 100 | g |
| Me chua | 30 | g |
| Rau ngổ | 30 | g |
| Nước tương | 30 | ml |

**Các bước nấu**

| Tiêu đề | Thân |
|---|---|
| Nấu nước me | `Me ngâm nước nóng 10 phút, lọc lấy nước chua, bỏ hạt.` |
| Nấu rau | `Đun 800 ml nước, cho cà chua và dứa vào nấu 5 phút rồi thêm đậu bắp, giá đỗ.` |
| Nêm | `Đổ nước me, nêm nước tương cho vừa chua ngọt. Tắt bếp, thả rau ngổ.` |

### 3.3 Nộm rau theo mùa

| Ô | Giá trị |
|---|---|
| Tên công thức | `Nộm rau theo mùa` |
| Tên món | `Nộm rau` |
| Mô tả | `Nộm rau củ thái sợi, sốt mè rang chua ngọt, không dùng nước mắm.` |
| Khẩu phần | `2` |
| Chuẩn bị (phút) | `15` |
| Nấu (phút) | `0` |
| Độ khó | `EASY` |

**Nguyên liệu**

| Tên | Số lượng | Đơn vị |
|---|---|---|
| Cà rốt | 100 | g |
| Su hào | 150 | g |
| Dưa leo | 150 | g |
| Bắp cải tím | 100 | g |
| Mè rang | 20 | g |
| Nước tương | 30 | ml |
| Chanh | 30 | ml |
| Rau thơm | 30 | g |

**Các bước nấu**

| Tiêu đề | Thân |
|---|---|
| Thái rau | `Cà rốt, su hào, dưa leo, bắp cải thái sợi mỏng. Ngâm nước đá 10 phút cho giòn rồi vắt ráo.` |
| Làm sốt | `Trộn nước tương, nước cốt chanh, đường và mè rang. Khuấy đều.` |
| Trộn | `Trộn rau với sốt, để 5 phút cho thấm rồi rắc rau thơm.` |

### 3.4 Sau khi tạo — vòng duyệt

1. Tạo 3.1 → vào `/recipes` → tab **Pending**, thấy badge vàng.
2. Đăng nhập admin, mở `/admin/recipes` → lọc `PENDING` → mở dialog chi tiết → **Approve**.
3. Quay lại `/recipes` tab **Approved** → badge xanh.
4. Tạo 3.2 rồi **Reject** ở admin với lý do (≤ 1000 ký tự), ví dụ:
   `Thiếu định lượng cho phần nước dùng, bổ sung rồi gửi lại giúp mình nhé.`
   → `/recipes` tab **Rejected** hiện đúng lý do đó (component `RejectionReason`).

> Duyệt recipe **không** duyệt dish/nguyên liệu của nó. Muốn nguyên liệu mới có dinh dưỡng thì admin phải vào riêng — xem §8.2.

---

## 4. Thực đơn tuần (`/meal-plan/create`)

**Món phải chọn từ ô tìm kiếm** (gọi `GET /api/dishes`, cần JWT) — **không gõ tay được**. Bảng dưới cố định **cấu trúc ô**; A→G là 7 món thật bạn gán khi demo. Form **không hỏi số khẩu phần** — gửi ngầm `servings: 1` vì thực đơn là của cá nhân.

> **Chọn 7 món thực tế, không phải 5.** Luật chỉ đòi **≥ 5 món khác nhau** (BR-MENU-005), nhưng lưới dưới có **19 ô** và mỗi món tối đa **3 lần** → 5 món × 3 = 15 < 19, **không bao giờ đủ**. Dùng 7 món thì 3+3+3+3+3+2+2 = 19 vừa khít.
>
> Nếu danh sách `GET /api/dishes` ít hơn 7 món, giảm số ô: mỗi ngày bỏ bớt 1 ô bữa (mỗi ngày cần **≥ 1 bữa**), miễn tổng ô ≤ `3 × số món`.

| Ngày | Sáng | Trưa | Tối |
|---|---|---|---|
| Thứ 2 | A | B | C |
| Thứ 3 | D | E | F |
| Thứ 4 | G | A | B |
| Thứ 5 | C | D | E |
| Thứ 6 | F | G | A |
| Thứ 7 | B | C | — |
| Chủ nhật | D | E | — |

Số lần lặp mỗi món: **A 3 · B 3 · C 3 · D 3 · E 3 · F 2 · G 2** (= 19 ô, 7 món khác nhau).

**Ghi chú tuần** (≤ 500 ký tự)

```
Tuần ăn chay nhẹ, ưu tiên món canh và rau luộc. Thứ 6 nấu nhiều hơn để phần bữa trưa thứ 7.
```

Ràng buộc đang chạy (validate client + backend, sai là **400 cả tuần**, không lưu gì):
- Đúng **7 ngày liên tiếp**, mỗi ngày **≥ 1 bữa**.
- **≥ 5 món khác nhau** (đếm theo `dishId`, không theo tên).
- **≤ 3 lần / món** — lỗi lặp được ưu tiên báo trước lỗi thiếu món.
- Ô bữa để trống thì **không gửi**. Form không có ô số khẩu phần — luôn gửi `servings: 1`.
- Ghi chú ≤ **500** ký tự.

**Vòng đời trạng thái** (`MenuActions` trên thẻ menu, `POST /api/menus/{id}/status`):

```
drafted ──► scheduled ──► completed
   │            │
   └────────────┴──► cancelled
```

- Menu tạo ra **luôn là `drafted`**.
- `cancelled` và `completed` là **trạng thái cuối** — hết nút.
- **Không có endpoint xoá.** `cancelled` là đường bỏ duy nhất.
- `drafted → scheduled` có thể trả **409** nếu trùng tuần đã có menu khác — FE hiện nguyên văn message của backend.
- `/meal-plan` mặc định chỉ hiện `scheduled`; đổi qua `PillTabs` + `?status=`. Lọc chạy client-side vì endpoint không nhận `status`.

---

## 5. Bài viết

**Không có route `/posts/create`.** Soạn bài là **dialog** `PostComposerDialog`, mở từ:
- nút **+ New post** trên navbar,
- nút **Create** ở `/my-posts`,
- task "Viết bài" ở `/account`,
- nút **Edit** trên bài đã có (dialog dùng chung tạo + sửa).

**Danh mục có thật trong DB** (`GET /api/categories`, đọc 2026-11-06 — 7 cái):
`Fruits` · `Mushrooms` · `Salads` · `Soups` · `Tips` · `Vegetables` · `test categories 1`

Bỏ qua `test categories 1` — category rác do seed. Dùng `Soups` cho 5.1, `Tips` cho 5.2, `Vegetables` cho 5.3.

Ràng buộc trong composer:
- **Tiêu đề ≤ 90 ký tự** (BE cho 255 nhưng FE chặn 90 để vừa thẻ feed).
- **Ảnh bìa = upload file**, không phải dán URL. Bấm ô ảnh → chọn file ảnh ≤ **5 MB**. Ảnh chèn trong bài cũng đi qua luồng upload 3 bước.
- **Publish bắt buộc**: ≥ 1 danh mục **và** nội dung không rỗng. Thiếu → lỗi ngay dưới ô, không gửi.
- **Save draft** thì không cần gì cả.
- **Không có ô chọn loại Blog/Video.** `POST /api/posts` không nhận `type` → **không tạo được bài video từ UI**. Đừng hứa.
- Gắn công thức: chip **Attach recipe** → dialog chọn (đã ẩn recipe `REJECTED`). Mặc định không bắt buộc.

### 5.1 Bài thường — đã đăng

| Ô | Giá trị |
|---|---|
| Tiêu đề | `Nước dùng chay trong 4 giờ: rang gừng trước khi ninh` |
| Danh mục | `Soups` |
| Ảnh bìa | chọn 1 file ảnh bất kỳ ≤ 5 MB (hoặc để trống) |
| Công thức gắn kèm | `Bún chả chay` (nếu đã duyệt ở §3.4) |

**Nội dung** (dán vào editor)

```
Một nồi nước dùng chay ngon không cần hạt nêm. Ba nguyên tắc mình giữ suốt bốn năm nấu chay:

1. Rang gừng và hành tím trước khi ninh. Vỏ gừng giữ lại, đập dập, rang khô trên chảo đến khi thơm rồi mới cho vào nồi.
2. Nấm hương khô là nguồn umami chính. Ngâm nước ấm 20 phút, giữ lại nước ngâm, lọc qua rây rồi đổ vào nồi.
3. Ninh ở lửa nhỏ nhất, không đậy kín. Đậy kín làm nước đục.

Thêm một củ cải trắng và một quả lê chín để nước có vị ngọt hậu. Bỏ mặn hoàn toàn — vị mặn đến từ 2 thìa nước tương thêm vào 5 phút cuối.

Nước dùng dùng được cho phở, bún, hoặc nấu canh. Để nguội rồi chia hộp đông lạnh, giữ được một tháng.
```

*(~175 từ, ~1 phút đọc — dùng để demo `estimateReadMinutes` ở mức thấp.)*

Tiêu đề 51 ký tự — vừa giới hạn 90.

**Bấm Publish ngay trong dialog.** KHÔNG có bước "vào `/my-posts` bấm Đăng" — `/my-posts` chỉ có **Sửa** và **Xoá**.

> `POST /api/posts` chỉ tạo `created` (draft); FE gọi tiếp `PATCH {publish: true}` + gắn category + gắn recipe. Nếu bài chưa lên feed ngay nghĩa là backend đang chờ duyệt — mở `/admin/posts` → **Approve**.

### 5.2 Bài nháp — dùng demo sửa/xoá

| Ô | Giá trị |
|---|---|
| Tiêu đề | `3 phút sơ chế đậu hũ non không bị nát` |
| Danh mục | `Tips` |
| Ảnh bìa | để trống |

**Nội dung**

```
Đậu hũ non rất dễ nát khi chiên. Cách mình làm:

Chần nguyên miếng đậu trong nước muối loãng 80°C khoảng 2 phút. Muối làm protein se lại, miếng đậu chắc hơn mà vẫn mềm bên trong.

Vớt ra, để thật ráo trên khăn giấy. Nếu còn nước, dầu sẽ bắn và vỏ không vàng đều.

Chiên ngập dầu ở 170°C. Không lật sớm — chờ mặt dưới vàng đều rồi mới trở.

Để ráo dầu trên giá, không để trên giấy, hơi nước sẽ làm vỏ mềm lại.
```

Bấm **Save draft** (không Publish) → bài nằm ở `created`.

Demo trên `/my-posts`: **Sửa** → đổi tiêu đề → Save draft → **Xoá** (ConfirmDialog) → biến khỏi danh sách. Đây là dữ liệu cho cả 2 thao tác ghi.

### 5.3 Bài dài — kiểm tra thời gian đọc

| Ô | Giá trị |
|---|---|
| Tiêu đề | `Ăn chay đủ đạm: bảng quy đổi mình dùng hằng tuần` |
| Danh mục | `Vegetables` |

**Nội dung** — dán nguyên khối, mục đích đẩy `estimateReadMinutes` lên **≥ 10 phút** trên card:

```
Đạm thực vật không thiếu, chỉ là mình không biết đếm. Dưới đây là bảng mình dùng để cân đủ 60 g đạm mỗi ngày mà không cần thịt.

Đậu hũ: 100 g cứng cho khoảng 8 g đạm. Đậu hũ non thấp hơn, khoảng 5 g, nhưng dễ ăn hơn nhiều nên mình vẫn dùng.

Đậu lăng: 100 g khô cho 25 g đạm. Nấu 20 phút là chín, không cần ngâm. Mình nấu một nồi lớn mỗi Chủ nhật, chia hộp cho cả tuần.

Đậu gà: 100 g khô khoảng 19 g đạm. Ngâm 8 tiếng, luộc 40 phút. Rang khô với gia vị sau khi luộc là thành món ăn vặt.

Đậu đen: 100 g khô khoảng 24 g đạm. Nấu chè, nấu xôi, hoặc trộn salad.

Tempeh: 100 g khoảng 19 g đạm. Lên men nên đạm dễ hấp thu hơn đậu hũ. Cắt lát mỏng, áp chảo.

Seitan: đạm cao nhất, 100 g khoảng 25 g. Nhưng làm từ gluten lúa mì nên không dùng được nếu kiêng gluten.

Yến mạch: 100 g khoảng 13 g đạm. Ăn sáng mỗi ngày là đã có gần 1/4 nhu cầu.

Gạo lứt: 100 g khô khoảng 8 g đạm. Không cao nhưng ăn nhiều nên vẫn đáng đếm.

Hạt bí: 100 g khoảng 30 g đạm. Rắc lên mọi thứ.

Mè: 100 g khoảng 17 g đạm. Sốt mè rang là cách mình dùng nhiều nhất.

Hạnh nhân: 100 g khoảng 21 g đạm. Đắt nên mình chỉ dùng để rắc.

Nấm hương khô: 100 g khoảng 20 g đạm. Ngâm nở rồi thái, dùng thay thịt trong món xào.

Cách mình cộng trong ngày: sáng yến mạch 50 g (6.5 g) + hạt bí 20 g (6 g). Trưa cơm gạo lứt 80 g (6.4 g) + đậu hũ 150 g (12 g) + rau. Tối đậu lăng 80 g khô (20 g) + tempeh 50 g (9.5 g).

Tổng khoảng 60 g. Đủ cho người 61 kg hoạt động vừa.

Ba điều mình học được sau bốn năm:

Một là, đừng cố đạt đủ trong một bữa. Rải ra ba bữa dễ hơn nhiều và cơ thể hấp thu tốt hơn.

Hai là, kết hợp ngũ cốc với họ đậu trong cùng bữa để đủ axit amin thiết yếu. Cơm với đậu, bánh mì với đậu hũ, yến mạch với hạt.

Ba là, đừng quên sắt và B12. Đạm thực vật thường kèm phytate làm giảm hấp thu sắt. Ăn kèm thực phẩm giàu vitamin C — ớt chuông, chanh, cà chua — để tăng hấp thu. B12 thì gần như không có trong thực vật, phải bổ sung.

Mình không phải bác sĩ. Đây chỉ là ghi chép cá nhân.
```

Bấm **Publish**. Sau đó vào `/explore` → bật bộ lọc **Reading time → In-depth (> 10 min)** → bài này phải hiện.

### 5.4 Bình luận (dán vào `/posts/{id}` của bài 5.1)

**Comment gốc** — ≤ **1000** ký tự:

```
Cảm ơn bạn. Phần rang gừng mình chưa thử bao giờ, để cuối tuần làm theo. Bạn có lọc nước ngâm nấm qua rây không hay để nguyên?
```

**Reply** vào chính comment đó (bấm **Reply** dưới comment):

```
Mình lọc qua rây 2 lần. Lần đầu bỏ cặn, lần hai lót thêm khăn mỏng cho nước trong.
```

**Lý do báo cáo** comment (nút Report, ≤ **500** ký tự):

```
Nội dung quảng cáo sản phẩm ngoài chủ đề bài viết.
```

Các thao tác comment cần demo:
- **Sửa** comment của chính mình (chỉ hiện trên comment của mình) → PATCH.
- **Xoá** → nội dung thành `[deleted]`, nhánh reply **giữ nguyên** (soft delete).
- **Report** → gửi lý do; admin xử lý ở `/admin/comments`.
- Vote: bấm **▲** lần 1 = upvote, bấm lần 2 = bỏ vote (toggle 2 chiều, optimistic).

---

## 6. Gói AI + thanh toán (`/account/subscription`)

Vào từ rail tài khoản **Subscription**, hoặc trực tiếp `/subscription` (link công khai).

1. Bấm **Claim 5 free requests** (gói miễn phí) → toast "đã nhận". Bấm lại → toast "đã claim rồi" (409 được xử lý riêng).
2. Bấm **Mua** ở gói trả phí → backend tạo payment → chuyển sang cổng VNPay.
3. Thẻ test VNPay (sandbox):

| Trường | Giá trị |
|---|---|
| Số thẻ | `9704198526191432198` |
| Tên chủ thẻ | `NGUYEN VAN A` |
| Phát hành | `07/15` |
| OTP | `123456` |

4. Thanh toán xong VNPay redirect về `/payment/result/{paymentId}`; trang poll **3 giây/lần** khi `status === "pending"`.

> **IPN là nguồn sự thật**, redirect chỉ để hiển thị. Trang kết quả còn `pending` quá lâu nghĩa là backend chưa nhận IPN — **không phải lỗi FE**.
> Tab **Lịch sử mua** và **Thanh toán** ở `/account/subscription` là 2 `PillTabs` gọi 2 endpoint khác nhau.

**AI chat** (`/ai-nutrition`) — quota tính theo số lượt còn lại:

```
Gợi ý thực đơn chay 1 ngày đủ 60 g đạm cho người 61 kg, ưu tiên món Việt.
```

- Mỗi tin nhắn ≤ **4000** ký tự. Gửi text thuần, `POST /api/ai/messages`.
- Hết lượt → banner "0 requests" → bấm **Claim 5 free** hoặc mua gói.
- **Dish Picker** gửi **tên món** (không gửi `dishId`) — `GET /api/dishes` cần JWT.
- Số lượt còn lại hiện ngay header: `<Plan> · Còn N câu hỏi`.

---

## 7. Tìm địa điểm (`/nearby`)

**Trang này KHÔNG có ô tìm theo tên quán** — backend chỉ có `GET /api/locations/nearby?lat&lng&radius` và `GET /api/locations?placeType&minRating&maxPriceLevel`. Đừng hứa "gõ tên quán".

Toạ độ để giả lập GPS (DevTools → Sensors → Location):

```
10.7769, 106.7009   (Quận 1, TP.HCM)
```

- Chọn **quận** ở dropdown thay cho GPS: `Quận 1` (mặc định), `Quận 3`, `Quận 4`, `Quận 5`, `Quận 7`, `Bình Thạnh`, `Phú Nhuận`, `Tân Bình`, `Thủ Đức`…
- Bán kính cố định **10 km**.
- Pill lọc: `All` · `100% Vegan Restaurant` · `Vegetarian Cafe` · `Organic Grocery` · `Vegan Market` — số đếm trên pill khớp kết quả.
- Sort: **Closest first** ↔ **Highest rated**.
- Chế độ xem: **Split / List / Map**.
- **View Details** → `/nearby/:id` — **cần đăng nhập** (`/nearby` thì public).
- **Get Directions** mở Google Maps, điểm xuất phát là GPS nếu đã cho phép.

---

## 8. Dữ liệu cho khu admin

### 8.1 Bài chờ duyệt (`/admin/posts`)

Lọc `status=created` → mở preview → **Approve** (publish bài + duyệt component PENDING) hoặc **Reject** kèm lý do.

Lý do từ chối mẫu (≤ **1000** ký tự):

```
Bài chưa có danh mục phù hợp và phần mở đầu trùng lặp với bài đã đăng trước đó. Bổ sung nguồn tham khảo rồi gửi lại.
```

Nút **Xoá** (soft delete) có ConfirmDialog.

### 8.2 Nguyên liệu (`/admin/ingredients`)

Tạo nguyên liệu mới — **5 ô dinh dưỡng phải điền đủ cả 5 hoặc bỏ trống hết**, và **có dinh dưỡng thì bắt buộc có đơn vị**.

| Ô | Giá trị |
|---|---|
| Tên | `Nấm đùi gà` |
| Đơn vị | `G` |
| Calories | `22` |
| Protein (g) | `3.3` |
| Carbohydrate (g) | `3.1` |
| Fat (g) | `0.3` |
| Fiber (g) | `2.3` |

> Đơn vị ở đây dùng **`G` / `ML` / `PIECE`** (chữ HOA) — khác với `g/ml/piece` của form member. Đó là 2 enum khác nhau, đừng nhầm.
> Điền 4/5 ô → lỗi `partialNutrition`. Điền đủ 5 mà bỏ trống đơn vị → lỗi `unitRequired`. **Không sửa được** đơn vị về rỗng, cũng không xoá trắng cả 5 ô dinh dưỡng (PATCH chỉ gửi field đã đổi).
> Lọc theo đơn vị có mục **`Chưa có đơn vị`** = `unit: null`.

### 8.3 Duyệt công thức (`/admin/recipes`)

- Lọc `moderationStatus` (mặc định `PENDING`), thêm `userId`, `categoryId`, khoảng ngày.
- Sort whitelist: `createdAt,desc` · `updatedAt,desc` · `name,asc`.
- Duyệt/từ chối **chỉ trong dialog chi tiết**. Lý do từ chối ≤ 1000 ký tự.
- Không có sửa/xoá recipe.

### 8.4 Bình luận (`/admin/comments`)

Lọc `active` / `removed`, sort `createdAt` / `updatedAt`, lọc theo `userId` / `postId`.

Lý do moderate mẫu — **bắt buộc**, ≤ **1000** ký tự:

```
Bình luận chứa link quảng cáo và không liên quan nội dung bài viết.
```

### 8.5 Danh mục (`/admin/categories`)

| Ô | Giá trị |
|---|---|
| Name | `Fermented` |
| Description | `Món lên men thực vật: tempeh, kimchi chay, dưa muối.` |

Giới hạn: name ≤ **100**, description ≤ **500**. Trang có thẻ đếm All/Active, tìm theo tên/UUID, sort `newest`/`name`, phân trang, **retire** (soft delete), export CSV. **Không** restore, **không** xoá vĩnh viễn.

### 8.6 Người dùng (`/admin/users`)

- Lọc theo status: `created` · `activated` · `deactivated` · `suspended`.
- **Lock** = suspend (ConfirmDialog), **Unlock** = restore.
- Demo: khoá 1 tài khoản test → đăng nhập tài khoản đó ở tab ẩn → bị chặn.

### 8.7 Video (`/admin/videos`)

- Danh sách video có sẵn từ seed, lọc theo status, tìm theo từ khoá.
- **Preview** chỉ bật khi `status === "succeed"` → mở dialog phát video.
- **Delete** = soft delete (ConfirmDialog).
- Không upload video từ trang này — video do luồng upload riêng tạo ra.

### 8.8 Địa điểm (`/admin/locations`)

Điền form tạo địa điểm:

| Ô | Giá trị |
|---|---|
| Tên | `Quán Chay Bình An` |
| Loại | `restaurant` |
| Địa chỉ | `12 Nguyễn Trãi, Quận 1, TP.HCM` |
| Điện thoại | `0909123456` |
| Vĩ độ | `10.7705` |
| Kinh độ | `106.6981` |
| Giá (1–4) | `2` |
| Đánh giá (0–5) | `4.5` |
| Website | `https://quanchaybinhan.vn` |
| Mở cửa | `08:00` |
| Đóng cửa | `21:30` |

Ràng buộc: tên/địa chỉ ≤ **255**, điện thoại ≤ **20**, vĩ độ ±90, kinh độ ±180, rating `0–5`, giá là số nguyên `1–4`, **giờ mở phải < giờ đóng**. Website phải là URL hợp lệ.

> Tạo xong quay lại `/nearby` chọn đúng quận để thấy quán mới trên bản đồ.

### 8.9 Dashboard (`/admin/dashboard`)

**Số liệu còn là mock** (`src/features/admin/dashboardApi.ts` derive từ `categoriesSeed`). Backend **đã có** `GET /api/admin/dashboard` (verify live 2026-11-06, xem `DOCS/API-COVERAGE.md` §27) với `DashboardResponse` khớp shape 1:1 — chỉ còn thiếu bước nối hook. Nói đúng như vậy khi demo: "endpoint đã có, FE chưa nối".

---

## 9. Các luồng phụ nên demo

| Luồng | Đường dẫn | Dữ liệu / thao tác |
|---|---|---|
| Tổng quan tài khoản | `/account` | Thẻ thống kê (published / draft / recipes), task "Cần bạn", lưới `x / 21` ô, chip dị ứng màu đỏ |
| Công thức của tôi | `/recipes` | `PillTabs` All / Approved / Pending / Rejected, tìm theo tên **hoặc tên nguyên liệu**, lọc độ khó, sort |
| Thực đơn | `/meal-plan` | `PillTabs` theo `?status=`, nút đổi trạng thái trên `MenuCard` |
| Bài của tôi | `/my-posts` | `PillTabs` All / Published / Draft / Unpublished, **chỉ Sửa + Xoá** |
| Đổi ngôn ngữ | navbar | EN ↔ VI — cả 14 namespace đều có đủ 2 locale |
| Trang chi tiết bài | `/posts/:id` | Nội dung, công thức đính kèm, bài liên quan, comment |
| Khám phá bộ lọc | `/explore` | Tab All/Recipe/Blog, checkbox category có số đếm, Format, Reading time, sort Popular/Recent |

---

## 10. Unhappy case — dữ liệu để demo lỗi

Mỗi case ghi rõ: **nhập gì** → **ai chặn** → **thấy gì trên màn hình**.
`FE` = chặn ngay dưới ô, **không gửi request**. `BE` = request đi rồi bị từ chối, FE hiện message backend.

### 10.1 Đăng ký & đăng nhập

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Display name `A` | FE | `Tên hiển thị phải có ít nhất 2 ký tự` — lỗi dưới ô, không gửi |
| Email `demo.vegalife` (thiếu `@`) | FE | `Email không hợp lệ (ví dụ: user@example.com)` |
| Password `Vegalife2026` (thiếu ký tự đặc biệt) | FE | `Mật khẩu phải có ít nhất 1 ký tự đặc biệt` |
| Password `Vegalife@` (thiếu số) | FE | `Mật khẩu phải có ít nhất 1 số` |
| Confirm `Vegalife@2027` (khác ô trên) | FE | `Mật khẩu xác nhận không khớp` |
| Đăng ký lại **email đã tồn tại** `demo.vegalife@gmail.com` | BE | 409 → toast/hộp lỗi message backend. Đây là case **duplicate** của ADR-019 |
| Login identifier `Minh Chay` (display name có dấu cách) | BE | FE **không** chặn (chỉ bắt định dạng khi có `@`) → BE trả **400** `Invalid email or password`. Chứng minh display name không phải danh tính (ADR-019) |
| Login đúng email + sai mật khẩu | BE | **400** `Invalid email or password`. **Không** phải 401 → không kích hoạt refresh, không logout |
| Đăng nhập tài khoản bị admin `suspend` | BE | Theo `API-COVERAGE.md` §2: lỗi business của `/auth/login` trả **400** (SRS ghi ERR-030/031 = 403 — tài liệu lệch nhau, tin bản verify live). Ở lại `/login`, hiện message backend |
| OTP `12345` (5 số) | FE | `OTP phải là 6 chữ số` |
| OTP `123456` nhưng đã hết hạn / sai | BE | Message lỗi từ backend, ở lại bước OTP |
| Mật khẩu mới trùng mật khẩu cũ | BE | Message backend (không phải kiểm của FE) |

### 10.2 Hồ sơ

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Chiều cao `0` hoặc `500` | FE | `Chiều cao phải từ 0 đến 300 cm` |
| Cân nặng `0` hoặc `600` | FE | `Cân nặng phải từ 0 đến 500 kg` |
| Tuổi `0` hoặc `200` | FE | `Tuổi phải từ 1 đến 150` |
| Giới thiệu dán > 2000 ký tự | FE | `Giới thiệu tối đa 2000 ký tự` |
| Một chip dị ứng dài 120 ký tự | FE | `Mỗi mục tối đa 100 ký tự.` (max interpolate từ `MAX_DIETARY_ITEM_LENGTH`) |
| Thêm chip thứ 51 vào một nhóm | FE | `Chỉ thêm được tối đa 50 mục.` |
| Thêm lại chip đã có | FE | `Mục này đã có trong danh sách.` |
| Bấm Enter vào chip rỗng | FE | Bỏ qua, không thêm |

> ⚠️ **Đừng demo "mục tiêu sức khoẻ quá 200 ký tự" như lỗi.** `MAX_HEALTH_GOAL_LENGTH` chỉ hiện ở bộ đếm `x / 200`; không có rule Yup nào chặn — gõ dài vẫn lưu được.
>
> Câu chữ lỗi khoảng không khớp luật thật: schema là `min(0.01)` nhưng message in ra `phải từ 0 đến 300 cm`. Nhập `0` vẫn bị chặn; nhập `0.005` cũng bị chặn mà message vẫn nói "từ 0". Đừng hứa con số chính xác khi khán giả soi.
>
> Chip rỗng / chip chỉ có khoảng trắng: form **không thêm** — không có thông báo, đây là im lặng có chủ ý.

### 10.3 Công thức

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Đơn vị `củ` | FE | `Đơn vị chỉ nhận g / ml / piece` — chặn tại ô unit |
| Đơn vị `kg` | FE | Như trên. Nếu FE bị bypass → **BE trả 400** |
| Số lượng `0` | FE | `Số lượng phải lớn hơn 0 và tối đa 3 chữ số thập phân` |
| Số lượng `1/2` | FE | Cùng message trên — chỉ nhận số thập phân |
| Số lượng `1.2345` (4 chữ số thập phân) | FE | Cùng message trên — backend chỉ cho `fraction = 3` |
| Hai nguyên liệu cùng tên `Nấm hương` | FE | Hàng thứ 2 tô đỏ `Mỗi nguyên liệu chỉ được xuất hiện một lần` — chặn gửi |
| Không có nguyên liệu nào | FE | `Cần ít nhất một nguyên liệu` |
| Thêm 51 nguyên liệu | FE | `Một công thức tối đa 50 nguyên liệu` |
| Khẩu phần `0` hoặc `2.5` | FE | `Khẩu phần phải là số nguyên từ 1 trở lên` |
| Bước nấu có tiêu đề nhưng thân rỗng | FE | `Nhập nội dung cho bước này, hoặc xoá tiêu đề đi` |
| Số phút nấu `2.5` hoặc `-1` | FE | `Nhập số phút nguyên (từ 0 trở lên)` |
| Xoá hết bước nấu | FE | Rail **Danh sách kiểm** tụt %, dòng *Các bước nấu* thành `Còn thiếu`. Bấm Create thì Yup chặn (`Vui lòng nhập trường này`) — nút không bị disable, chỉ không gửi |
| Tên công thức > 255 ký tự | FE | `Tối đa 255 ký tự` |
| Tên nguyên liệu > 100 ký tự | FE | `Tối đa 100 ký tự` |

### 10.4 Thực đơn tuần

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Chỉ chọn 4 món khác nhau, rải kín tuần | FE | Rail phải đếm `4 / 5` đỏ, nút **Lưu khoá**, dòng `Thực đơn cần ít nhất 5 món khác nhau (hiện có 4).` |
| Chọn 1 món 4 lần (cùng 5 món khác vẫn đủ) | FE | `Phở chay xuất hiện quá 3 lần trong tuần này.` — **ưu tiên báo trước** lỗi thiếu món |
| Để trống cả 1 ngày (6 ngày còn lại đủ) | FE | Dòng đỏ dưới ngày đó `Thêm ít nhất một bữa cho ngày này.` |
| Chưa chọn món nào | FE | **Không** hiện 7 dòng đỏ — cờ `showEmptyError={usage.size > 0}` chỉ bật sau khi đã chọn ≥ 1 món |
| Ghi chú 501 ký tự | FE | `Ghi chú dài quá 500 ký tự.` |
| Tìm món vừa tạo (chưa duyệt) trong ô **Tìm món** | BE | Không xuất hiện — `GET /api/dishes` chỉ trả món `moderation_status = APPROVED`. Demo: tạo recipe → chưa duyệt → picker không thấy |
| Chọn món rồi **huỷ chọn** | FE | Ô trở về trống, món đó không bị tính vào số lần lặp |
| Bấm **Lên lịch** cho tuần đã có menu `scheduled` | BE | **409** `MenuOverlapException` — toast hiện nguyên văn message backend. (Tạo menu `drafted` cùng tuần thì **không** lỗi) |
| Muốn đưa `scheduled` → `drafted` | FE | **Không có nút lùi** — bảng `NEXT_ACTIONS` chỉ có `scheduled → completed\|cancelled`. Nói rõ khi demo |
| Bấm đổi trạng thái menu đã `cancelled` / `completed` | FE | Không có nút nào để bấm (không render rồi disable) |

> Case hay bị hỏi: **"xoá menu được không?"** → Không. Không có endpoint delete. `cancelled` là đường duy nhất.

### 10.5 Bài viết (composer)

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Publish khi **chưa chọn danh mục** | FE | `Vui lòng nhập trường này` dưới ô danh mục, không gửi request |
| Publish khi **nội dung rỗng** | FE | `Vui lòng nhập trường này` dưới editor, không gửi request |
| Tiêu đề 91 ký tự | FE | `Tối đa 90 ký tự` |
| Tóm tắt 181 ký tự | FE | `maxLength={180}` cắt tại 180, bộ đếm `180 / 180` — không phải lỗi đỏ |
| Tải ảnh `.pdf` lên ô ảnh bìa | FE | Toast `Vui lòng chọn file ảnh` |
| Tải ảnh 6 MB | FE | Toast `Ảnh không được vượt quá 5MB` |
| Tải ảnh bìa khi **mất mạng** giữa luồng upload | FE | Toast `Tải ảnh thất bại`, ô ảnh vẫn trống |
| Đóng dialog khi có thay đổi chưa lưu | FE | ConfirmDialog `Bỏ bài viết này?` — bấm ngoài / Esc / X đều hỏi |
| Save draft không nhập gì | FE | **Được** — draft không có điều kiện |
| Sửa bài rồi Publish khi thiếu danh mục | FE | Như trên, chặn tại form |
| Mở `/posts/00000000-0000-0000-0000-000000000000` | BE | 404 → `Không tìm thấy bài viết` / `Bài viết không tồn tại hoặc đã ngừng đăng.` + nút `Về trang Khám phá` |

### 10.6 Bình luận & vote

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Gửi comment rỗng / chỉ khoảng trắng | FE | Nút **Gửi bị khoá** (`draft.trim().length === 0`) |
| Comment 1001 ký tự | FE | `maxLength` cắt tại 1000 — không gõ thêm được |
| Sửa comment thành chuỗi rỗng | FE | Nút lưu khoá |
| Vote khi chưa đăng nhập | FE | Toast `Đăng nhập để bình chọn bài viết`, số vote không đổi (không gửi request) |
| Vote lần 2 cùng bài | BE | `PUT` lại **cùng** `voteType` → BE toggle **bỏ vote**, số giảm 1 (optimistic, rollback nếu lỗi). Không phải 409 — SRS ERR-006 "Already voted" là mô tả cũ, đối chiếu `api.ts` + `API-COVERAGE.md` §13 |
| Đổi `UPVOTE` → `DOWNVOTE` | BE | Vote cũ bị thay, không cộng dồn 2 phiếu |
| Báo cáo comment không nhập lý do | FE | Được — lý do **optional**, gửi với `reason: undefined` |
| Lý do báo cáo 501 ký tự | FE | `maxLength={500}` cắt tại 500, không gõ thêm |
| Xoá comment **có** reply | — | Nội dung thành `[deleted]`, tác giả thành `[đã xoá]`, **nhánh reply giữ nguyên** |
| Xoá comment **không** có reply | — | Biến mất hoàn toàn khỏi danh sách, không để lại xác |
| Mở comment dialog khi chưa đăng nhập | FE | Danh sách đọc được, ô nhập thay bằng link `Đăng nhập để tham gia thảo luận` |

### 10.7 Admin — kiểm duyệt & quản trị

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| **Reject recipe** không nhập lý do | FE | `Vui lòng nhập lý do từ chối` — nút xác nhận khoá |
| **Reject recipe** lý do 1001 ký tự | FE | `Lý do tối đa 1000 ký tự` |
| **Reject recipe** bấm xác nhận | FE | Dialog cảnh báo `Từ chối là vĩnh viễn — tên công thức không thể dùng lại.` |
| **Moderate comment** không nhập lý do | FE | `Vui lòng nhập lý do kiểm duyệt` (**bắt buộc**, khác report của member) |
| **Moderate comment** lý do 1001 ký tự | FE | `Lý do tối đa 1000 ký tự` |
| Approve recipe đã `APPROVED` | BE | Idempotent — không lỗi, chỉ toast thành công |
| Tạo nguyên liệu điền **4/5** ô dinh dưỡng | FE | `Điền đủ 5 giá trị dinh dưỡng hoặc để trống hết.` |
| Tạo nguyên liệu điền đủ 5 ô nhưng **bỏ trống đơn vị** | FE | `Có dinh dưỡng thì phải có đơn vị.` |
| Nhập calories `-5` | FE | `Giá trị dinh dưỡng phải là số lớn hơn hoặc bằng 0.` |
| Tạo danh mục chỉ có khoảng trắng | FE | Chuỗi `trim()` → rỗng → `Vui lòng nhập trường này` |
| Danh mục tên 101 ký tự | FE | `Tối đa 100 ký tự` |
| Danh mục mô tả 501 ký tự | FE | `Tối đa 500 ký tự` |
| Retire danh mục đang được bài dùng | BE | Thành công — nhưng bài vẫn giữ `categoryId`; tên tra ra rỗng. **Không có restore** |
| Tạo địa điểm có giờ mở `22:00`, đóng `08:00` | FE | `Giờ đóng cửa phải sau giờ mở cửa` |
| Địa điểm chỉ nhập giờ mở, bỏ trống giờ đóng | FE | `Hãy nhập cả giờ mở cửa và giờ đóng cửa` |
| Địa điểm vĩ độ `100` | FE | `Vĩ độ phải từ -90 đến 90` |
| Địa điểm kinh độ `200` | FE | `Kinh độ phải từ -180 đến 180` |
| Địa điểm giá `5` | FE | `Mức giá phải từ 1 đến 4` |
| Địa điểm rating `6` | FE | `Đánh giá phải từ 0 đến 5` |
| Địa điểm website `abc` | FE | `Nhập địa chỉ website hợp lệ` |
| Địa điểm điện thoại 21 ký tự | FE | `Tối đa 20 ký tự` |
| Khoá user đang đăng nhập ở tab khác | BE | Request tiếp theo của user đó bị 401/403 → bị đẩy về `/login` |
| Xoá bài đã publish | BE | Soft delete — biến khỏi feed, vẫn còn trong DB |

### 10.8 Gói AI & thanh toán

| Nhập gì | Ai chặn | Kết quả |
|---|---|---|
| Bấm **Claim 5 free** lần 2 | BE | **409** → toast **`Bạn đã nhận gói miễn phí trước đó rồi.`** (FE xử lý riêng, không phải lỗi đỏ) |
| Hỏi AI khi còn 0 lượt | BE | **429** → banner `Bạn đang có 0 câu hỏi AI khả dụng` + 2 nút Nhận 5 câu hỏi miễn phí / Mua gói câu hỏi |
| Gửi tin nhắn 4001 ký tự | FE | `maxLength` cắt tại 4000 (bộ đếm `4000/4000`), không gõ thêm |
| Bấm Gửi khi ô trống | FE | Nút **khoá** (`!draft.trim()`) |
| AI trả lỗi giữa chừng | BE | `Trợ lý hiện không khả dụng. Vui lòng thử lại.` + câu hỏi **được giữ lại** + nút `Thử lại` — không tự bịa câu trả lời |
| Hết lượt giữa phiên | BE | Inline trong khung chat: `Bạn đã hết lượt hỏi AI. Vui lòng nhận gói miễn phí hoặc mua thêm gói để tiếp tục.` |
| Thanh toán VNPay rồi **huỷ** ở cổng | — | Về `/payment/result/{id}`, `status` khác `pending` → hiện `Thanh toán thất bại` / `Giao dịch không thành công. Bạn có thể thử lại.`, dừng poll |
| Thanh toán xong nhưng backend chưa nhận IPN | — | Trang kết quả **poll 3 s/lần**, còn `pending` → `Đang xác nhận thanh toán` / `Vui lòng chờ trong giây lát, trang sẽ tự cập nhật khi VNPay xử lý xong.` **Không phải lỗi FE** — IPN là nguồn sự thật |
| Mở `/payment/result/{id}` khi chưa đăng nhập | FE | `ProtectedRoute` → chuyển `/login`, đăng nhập xong quay lại đúng trang |
| Chat khi chưa đăng nhập | FE | Panel bị khoá: `Đăng nhập để hỏi trợ lý` + nút `Đăng nhập để tiếp tục` |

### 10.9 Địa điểm & trạng thái trang

| Case | Kết quả |
|---|---|
| Từ chối quyền GPS ở `/nearby` | Không sập — hiện `Bạn đã từ chối quyền vị trí. Hãy chọn một khu vực bên dưới.` và rơi về toạ độ tâm quận đang chọn |
| Chọn quận không có quán nào | `EmptyState` **`Không có địa điểm trong mục này`** + nút `Hiện tất cả địa điểm` (không phải "xoá bộ lọc") |
| Bấm **View Details** khi chưa đăng nhập | `ProtectedRoute` → `/login` kèm `state.from` → đăng nhập xong quay lại đúng `/nearby/:id` |
| Bản đồ không tải được tile OSM | Tự chuyển nguồn tile Esri; cả 2 hỏng thì hiện `Không tải được nền bản đồ. Danh sách địa điểm vẫn hiển thị bên cạnh; …` |
| Backend Render đang ngủ (cold start) | Skeleton quá lâu → `ErrorState`: `Đã có lỗi xảy ra` / `Không thể tải nội dung. Vui lòng kiểm tra kết nối và thử lại.` + nút `Thử lại`. Đánh thức `/api/health` trước khi demo |
| Mất mạng giữa trang | Cùng `ErrorState` trên, không màn hình trắng |
| Truy cập `/admin/*` bằng tài khoản USER | `AdminRoute` chặn → `Navigate to="/"` (về Home, **không** hiện thông báo) |
| Truy cập `/my-posts`, `/recipes`, `/meal-plan` khi chưa đăng nhập | `ProtectedRoute` → `/login` |
| Đã đăng nhập rồi mở `/login` | `PublicRoute` → admin về `/admin/dashboard`, user về `/` |

### 10.10 Bảng chọn nhanh — case đáng demo nhất

Chỉ chọn **3–4 case**, đừng dàn trải. Ưu tiên case chứng minh hệ thống chặn ở **đúng tầng**:

| Case | Chứng minh điều gì |
|---|---|
| Login bằng display name → 400 | Email là danh tính duy nhất (ADR-019), không phải mặc định ngây thơ |
| Đơn vị nguyên liệu `củ` → chặn tại ô | Enum thật của backend, không phải validate trang trí |
| Chọn 4 món → nút Lưu khoá | Luật nghiệp vụ (BR-MENU-005) chạy ở client **và** server |
| Publish thiếu danh mục → chặn tại form | Điều kiện publish được kiểm trước khi gọi API |
| Claim free lần 2 → 409 xử lý riêng | Phân biệt được lỗi nghiệp vụ với lỗi hệ thống |
| Hết lượt AI → 429 + banner | Quota là dữ liệu thật từ server, không hard-code |
| Chọn món chưa duyệt ở **Tìm món** → không có trong danh sách | `GET /api/dishes` lọc `APPROVED` ở server, không phải ẩn ở UI |

---

## 11. Checklist trước khi demo

- [ ] Tài khoản demo đã `activated` và **đăng nhập được bằng email** (không phải display name)
- [ ] Đã lưu Hồ sơ → rail `/account` hiện đúng tên + avatar + 3 số đếm
- [ ] Có ít nhất **1 công thức `PENDING`** (demo badge chờ duyệt + mục "Cần bạn" ở `/account`)
- [ ] Có ít nhất **1 công thức `APPROVED`** để gắn vào bài viết
- [ ] Có **1 bài `published`** + **1 bài `created`** (demo 2 badge trạng thái)
- [ ] Có **1 thực đơn `drafted`** trong tuần hiện tại (demo thanh "x / 21 ô")
- [ ] Đã đăng nhập **tài khoản ADMIN** ở tab khác nếu demo `/admin`
- [ ] Đã **claim gói FREE** ở `/ai-nutrition` (5 lượt) — không thì flow AI đứng ở banner 0
- [ ] Trình duyệt đã **cho phép vị trí**, hoặc nhớ chọn quận từ dropdown ở `/nearby`
- [ ] Backend đang thức (Render free tier ngủ sau 15 phút — mở `/api/health` trước 1 phút)
- [ ] Đã chọn đủ **≥ 5 món khác nhau** trong form thực đơn (mục 4 — thực tế dùng **7 món**)
- [ ] Mọi đơn vị nguyên liệu đã là **`g` / `ml` / `piece`** (mục 3) — đây là chỗ dễ 400 nhất
