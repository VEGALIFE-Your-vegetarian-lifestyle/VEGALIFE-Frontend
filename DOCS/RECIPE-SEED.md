# 10 công thức chay để seed hệ thống

> Tạo bằng `POST /api/recipes` (cần JWT, mỗi công thức một request). Server tự
> find-or-create `dishName` và từng tên nguyên liệu theo chữ thường.
> Ngày lập: 2026-10-26

## 1. Bảng tóm tắt

| # | `name` | `dishName` | Servings | Prep | Cook | Difficulty |
|---|---|---|---|---|---|---|
| 1 | Phở chay | phở chay | 2 | 25 | 90 | MEDIUM |
| 2 | Bún chả chay | bún chả chay | 2 | 30 | 25 | MEDIUM |
| 3 | Bánh mì chay | bánh mì chay | 1 | 15 | 10 | EASY |
| 4 | Cơm tấm chay | cơm tấm chay | 2 | 25 | 35 | MEDIUM |
| 5 | Gỏi cuốn chay | gỏi cuốn chay | 2 | 30 | 0 | EASY |
| 6 | Bún bò Huế chay | bún bò huế chay | 2 | 25 | 60 | HARD |
| 7 | Cao lầu chay | cao lầu chay | 2 | 40 | 40 | HARD |
| 8 | Chả giò chay | chả giò chay | 4 | 35 | 20 | MEDIUM |
| 9 | Canh chua chay | canh chua chay | 2 | 15 | 20 | EASY |
| 10 | Bánh xèo chay | bánh xèo chay | 2 | 20 | 25 | MEDIUM |

## 2. Payload

### 1. Phở chay

```json
{
  "name": "Phở chay",
  "dishName": "phở chay",
  "description": "Nước dùng hầm từ củ cải, hành tây và nấm hương, bánh phở mềm, ăn kèm đậu hũ chiên và rau thơm.",
  "instructions": "1. Nướng hành tây và gừng trên lửa cho thơm, cạo sạch vỏ cháy.\n2. Hầm củ cải, hành tây, gừng, quế, hồi với 2 lít nước trong 60 phút, nêm muối và nước tương.\n3. Chiên đậu hũ vàng đều, cắt miếng vừa ăn. Ngâm nấm hương mềm rồi thái lát.\n4. Trụng bánh phở qua nước sôi, xếp ra tô.\n5. Chan nước dùng nóng, thêm đậu hũ, nấm và rau thơm.",
  "servings": 2,
  "prepTimeMinutes": 25,
  "cookTimeMinutes": 90,
  "difficulty": "MEDIUM",
  "ingredients": [
    { "name": "bánh phở", "amount": 400, "unit": "g" },
    { "name": "đậu hũ", "amount": 200, "unit": "g" },
    { "name": "nấm hương", "amount": 100, "unit": "g" },
    { "name": "củ cải trắng", "amount": 200, "unit": "g" },
    { "name": "hành tây", "amount": 1, "unit": "củ" },
    { "name": "gừng", "amount": 30, "unit": "g" },
    { "name": "quế", "amount": 2, "unit": "thanh" },
    { "name": "hồi", "amount": 3, "unit": "cái" },
    { "name": "nước tương", "amount": 3, "unit": "tbsp" },
    { "name": "rau thơm", "amount": 50, "unit": "g" }
  ]
}
```

### 2. Bún chả chay

```json
{
  "name": "Bún chả chay",
  "dishName": "bún chả chay",
  "description": "Chả nấm và đậu hũ nướng than, chan nước mắm chay chua ngọt, ăn cùng bún và rau sống.",
  "instructions": "1. Băm nhuyễn nấm rơm, trộn với đậu hũ nghiền, bột năng, tiêu và nước tương, vo thành viên dẹt.\n2. Nướng chả trên vỉ hoặc áp chảo đến khi vàng hai mặt.\n3. Pha nước chấm: nước tương, đường, nước cốt chanh, tỏi ớt băm và đu đủ xanh bào.\n4. Trụng bún, xếp rau sống và chả ra đĩa.\n5. Chan nước chấm lên chả trước khi ăn.",
  "servings": 2,
  "prepTimeMinutes": 30,
  "cookTimeMinutes": 25,
  "difficulty": "MEDIUM",
  "ingredients": [
    { "name": "bún", "amount": 300, "unit": "g" },
    { "name": "đậu hũ", "amount": 200, "unit": "g" },
    { "name": "nấm rơm", "amount": 150, "unit": "g" },
    { "name": "bột năng", "amount": 2, "unit": "tbsp" },
    { "name": "cà rốt", "amount": 1, "unit": "củ" },
    { "name": "đu đủ xanh", "amount": 100, "unit": "g" },
    { "name": "nước tương", "amount": 4, "unit": "tbsp" },
    { "name": "đường", "amount": 2, "unit": "tbsp" },
    { "name": "nước cốt chanh", "amount": 2, "unit": "tbsp" },
    { "name": "rau sống", "amount": 100, "unit": "g" }
  ]
}
```

### 3. Bánh mì chay

```json
{
  "name": "Bánh mì chay",
  "dishName": "bánh mì chay",
  "description": "Bánh mì giòn kẹp đậu hũ sốt sả, đồ chua, dưa leo, ngò và tương ớt chay.",
  "instructions": "1. Cắt đậu hũ thành miếng dày 1cm, chiên vàng.\n2. Phi thơm sả băm, cho đậu hũ vào xóc với nước tương và chút đường đến khi sệt lại.\n3. Nướng bánh mì cho giòn, rạch dọc thân.\n4. Phết tương ớt chay, xếp đậu hũ, đồ chua, dưa leo và ngò vào.\n5. Ép nhẹ và ăn ngay khi còn nóng.",
  "servings": 1,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 10,
  "difficulty": "EASY",
  "ingredients": [
    { "name": "bánh mì", "amount": 1, "unit": "ổ" },
    { "name": "đậu hũ", "amount": 150, "unit": "g" },
    { "name": "sả", "amount": 2, "unit": "cây" },
    { "name": "dưa leo", "amount": 50, "unit": "g" },
    { "name": "đồ chua", "amount": 50, "unit": "g" },
    { "name": "ngò", "amount": 10, "unit": "g" },
    { "name": "tương ớt chay", "amount": 1, "unit": "tbsp" },
    { "name": "nước tương", "amount": 1, "unit": "tbsp" }
  ]
}
```

### 4. Cơm tấm chay

```json
{
  "name": "Cơm tấm chay",
  "dishName": "cơm tấm chay",
  "description": "Cơm tấm hạt mềm ăn với sườn nấm chiên, bì chay từ bún tàu, trứng hấp nấm và nước chấm chay.",
  "instructions": "1. Vo gạo tấm, nấu với lượng nước xấp mặt.\n2. Ướp nấm với nước tương, đường, tiêu rồi chiên vàng làm sườn chay.\n3. Ngâm bún tàu mềm, xào với cà rốt bào sợi làm bì chay.\n4. Đánh trứng chay với nấm băm, hấp 15 phút rồi cắt miếng.\n5. Pha nước chấm chua ngọt, dọn cơm cùng sườn, bì, trứng và đồ chua.",
  "servings": 2,
  "prepTimeMinutes": 25,
  "cookTimeMinutes": 35,
  "difficulty": "MEDIUM",
  "ingredients": [
    { "name": "cơm tấm", "amount": 300, "unit": "g" },
    { "name": "nấm đùi gà", "amount": 200, "unit": "g" },
    { "name": "bún tàu", "amount": 50, "unit": "g" },
    { "name": "trứng chay", "amount": 2, "unit": "quả" },
    { "name": "cà rốt", "amount": 1, "unit": "củ" },
    { "name": "đồ chua", "amount": 80, "unit": "g" },
    { "name": "nước tương", "amount": 3, "unit": "tbsp" },
    { "name": "đường", "amount": 1, "unit": "tbsp" },
    { "name": "dầu ăn", "amount": 2, "unit": "tbsp" }
  ]
}
```

### 5. Gỏi cuốn chay

```json
{
  "name": "Gỏi cuốn chay",
  "dishName": "gỏi cuốn chay",
  "description": "Cuốn bánh tráng với bún, đậu hũ, rau sống và hẹ, chấm tương đậu phộng.",
  "instructions": "1. Luộc bún chín tới, xả nước lạnh và để ráo.\n2. Chiên đậu hũ vàng, cắt thanh dài.\n3. Pha tương đậu phộng: tương hột giã nhuyễn nấu với nước, đường và đậu phộng rang giã dập.\n4. Nhúng bánh tráng qua nước, trải ra thớt.\n5. Xếp rau, bún, đậu hũ và hẹ, cuốn chặt tay rồi chấm tương.",
  "servings": 2,
  "prepTimeMinutes": 30,
  "cookTimeMinutes": 0,
  "difficulty": "EASY",
  "ingredients": [
    { "name": "bánh tráng", "amount": 10, "unit": "tấm" },
    { "name": "bún", "amount": 200, "unit": "g" },
    { "name": "đậu hũ", "amount": 150, "unit": "g" },
    { "name": "rau sống", "amount": 100, "unit": "g" },
    { "name": "hẹ", "amount": 20, "unit": "g" },
    { "name": "tương hột", "amount": 3, "unit": "tbsp" },
    { "name": "đậu phộng", "amount": 30, "unit": "g" },
    { "name": "đường", "amount": 1, "unit": "tbsp" }
  ]
}
```

### 6. Bún bò Huế chay

```json
{
  "name": "Bún bò Huế chay",
  "dishName": "bún bò huế chay",
  "description": "Nước dùng sả ớt đậm vị Huế, bún sợi to, chả chay và nấm bào ngư.",
  "instructions": "1. Đập dập sả, xào với dầu và ớt bột cho dậy mùi.\n2. Hầm nấm bào ngư và củ cải với 2 lít nước trong 45 phút.\n3. Cho sả đã xào vào nồi, nêm mắm chay, muối và đường phèn.\n4. Cắt chả chay thành lát, chiên sơ cho thơm.\n5. Trụng bún, chan nước dùng, thêm chả, nấm và rau sống.",
  "servings": 2,
  "prepTimeMinutes": 25,
  "cookTimeMinutes": 60,
  "difficulty": "HARD",
  "ingredients": [
    { "name": "bún", "amount": 300, "unit": "g" },
    { "name": "nấm bào ngư", "amount": 200, "unit": "g" },
    { "name": "chả chay", "amount": 150, "unit": "g" },
    { "name": "sả", "amount": 4, "unit": "cây" },
    { "name": "ớt bột", "amount": 2, "unit": "tsp" },
    { "name": "củ cải trắng", "amount": 150, "unit": "g" },
    { "name": "mắm chay", "amount": 2, "unit": "tbsp" },
    { "name": "đường phèn", "amount": 1, "unit": "tbsp" },
    { "name": "rau sống", "amount": 100, "unit": "g" }
  ]
}
```

### 7. Cao lầu chay

```json
{
  "name": "Cao lầu chay",
  "dishName": "cao lầu chay",
  "description": "Sợi mì cao lầu dai, thịt heo quay chay từ mì căn, rau sống Trà Quế và nước sốt đậm.",
  "instructions": "1. Ướp mì căn với nước tương, đường, ngũ vị hương trong 20 phút.\n2. Chiên mì căn đến khi vàng giòn, cắt lát.\n3. Nấu nước sốt từ nước tương, đường và nước hầm nấm đến khi hơi sệt.\n4. Trụng mì cao lầu qua nước sôi, để ráo.\n5. Xếp mì, mì căn, rau sống và rắc đậu phộng rang, chan nước sốt.",
  "servings": 2,
  "prepTimeMinutes": 40,
  "cookTimeMinutes": 40,
  "difficulty": "HARD",
  "ingredients": [
    { "name": "mì cao lầu", "amount": 300, "unit": "g" },
    { "name": "mì căn", "amount": 200, "unit": "g" },
    { "name": "nấm hương", "amount": 80, "unit": "g" },
    { "name": "nước tương", "amount": 4, "unit": "tbsp" },
    { "name": "đường", "amount": 2, "unit": "tbsp" },
    { "name": "ngũ vị hương", "amount": 1, "unit": "tsp" },
    { "name": "rau sống", "amount": 100, "unit": "g" },
    { "name": "đậu phộng", "amount": 30, "unit": "g" }
  ]
}
```

### 8. Chả giò chay

```json
{
  "name": "Chả giò chay",
  "dishName": "chả giò chay",
  "description": "Chả giò cuốn bánh tráng với khoai môn, nấm mèo và bún tàu, chiên giòn, ăn kèm rau sống.",
  "instructions": "1. Hấp khoai môn 15 phút rồi nghiền sơ.\n2. Ngâm nấm mèo và bún tàu cho mềm, thái nhỏ.\n3. Trộn khoai môn, nấm mèo, bún tàu với muối, tiêu và nước tương.\n4. Cuốn hỗn hợp vào bánh tráng, gấp kín hai đầu.\n5. Chiên ngập dầu ở lửa vừa đến khi vàng giòn, vớt ra để ráo.",
  "servings": 4,
  "prepTimeMinutes": 35,
  "cookTimeMinutes": 20,
  "difficulty": "MEDIUM",
  "ingredients": [
    { "name": "bánh tráng", "amount": 15, "unit": "tấm" },
    { "name": "khoai môn", "amount": 300, "unit": "g" },
    { "name": "nấm mèo", "amount": 50, "unit": "g" },
    { "name": "bún tàu", "amount": 50, "unit": "g" },
    { "name": "cà rốt", "amount": 1, "unit": "củ" },
    { "name": "nước tương", "amount": 2, "unit": "tbsp" },
    { "name": "tiêu", "amount": 1, "unit": "tsp" },
    { "name": "dầu ăn", "amount": 500, "unit": "ml" }
  ]
}
```

### 9. Canh chua chay

```json
{
  "name": "Canh chua chay",
  "dishName": "canh chua chay",
  "description": "Canh chua dứa và cà chua nấu me, thêm đậu hũ và giá đỗ, ăn với cơm trắng.",
  "instructions": "1. Nấu 1 lít nước với me chua, lọc lấy nước cốt.\n2. Cho dứa và cà chua vào nấu 10 phút cho ra vị.\n3. Thêm đậu hũ cắt miếng và giá đỗ, nấu thêm 5 phút.\n4. Nêm đường, muối và nước tương cho vừa chua ngọt.\n5. Tắt bếp, thêm rau ngổ và ớt lát.",
  "servings": 2,
  "prepTimeMinutes": 15,
  "cookTimeMinutes": 20,
  "difficulty": "EASY",
  "ingredients": [
    { "name": "dứa", "amount": 200, "unit": "g" },
    { "name": "cà chua", "amount": 2, "unit": "quả" },
    { "name": "me", "amount": 50, "unit": "g" },
    { "name": "đậu hũ", "amount": 150, "unit": "g" },
    { "name": "giá đỗ", "amount": 100, "unit": "g" },
    { "name": "rau ngổ", "amount": 20, "unit": "g" },
    { "name": "đường", "amount": 1, "unit": "tbsp" },
    { "name": "nước tương", "amount": 1, "unit": "tbsp" }
  ]
}
```

### 10. Bánh xèo chay

```json
{
  "name": "Bánh xèo chay",
  "dishName": "bánh xèo chay",
  "description": "Bánh xèo vàng giòn từ bột gạo nghệ, nhân giá đỗ và nấm, cuốn rau sống chấm nước tương chay.",
  "instructions": "1. Trộn bột gạo, bột nghệ, nước cốt dừa, muối và nước thành hỗn hợp sền sệt, nghỉ 20 phút.\n2. Xào giá đỗ với nấm và chút nước tương làm nhân.\n3. Đun nóng chảo, quét dầu, đổ một vá bột mỏng và xoay đều.\n4. Rắc nhân lên nửa mặt bánh, đậy nắp 2 phút cho giòn.\n5. Gấp đôi bánh, cuốn với rau sống và chấm nước tương pha chanh ớt.",
  "servings": 2,
  "prepTimeMinutes": 20,
  "cookTimeMinutes": 25,
  "difficulty": "MEDIUM",
  "ingredients": [
    { "name": "bột gạo", "amount": 200, "unit": "g" },
    { "name": "bột nghệ", "amount": 1, "unit": "tsp" },
    { "name": "nước cốt dừa", "amount": 200, "unit": "ml" },
    { "name": "giá đỗ", "amount": 150, "unit": "g" },
    { "name": "nấm rơm", "amount": 100, "unit": "g" },
    { "name": "rau sống", "amount": 100, "unit": "g" },
    { "name": "nước tương", "amount": 2, "unit": "tbsp" },
    { "name": "dầu ăn", "amount": 3, "unit": "tbsp" }
  ]
}
```

## 3. Lưu ý

- **`dishName` viết thường**: server find-or-create theo tên đã trim + lowercase, nên dùng
  đúng tên thường ở bảng trên để 10 công thức dùng chung 10 dish, không sinh bản ghi trùng.
  `name` của công thức giữ chữ hoa bình thường.
- **Dish mới ở trạng thái `PENDING`**: recipe tạo bởi member không tự duyệt dish. Cần ADMIN
  duyệt (`POST /api/admin/dishes/{dishId}/approve`) thì món mới xuất hiện trong
  `GET /api/dishes` và trong card **Chọn món** ở `/ai-nutrition`.
- **Giới hạn backend**: `name`/`dishName` ≤255, `servings` ≥1, 1–50 nguyên liệu,
  `amount` >0 và tối đa 3 chữ số lẻ, `unit` ≤30, `prepTimeMinutes`/`cookTimeMinutes` ≥0.
- **Không có field ảnh**: `POST /api/recipes` không nhận ảnh bìa.
- **Trùng tên nguyên liệu**: trong một công thức mỗi tên chỉ xuất hiện một lần — payload
  trên đã đảm bảo điều này.
- Tạo qua UI `/recipes/create` cũng được: mỗi công thức điền tay theo bảng trên. Hoặc
  dùng Swagger/Postman với JWT member.
