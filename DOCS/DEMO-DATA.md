# VEGALIFE — Bộ dữ liệu demo

Copy-paste trực tiếp vào form khi demo toàn dự án. Không mock gì — mọi thứ dưới đây là dữ liệu bạn tự nhập vào app thật.

Thứ tự demo gợi ý: **Đăng ký → Hồ sơ → Công thức → Thực đơn tuần → Bài viết → Bình luận → Gói AI**.

---

## 1. Đăng ký (`/register`)

| Ô | Giá trị |
|---|---|
| Username | `demo.vegalife` |
| Email | `demo.vegalife@gmail.com` |
| Password | `Vegalife@2026` |
| Confirm password | `Vegalife@2026` |

> Sau khi đăng ký phải xác thực email. Nếu không có hộp thư, dùng tài khoản đã `activated` sẵn để demo.
> Đăng nhập (`/login`) nhận cả username lẫn email ở ô **identifier**.

Tài khoản admin cần cho phần `/admin` — dùng tài khoản seed của backend, không tạo được từ UI.

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

**Sở thích ăn** (gõ từng cái rồi Enter):
```
cay
nhiều rau lá
đậu hũ
nấm
cơm gạo lứt
```

**Không thích**:
```
ngò rí
mướp đắng
```

**Dị ứng** (sẽ hiện cảnh báo đỏ ở trang Tổng quan):
```
đậu phộng
đậu nành
```

**Kiêng cữ**:
```
không đường thêm
không chiên dầu
```

> Mỗi danh sách tối đa 50 mục, mỗi mục ≤ 100 ký tự. Mục tiêu sức khoẻ ≤ 200 ký tự.
> BMI sẽ tự tính từ chiều cao + cân nặng (165/61 → ~22.4).

---

## 3. Công thức (`/recipes/create`)

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
| Cà rốt | 1 | củ |
| Đu đủ xanh | 200 | g |
| Nước tương | 3 | thìa |
| Đường thốt nốt | 1 | thìa |
| Giấm gạo | 2 | thìa |
| Rau sống | 1 | bó |

**Các bước nấu**

| Tiêu đề | Thân |
|---|---|
| Sơ chế nấm | `Nấm hương ngâm nước ấm 20 phút, cắt chân. Nấm bào ngư xé miếng vừa ăn, rửa sạch rồi vắt ráo.` |
| Ướp và nướng | `Trộn nấm với 2 thìa nước tương, 1 thìa đường thốt nốt và chút tiêu. Ướp 15 phút rồi nướng 200°C trong 12 phút, trở mặt giữa chừng.` |
| Làm nước chấm | `Pha 1 thìa nước tương còn lại với giấm gạo, đường và 4 thìa nước lọc. Thêm đu đủ xanh và cà rốt bào sợi.` |
| Trình bày | `Xếp bún ra bát, đặt nấm nướng lên trên, chan nước chấm và ăn kèm rau sống.` |

**Dinh dưỡng** (tuỳ chọn — bỏ trống cũng gửi được)
```
Calories 420 · Protein 22 · Carbs 58 · Fat 12 · Fiber 7
```

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

**Nguyên liệu**: `Cà chua 2 quả` · `Dứa 200 g` · `Giá đỗ 150 g` · `Đậu bắp 100 g` · `Me chua 2 thìa` · `Rau ngổ 1 bó` · `Nước tương 2 thìa`

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

**Nguyên liệu**: `Cà rốt 1 củ` · `Su hào 150 g` · `Dưa leo 1 quả` · `Bắp cải tím 100 g` · `Mè rang 2 thìa` · `Nước tương 2 thìa` · `Chanh 1 quả` · `Rau thơm 1 bó`

**Các bước nấu**

| Tiêu đề | Thân |
|---|---|
| Thái rau | `Cà rốt, su hào, dưa leo, bắp cải thái sợi mỏng. Ngâm nước đá 10 phút cho giòn rồi vắt ráo.` |
| Làm sốt | `Trộn nước tương, nước cốt chanh, đường và mè rang. Khuấy đều.` |
| Trộn | `Trộn rau với sốt, để 5 phút cho thấm rồi rắc rau thơm.` |

> **Luật khi tạo**: tên ≤ 255 ký tự, tên nguyên liệu ≤ 100, đơn vị ≤ 30, tối đa 50 nguyên liệu.
> Công thức mới tạo luôn ở trạng thái `PENDING` — phải vào `/admin/recipes` duyệt mới hiện công khai.

---

## 4. Thực đơn tuần (`/meal-plan/create`)

Món phải chọn từ ô tìm kiếm trong form (gọi `GET /api/dishes`) — không gõ tay được.

> **Để trống tên món, tự chọn trong picker khi demo.** Bảng dưới chỉ cố định **cấu trúc ô** và
> **số khẩu phần**; A→G là chỗ bạn gán 7 món thật. Số trong ngoặc là khẩu phần.
>
> **Cần 7 món khác nhau, không phải 5.** 19 ô, mỗi món tối đa 3 lần → 5 món không bao giờ đủ.

| Ngày | Sáng | Trưa | Tối |
|---|---|---|---|
| Thứ 2 | A (1) | B (2) | C (3) |
| Thứ 3 | D (2) | E (2) | F (1) |
| Thứ 4 | G (2) | A (1) | B (2) |
| Thứ 5 | C (3) | D (2) | E (3) |
| Thứ 6 | F (3) | G (2) | A (1) |
| Thứ 7 | B (2) | C (3) | — |
| Chủ nhật | D (3) | E (1) | — |

Số lần lặp mỗi món: A 3 · B 3 · C 3 · D 3 · E 3 · F 2 · G 2.

**Ghi chú tuần** (≤ 500 ký tự)
```
Tuần ăn chay nhẹ, ưu tiên món canh và rau luộc. Thứ 6 nấu nhiều hơn để phần bữa trưa thứ 7.
```

> Sai luật là **400 cả tuần**, không lưu gì. Thực đơn tạo ra ở trạng thái `drafted`; nút trên thẻ menu để đổi sang `active`/`cancelled`. Không có endpoint xoá.

---

## 5. Bài viết (`/posts/create`)

**Danh mục có thật trong DB** (`GET /api/categories`, đọc 2026-11-02):
`Fruits` · `Mushrooms` · `Salads` · `Soups` · `Vegetables`

Dùng `Soups` cho bài 5.1 (nước dùng), `Vegetables` cho 5.2 (đậu hũ), `Vegetables` cho 5.3 (đạm thực vật).
Bỏ qua `test categories 1` — là category rác do seed.

### 5.1 Bài thường — đã đăng

| Ô | Giá trị |
|---|---|
| Tiêu đề | `Nước dùng chay trong 4 giờ: rang gừng trước khi ninh` |
| Danh mục | `Soups` |
| Ảnh bìa | để trống |

**Nội dung**

```
Một nồi nước dùng chay ngon không cần hạt nêm. Ba nguyên tắc mình giữ suốt bốn năm nấu chay:

1. Rang gừng và hành tím trước khi ninh. Vỏ gừng giữ lại, đập dập, rang khô trên chảo đến khi thơm rồi mới cho vào nồi.
2. Nấm hương khô là nguồn umami chính. Ngâm nước ấm 20 phút, giữ lại nước ngâm, lọc qua rây rồi đổ vào nồi.
3. Ninh ở lửa nhỏ nhất, không đậy kín. Đậy kín làm nước đục.

Thêm một củ cải trắng và một quả lê chín để nước có vị ngọt hậu. Bỏ mặn hoàn toàn — vị mặn đến từ 2 thìa nước tương thêm vào 5 phút cuối.

Nước dùng dùng được cho phở, bún, hoặc nấu canh. Để nguội rồi chia hộp đông lạnh, giữ được một tháng.
```
*(~175 từ, ~1 phút đọc)*

Sau khi lưu → vào `/my-posts` → Đăng bài.

### 5.2 Bài video — bản nháp

| Ô | Giá trị |
|---|---|
| Loại nội dung | `Video` |
| Tiêu đề | `3 phút sơ chế đậu hũ non không bị nát` |
| Danh mục | `Vegetables` |

**Nội dung**

```
Đậu hũ non rất dễ nát khi chiên. Cách mình làm:

Chần nguyên miếng đậu trong nước muối loãng 80°C khoảng 2 phút. Muối làm protein se lại, miếng đậu chắc hơn mà vẫn mềm bên trong.

Vớt ra, để thật ráo trên khăn giấy. Nếu còn nước, dầu sẽ bắn và vỏ không vàng đều.

Chiên ngập dầu ở 170°C. Không lật sớm — chờ mặt dưới vàng đều rồi mới trở.

Để ráo dầu trên giá, không để trên giấy, hơi nước sẽ làm vỏ mềm lại.
```
*(~90 từ)*

Để ở trạng thái **nháp** (chưa đăng) — dùng để demo luồng sửa bài trong `/my-posts`.

### 5.3 Bài dài — kiểm tra thời gian đọc

| Ô | Giá trị |
|---|---|
| Tiêu đề | `Ăn chay đủ đạm: bảng quy đổi mình dùng hằng tuần` |
| Danh mục | `Vegetables` |

**Nội dung** — dán nguyên khối, mục đích là đẩy `estimateReadMinutes` lên ≥ 10 phút:

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

### 5.4 Bình luận (dán vào `/posts/{id}` sau khi đăng bài 5.1)

```
Cảm ơn bạn. Phần rang gừng mình chưa thử bao giờ, để cuối tuần làm theo. Bạn có lọc nước ngâm nấm qua rây không hay để nguyên?
```

---

## 6. Gói AI + thanh toán (`/account/subscription`)

- Bấm **Mua** ở gói trả phí → chuyển sang cổng VNPay.
- Thẻ test VNPay (sandbox): `9704198526191432198` · tên `NGUYEN VAN A` · phát hành `07/15` · OTP `123456`.
- Sau khi thanh toán, VNPay redirect về `/payment/result/{paymentId}` và trang poll 3 giây/lần.
- **IPN là nguồn sự thật** — nếu trang kết quả còn `pending` quá lâu thì backend chưa nhận IPN, không phải lỗi FE.

---

## 7. Tìm địa điểm (`/nearby`)

Trình duyệt sẽ hỏi quyền vị trí. Chọn **Cho phép**. Nếu từ chối, trang không có dữ liệu để hiển thị.

Toạ độ dùng để test nếu cần giả lập trong DevTools:
```
10.7769, 106.7009   (Quận 1, TP.HCM)
```

---

## 8. Checklist trước khi demo

- [ ] Tài khoản đã `activated` (đăng nhập được)
- [ ] Đã lưu Hồ sơ → rail hiện đúng tên + avatar + số đếm
- [ ] Có ít nhất 1 công thức `PENDING` (demo badge chờ duyệt + mục "Cần bạn" ở Tổng quan)
- [ ] Có ít nhất 1 bài `published` + 1 bài `created` (demo 2 badge trạng thái)
- [ ] Có 1 thực đơn `drafted` trong tuần hiện tại (demo thanh "x / 21 ô")
- [ ] Đã đăng nhập bằng tài khoản ADMIN ở tab khác nếu cần demo `/admin`
- [ ] Backend đang thức (Render free tier ngủ sau 15 phút — mở `/api/health` trước 1 phút)
- [ ] Đã chọn đủ **5 món khác nhau** trong form thực đơn (mục 4)
