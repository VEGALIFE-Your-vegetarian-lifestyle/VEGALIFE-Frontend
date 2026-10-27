# Plan — Meal Plan (giai đoạn C: hiển thị thực đơn tuần)

> Trạng thái: **đã code xong giai đoạn C** — `npm run typecheck` + `npm run lint` sạch, `week.test.ts` 17/17 pass · Ngày lập: 2026-10-24 · Branch: `feat/recipes`
> Endpoint: `GET /api/menus/details` (+ `GET /api/menus` cho danh sách lịch sử)
> Tài liệu backend: `VEGALIFE-backend/docs/apis/menus/*` (nhánh `dev`)

## 1. Bối cảnh

Backend **đã có toàn bộ** domain thực đơn tuần: 5 endpoint REST + 5 tool cho AI chat
(`service/ai/MenuTools.java`). Prompt của AI chat được build từ **đúng profile dietary +
BMI** (`AiChatService.appendDietaryProfile`):

```
- Allergies (hard constraint — never suggest a dish containing them): ...
- Restrictions (hard constraint ...): ...
- Dislikes (soft, avoid when possible): ...
- BMI: 21.6 (context only, not medical advice)
```

Nghĩa là user khai dietary ở `/profile` rồi hỏi chatbot *"tạo thực đơn tuần này cho tôi"*
thì backend tự sinh menu dựa trên BMI + dietary và **lưu vào DB**.

**Vấn đề**: frontend không có màn hình nào để xem lại. `ChatPanel` chỉ render text
reply — user thấy câu trả lời dạng chữ, không thấy menu đã lưu.

**Giai đoạn C này**: chỉ **đọc và hiển thị**. Việc tạo do AI chat lo.

Ba giai đoạn đã chốt:

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| **C** (plan này) | Trang `/meal-plan` đọc menu AI đã tạo | ✅ xong |
| A | Trang danh sách/lịch sử + lọc theo status, phân trang | ⬜ chưa lên plan |
| B | Form tự tạo menu (chọn món từ `GET /api/dishes`) + đổi status | ✅ xong — xem `PLAN-MEAL-PLAN-CREATE.md` |

**Ngoài phạm vi giai đoạn C**: tạo/sửa/xoá menu, đổi status (schedule/cancel/complete),
render kết quả tool trong `ChatPanel`, lịch sử phân trang, thông báo khi AI tạo menu xong.

## 2. API

### 2.1 `GET /api/menus/details` — nguồn chính

| | |
|---|---|
| Auth | JWT (bắt buộc) |
| Query | `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `menuId` (uuid) — **tất cả optional** |
| Trả về | **mảng phẳng** `MenuDetail[]`, **không phân trang** |

Hành vi cửa sổ:

- Có `menuId` → đúng menu đó, bỏ qua `from`/`to`.
- Không có `from` lẫn `to` → **tuần ISO hiện tại theo giờ server (UTC)**.
- Có một hoặc cả hai → cửa sổ giao nhau, mỗi bound áp dụng độc lập. Chênh lệch ≤366 ngày.

Menu được chọn khi `[startDate, endDate]` **giao** với cửa sổ yêu cầu, tính cả chạm mép
(BR-MENU-002). Endpoint **không** có lọc `status`.

```json
{
  "success": true,
  "message": "Meal plan retrieved successfully",
  "data": [
    {
      "id": "3f0a9d21-5f6e-4c11-9a8b-1d2e3f4a5b6c",
      "startDate": "2026-10-05",
      "endDate": "2026-10-11",
      "status": "scheduled",
      "notes": "High-protein week",
      "createdAt": "2026-10-01T09:00:00Z",
      "updatedAt": "2026-10-01T09:00:00Z",
      "days": [
        {
          "date": "2026-10-05",
          "meals": [
            {
              "mealType": "BREAKFAST",
              "servings": 2,
              "dish": {
                "id": "9b1e7c44-2d55-4f8a-9c31-77aa0c6b1e10",
                "name": "Tofu scramble",
                "description": "Crumbed firm tofu with turmeric and black salt",
                "imageUrl": "https://cdn.example.com/dishes/tofu-scramble.jpg",
                "cuisineType": "Asian"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Lưu ý quan trọng:

- `data` là **mảng**, không phải page object. Rỗng = `[]`, không phải `null`.
- `days` **chỉ chứa ngày có ít nhất 1 bữa**. Menu chưa có `menu_detail` → `days: []`.
  ⇒ UI phải render đủ 7 cột ngày, không lặp theo `days`.
- `meals` sắp theo `mealType` (BREAKFAST → LUNCH → DINNER).
- `dish.description`, `imageUrl`, `cuisineType` đều có thể `null`.
- 404 (`"Menu not found"`) khi `menuId` không tồn tại **hoặc của user khác** — cố ý
  không phân biệt (BR-MENU-001).

### 2.2 `GET /api/menus` — chỉ dùng cho badge đếm, **không** cho giai đoạn C

Phân trang, `page` **0-based** (giống `getUsers`, khác phần lớn service khác), lọc được
`status`, trả summary không có `days`. Giai đoạn C không cần → **không viết hàm này**.
Để dành cho giai đoạn A.

### 2.3 Ràng buộc backend (ghi lại để không làm UI vô nghĩa)

`POST /api/menus` (giai đoạn B): 7 ngày × 1–3 bữa, ≤1 bữa/loại/ngày, `servings ≥ 1`,
≤3 lần cùng một món, ≥5 món khác nhau. Menu sinh ra luôn `drafted`.
`PATCH` chỉ sửa được `drafted`/`scheduled`, và **không đổi được tuần**.

## 3. Quyết định

### 3.1 Chỉ một view: tuần, có nút lùi/tiến

`/meal-plan` hiển thị **một tuần** (Thứ 2 → Chủ nhật), điều hướng bằng nút ← →. Tuần
đang xem nằm trên URL: `/meal-plan?from=2026-10-05`.

Lý do: menu vốn là đơn vị tuần (`startDate` luôn là Thứ 2, `endDate = startDate + 6`),
backend không có khái niệm "tháng". Danh sách lịch sử phân trang để giai đoạn A.

### 3.2 Luôn gửi `from`/`to` tường minh

Không bao giờ gọi `GET /api/menus/details` trần. Backend mặc định tuần hiện tại **theo
giờ UTC** — người dùng Việt Nam (UTC+7) lúc 00:00–07:00 thứ Hai sẽ nhận **tuần trước**.
FE tự tính Thứ 2 theo giờ máy rồi gửi `from`/`to` → không phụ thuộc múi giờ server.

### 3.3 Render đủ 7 ngày, không lặp theo `days`

`days` bỏ trống ngày không có bữa. Lặp theo `days` sẽ ra lưới 4–5 cột, sai.
→ Tạo 7 ô từ `startDate + 0..6`, tra `days` theo `date` để lấy meals.

### 3.4 Múi giờ: parse ngày dạng local, không dùng `new Date("2026-10-05")`

`new Date("2026-10-05")` parse thành **UTC midnight** → ở UTC+7 hiển thị đúng, nhưng ở
UTC-5 hiển thị lùi 1 ngày. Dùng `new Date(y, m - 1, d)` (constructor local).

### 3.5 Không thêm dependency ngày tháng

Cần đúng 4 hàm: `toISODate`, `parseISODate`, `startOfWeek` (Thứ 2), `addDays`. ~20 dòng
thuần `Date`. `formatDateLocale` có sẵn chỉ để hiển thị, không dùng để tính.

### 3.6 Trạng thái hiển thị, không có nút đổi

`drafted` / `scheduled` / `cancelled` / `completed` → `Badge` với variant có sẵn
(`amber` / `default` / `outline` / `lightgreen`). Giai đoạn C **không** có nút schedule.

### 3.7 Empty state dẫn về AI chat

Chưa có menu tuần này → `EmptyState` với CTA "Tạo bằng trợ lý AI" → `/ai-nutrition`.
Đây là toàn bộ "cách tạo menu" ở giai đoạn C; nói rõ trong description để user không
tưởng app hỏng.

### 3.8 Không có menu nào trong tuần nhưng có menu giao mép

Backend trả menu **giao** với cửa sổ. Một menu `2026-10-05..10-11` sẽ xuất hiện khi xem
tuần `2026-10-12..10-18`? **Không** — chỉ khi giao thật. Nhưng menu `10-08..10-14` (dữ
liệu cũ, không theo tuần) sẽ xuất hiện ở **cả hai** tuần. UI hiển thị đúng `startDate`
của từng menu trong tiêu đề card để không gây nhầm.

## 4. Thiết kế

### 4.1 File

```text
src/features/menus/types.ts                    MenuStatus, MealType, Dish, Meal, MenuDay,
                                               MenuDetail, MealPlanParams
src/features/menus/api.ts                      getMealPlans({ from, to })
src/features/menus/useMealPlans.ts             useQuery bọc getMealPlans
src/features/menus/week.ts                     toISODate, parseISODate, startOfWeek,
                                               addDays, weekDays, shiftWeek
src/features/menus/components/
  WeekNavigator.tsx                            ← tuần này → + nút "Hôm nay"
  MenuCard.tsx                                 tiêu đề + status + notes + lưới 7 ngày
  DayColumn.tsx                                1 ngày: thứ, ngày, danh sách bữa
  MealRow.tsx                                  1 bữa: loại, tên món, servings, ảnh
src/features/menus/pages/MealPlanPage.tsx      /meal-plan
src/features/menus/__tests__/week.test.ts      logic tuần
src/i18n/locales/{en,vi}/menu.json             namespace `menu` (13)
```

Sửa:

```text
src/app/routes.tsx                             thêm /meal-plan (ProtectedRoute)
src/app/layout/Navbar.tsx                      thêm link trong dropdown tài khoản
src/i18n/index.ts                              đăng ký namespace `menu`
src/i18n/locales/{en,vi}/common.json           key nav cho dropdown
```

### 4.2 Types

```ts
export type MenuStatus = "drafted" | "scheduled" | "cancelled" | "completed";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
}

export interface Meal {
    mealType: MealType;
    servings: number;
    dish: Dish;
}

export interface MenuDay {
    date: string;        // YYYY-MM-DD
    meals: Meal[];
}

export interface MenuDetail {
    id: string;
    startDate: string;   // YYYY-MM-DD
    endDate: string;     // YYYY-MM-DD
    status: MenuStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    days: MenuDay[];     // chỉ ngày có bữa; có thể []
}

export interface MealPlanParams {
    from: string;        // YYYY-MM-DD
    to: string;
}
```

`Dish` trùng tên với `Dish` trong `features/recipes/types.ts` nhưng **khác shape**
(recipes: `{ id, name }` cho autocomplete). Không import chéo — 2 domain độc lập, giữ
bản riêng. Ghi `ponytail:` tại chỗ.

### 4.3 `week.ts`

```ts
/** Date → "YYYY-MM-DD" theo giờ máy. */
export function toISODate(date: Date): string;

/** "YYYY-MM-DD" → Date local (không qua UTC). */
export function parseISODate(iso: string): Date;

/** Thứ 2 của tuần chứa `date` (tuần ISO: T2→CN). */
export function startOfWeek(date: Date): Date;

/** Cộng/trừ ngày, trả Date mới. */
export function addDays(date: Date, days: number): Date;

/** 7 ngày của tuần, bắt đầu từ `monday`. */
export function weekDays(monday: Date): Date[];

/** Dịch tuần đi `weeks` tuần (âm = lùi). */
export function shiftWeek(monday: Date, weeks: number): Date;
```

`startOfWeek`: `getDay()` trả 0 cho Chủ nhật → map `(getDay() + 6) % 7` để Thứ 2 = 0.

### 4.4 `api.ts`

```ts
export async function getMealPlans({ from, to }: MealPlanParams): Promise<MenuDetail[]> {
    const { data } = await api.get<ApiResponse<MenuDetail[]>>("/api/menus/details", {
        params: { from, to },
    });
    return data.data ?? [];
}
```

Không map/đổi tên field — shape backend đã đúng camelCase. `?? []` phòng `data: null`.

### 4.5 `useMealPlans.ts`

```ts
export function useMealPlans({ from, to }: MealPlanParams) {
    return useQuery({
        queryKey: ["meal-plans", from, to],
        queryFn: () => getMealPlans({ from, to }),
    });
}
```

`staleTime` mặc định (0) — menu có thể đổi từ chat ở tab khác; refetch khi focus là đúng.

### 4.6 `MealPlanPage.tsx`

```text
PageHeader (breadcrumb ["Meal plan"], title, description)
  action: WeekNavigator (← Tuần này →, nhãn "05/10 – 11/10")

isLoading        → Skeleton ×2 card
isError          → ErrorState onRetry
menus.length===0 → EmptyState (icon CalendarDays) + CTA "Tạo bằng trợ lý AI" → /ai-nutrition
còn lại          → menus.map(<MenuCard key={menu.id} menu={menu} />)
```

Tuần đọc từ URL:

```ts
const [params, setParams] = useSearchParams();
const from = params.get("from");
const monday = startOfWeek(from ? parseISODate(from) : new Date());
const sunday = addDays(monday, 6);
const iso = { from: toISODate(monday), to: toISODate(sunday) };
```

`from` sai định dạng → `parseISODate` trả `Invalid Date` → `Number.isNaN` check, fallback
`new Date()`. Không crash.

Đổi tuần = `setParams({ from: toISODate(nextMonday) })` (`replace: true`).

**Lưu ý**: `from` trên URL là Thứ 2; nếu user nhập tay `?from=2026-10-07` (Thứ Tư) thì
`startOfWeek` vẫn quy về Thứ 2 của tuần đó, và URL được chuẩn hoá lại. Chấp nhận.

### 4.7 `MenuCard.tsx`

```text
header:  "05/10 – 11/10"  ·  Badge(status)          [notes nếu có]
grid:    7 cột trên lg, 2 cột sm, 1 cột mobile
         mỗi cột = <DayColumn day={date} meals={mealsByDate.get(date) ?? []} today={isToday} />
```

`mealsByDate` build bằng `new Map(menu.days.map(d => [d.date, d.meals]))` trong `useMemo`.
Ngày không có trong map → `[]` → `DayColumn` hiện "Chưa có bữa".

Ngày hôm nay được tô nhẹ (`bg-vegan-green-subtle`) để dễ định vị.

### 4.8 `DayColumn.tsx` / `MealRow.tsx`

`DayColumn`: thứ (`T2`..`CN` qua i18n `menu:weekdays.short.mon`…), số ngày, `aria-label`
đầy đủ. `meals.length === 0` → dòng mờ "Chưa có bữa".

`MealRow`: `Badge size="sm" variant="outline"` cho `mealType` (i18n
`menu:mealType.BREAKFAST`), tên món (`text-sm font-medium`), `servings` (`menu:servings`),
ảnh món nếu có `imageUrl` (khung 10×10, `object-cover`, `alt={dish.name}`), `cuisineType`
nếu có. Không link — chưa có trang chi tiết dish.

### 4.9 Route + Navbar

```tsx
// routes.tsx, trong <Route element={<Layout />}>
<Route path="/meal-plan" element={<ProtectedRoute><MealPlanPage /></ProtectedRoute>} />
```

`Navbar` dropdown tài khoản: thêm link `{t("mealPlan")}` → `/meal-plan`, đặt giữa
"My Posts" và "New Recipe". Key `common:mealPlan` cho cả `en`/`vi`.

Không thêm vào `navLinks` chính (đã có 4 mục, thêm sẽ chật trên `lg`).

### 4.10 i18n — namespace `menu` (13), cả `en` và `vi`

```json
{
  "title": "Meal plan",
  "subtitle": "Weekly menus created for you by the AI nutrition assistant.",
  "breadcrumb": "Meal plan",
  "week": {
    "label": "{{from}} – {{to}}",
    "prev": "Previous week",
    "next": "Next week",
    "today": "This week"
  },
  "weekdays": {
    "short": { "mon": "Mon", "tue": "Tue", "wed": "Wed", "thu": "Thu", "fri": "Fri", "sat": "Sat", "sun": "Sun" }
  },
  "status": {
    "drafted": "Draft",
    "scheduled": "Scheduled",
    "cancelled": "Cancelled",
    "completed": "Completed"
  },
  "mealType": { "BREAKFAST": "Breakfast", "LUNCH": "Lunch", "DINNER": "Dinner" },
  "servings": "{{count}} servings",
  "noMeals": "No meals yet",
  "notes": "Note",
  "empty": {
    "title": "No meal plan for this week",
    "description": "Ask the AI nutrition assistant to build one from your dietary profile, allergies and BMI — it saves the plan here.",
    "action": "Open AI assistant"
  }
}
```

`servings` dùng `count` → i18next sẽ tìm `servings_one` / `servings_other` trước. Cần khai
báo cả hai (`_one`, `_other`) vì tiếng Anh chia số nhiều. **Hoặc** đổi tham số thành
`{ n }` để tránh. Chọn: giữ `count` + khai báo `servings_one`/`servings_other` (đúng
ngữ pháp tiếng Anh); tiếng Việt cả hai key giống nhau.

### 4.11 Test

`src/features/menus/__tests__/week.test.ts` (`// @vitest-environment node`) — logic thuần,
không React, không gọi mạng:

- `startOfWeek`: Thứ 2 → chính nó; Chủ nhật → lùi 6 ngày; Thứ 4 → lùi 2 ngày.
- `addDays`: qua ranh giới tháng, qua ranh giới năm, số âm.
- `toISODate` / `parseISODate`: round-trip; `parseISODate("2026-10-05")` là **local**
  (kiểm `getDate() === 5`), không phải UTC.
- `weekDays`: đúng 7 ngày liên tiếp, bắt đầu Thứ 2.
- `shiftWeek`: +1 / -1 qua ranh giới tháng.
- `parseISODate` với chuỗi rác → `Invalid Date` (để page fallback).

## 5. Kiểm chứng

### 5.1 Lệnh

```sh
npm run typecheck
npm run lint
npx vitest run src/features/menus
```

### 5.2 Kiểm tay (cần tài khoản thật + đã có menu)

Chuẩn bị: vào `/ai-nutrition`, hỏi *"tạo thực đơn tuần này cho tôi"*, chờ AI trả lời.

1. `/meal-plan` → thấy card menu tuần hiện tại, đủ 7 cột ngày.
2. Ngày không có bữa → hiện "Chưa có bữa", không phải cột trống.
3. Badge trạng thái khớp (AI tạo ra `drafted`).
4. Notes của menu hiển thị.
5. Bấm ← → đổi tuần, URL đổi theo, tuần không có menu → EmptyState.
6. "Tuần này" đưa về tuần hiện tại.
7. Mở 2 tab: tạo menu mới ở tab AI, quay lại tab `/meal-plan` → tự refetch khi focus.
8. Đổi ngôn ngữ EN/VI → không còn key thô, tên thứ đổi theo.
9. Chưa đăng nhập, vào `/meal-plan` → bị đẩy về `/login`.
10. Vào `/meal-plan?from=abc` → không crash, rơi về tuần hiện tại.

### 5.3 Kiểm biên

- Menu có `days: []` → card vẫn render 7 cột trống.
- `dish.imageUrl: null` → không vỡ layout (khung ảnh chỉ render khi có URL).
- `dish.description: null` → không render dòng mô tả.
- Menu giao mép hai tuần → xuất hiện ở cả hai, tiêu đề card ghi đúng `startDate` của nó.

## 6. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Backend production chưa có endpoint menu | `GET /api/menus` trả **401** (không phải 404) ⇒ đã deploy. Vẫn nên gọi thử bằng token thật trước khi merge |
| Múi giờ lệch ngày | §3.2 (luôn gửi from/to) + §3.4 (parse local) |
| AI chat chưa bật tool ở môi trường prod | User thấy EmptyState mãi. Ghi trong description empty state rằng menu do AI tạo — user biết phải làm gì |
| `days` thiếu ngày | §3.3 render đủ 7 ô |
| Menu cũ không theo tuần (`startDate` không phải Thứ 2) | Không xảy ra qua `POST` (backend luôn nhận Thứ 2), nhưng dữ liệu seed có thể. Card hiển thị đúng `startDate` riêng |

## 7. Thứ tự thực hiện

1. `week.ts` + `week.test.ts` → `npx vitest run src/features/menus` xanh.
2. `types.ts`, `api.ts`, `useMealPlans.ts`.
3. i18n namespace `menu` (en + vi) + đăng ký ở `src/i18n/index.ts`.
4. Components: `MealRow` → `DayColumn` → `MenuCard` → `WeekNavigator`.
5. `MealPlanPage.tsx`.
6. Route + link Navbar.
7. `npm run typecheck && npm run lint`.
8. Cập nhật docs:
   - `API-COVERAGE.md`: **thêm mục menu** (hiện file này **không có** nhóm nào về menu —
     thiếu hẳn 5 endpoint), cộng dòng màn hình `Meal Plan | /meal-plan | ✅ GET /api/menus/details`.
   - `SRS.md` FR-07: `⬜ chưa dựng` → `🟡 xem được menu AI tạo, chưa tự tạo/sửa`.
   - `CODE-STRUCTURE.md`: thêm §3.10 `features/menus/`, cập nhật namespace 12 → 13.
   - `TEST-COVERAGE.md`: 23 → 24 file test.
   - `README.md`, `GETSTARTED.md`, `.claude/CLAUDE.md`: namespace 12 → 13, thêm
     `features/menus/`, route `/meal-plan`.
