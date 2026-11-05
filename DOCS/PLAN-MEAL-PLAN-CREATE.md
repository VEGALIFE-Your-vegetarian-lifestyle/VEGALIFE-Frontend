# Plan — Tự tạo thực đơn tuần bằng tay (giai đoạn B)

> Trạng thái: **đã code xong** — `npm run typecheck` + `npm run lint` sạch, 21/21 test pass · Ngày lập: 2026-10-26 · Branch: `feat/meal-plan`
> Backend: `dev` @ `2946f18` — `MenuController.java`, `MenuValidator.java`, `MenuService.java`
> Tiền nhiệm: `DOCS/PLAN-MEAL-PLAN-VIEW.md` (giai đoạn C — chỉ đọc, ✅ xong)

## 1. Mục tiêu

`POST /api/menus` **đã có trên backend production** (probe không token → 401, không phải 404).
FE chưa gọi. Hiện user chỉ tạo được menu bằng cách nhờ chatbot AI; `/meal-plan` chỉ đọc.

**Phạm vi**: trang `/meal-plan/create` — chọn tuần, xếp món vào 3 bữa × 7 ngày, lưu thành
menu `drafted`; cộng nút đổi trạng thái trên `MenuCard` (`scheduled` / `cancelled` /
`completed`).

**Ngoài phạm vi**: sửa nội dung menu đã lưu (`PATCH`) — để giai đoạn B2, xem §8. Không có
endpoint xoá menu; `cancelled` là đường "bỏ" duy nhất.

### Vì sao có cả status trong giai đoạn này

`drafted` **không phải** "chờ ai duyệt" — không có admin nào duyệt menu, không có cron nào
tự chuyển. Đã kiểm backend `origin/dev`:

| Đường đổi status | Có? |
|---|---|
| `POST /api/menus/{menuId}/status` | ✅ owner từ JWT |
| Controller admin cho menu | ❌ (12 controller trong `controller/admin/`, không có menu) |
| Cron/scheduler | ❌ (`scheduled/` có 6 job, không job nào chạm menu) |
| AI chatbot | ✅ nhưng **cùng user** — `MenuTools.scheduleMenu` gọi đúng `changeStatus` đó |

Nên nếu chỉ làm form tạo, user lưu xong `drafted` rồi không có nút nào để schedule →
dead-end. Status phải nằm cùng giai đoạn.

## 2. Hiện trạng

| Thứ | Trạng thái |
|---|---|
| `POST /api/menus` | ✅ backend có, ❌ FE chưa có service |
| `PATCH /api/menus/{menuId}` | ✅ backend có, ❌ FE chưa gọi |
| `POST /api/menus/{menuId}/status` | ✅ backend có, ❌ FE chưa gọi — **làm trong plan này** |
| `GET /api/dishes` | ✅ `searchDishes` (`features/recipes/api.ts`) — dùng được để chọn món |
| `/meal-plan` | ✅ chỉ đọc (`GET /api/menus/details`) |
| `features/menus/` | `api.ts` chỉ có `getMealPlans`; `types.ts` chỉ có type đọc |

`PLAN-MEAL-PLAN-VIEW.md` §1 ghi giai đoạn B là "chưa lên plan" — file này là plan đó.

## 3. API

### 3.1 `POST /api/menus` — tạo

| | |
|---|---|
| Auth | JWT bắt buộc; owner lấy từ token, không nhận `userId` |
| Body | `{ startDate, notes?, days[] }` |
| Trả | **201** + `MenuDetailResponse` — `days[].meals[]` chỉ có `dishId`/`dishName`, **không** có `dish` object đầy đủ |

```json
{
  "startDate": "2026-10-05",
  "notes": "Tuần nhiều đạm",
  "days": [
    { "date": "2026-10-05",
      "meals": [
        { "mealType": "BREAKFAST", "dishId": "<uuid>", "servings": 2 },
        { "mealType": "DINNER",    "dishId": "<uuid>", "servings": 2 }
      ] }
  ]
}
```

### 3.2 Ràng buộc BR-MENU-005 — đọc kỹ, đây là phần khó của form

`MenuValidator.validate()` chạy trước khi ghi; vi phạm bất kỳ điều nào → **400, không lưu gì**.

| # | Luật | Hằng số backend |
|---|---|---|
| 1 | `days` **đúng 7 phần tử**, là `startDate..startDate+6`, mỗi ngày một lần | `DAYS_PER_WEEK = 7` |
| 2 | Mỗi ngày **1–3 bữa** | `MIN_MEALS_PER_DAY = 1`, `MAX_MEALS_PER_DAY = 3` |
| 3 | Mỗi ngày tối đa **1 bữa cho mỗi `mealType`** | — |
| 4 | `servings` là số nguyên **≥ 1** | `MIN_SERVINGS = 1` |
| 5 | `dishId` tồn tại và chưa xoá mềm | — |
| 6 | Một món xuất hiện **≤ 3 lần** trong cả tuần | `MAX_DISH_REPEATS = 3` |
| 7 | Menu phải dùng **≥ 5 món khác nhau** | `MIN_DISTINCT_DISHES = 5` |

Luật 6 và 7 là chặn thật: không thể lưu một tuần chỉ có 2 món, cũng không thể lặp một món
4 bữa. Form **phải** đếm và chặn tại client, đừng để user bấm Lưu rồi ăn 400.

`startDate` **phải là Thứ 2** trên thực tế (luật 1 chỉ kiểm 7 ngày liên tiếp, không kiểm
thứ), nhưng `GET /api/menus/details` và `WeekNavigator` đều tính tuần từ Thứ 2 — lệch sẽ
làm menu hiện ở tuần sai. Form luôn gửi Thứ 2.

`endDate` do server suy ra, **không** gửi lên.

### 3.3 `GET /api/dishes` — nguồn chọn món

`searchDishes({ name?, page?, size? })` → `PageResponse<Dish>`. `sort` mặc định `name,asc`.
`size` tối đa **100**, `page` 0-based.

⚠️ Endpoint này lọc `moderation_status = APPROVED` (`DishSpecifications.activeWithFilters`).
Món do member tạo mà chưa được admin duyệt sẽ **không** có trong danh sách chọn — dù
`MenuValidator` (dùng `dishRepository.findAllById`, chỉ lọc `deletedAt`) vẫn chấp nhận id đó
nếu gửi thẳng. Xem rủi ro §7.

### 3.4 `POST /api/menus/{menuId}/status` — đổi trạng thái

| | |
|---|---|
| Auth | JWT; menu của user khác = **404**, không phải 403 |
| Body | `{ "status": "scheduled" \| "cancelled" \| "completed" }` |
| Trả | **200** + `MenuDetailResponse` (cùng shape `POST /api/menus`) |

Bảng chuyển (`MenuService.isLegalTransition`):

| From | Được sang |
|---|---|
| `drafted` | `scheduled`, `cancelled` |
| `scheduled` | `cancelled`, `completed` |
| `cancelled`, `completed` | — (hết) |

`drafted` **không bao giờ** là đích. No-op (đích = hiện tại) → **409**, không phải 200.

| Mã | Khi nào |
|---|---|
| 400 | `status` thiếu / sai từ vựng |
| 404 | `menuId` lạ hoặc của user khác |
| 409 | Chuyển không hợp lệ (`InvalidMenuTransitionException`) |
| 409 | Schedule trùng tuần menu `scheduled` khác (`MenuOverlapException`) |

Overlap: pre-check ở service + ràng buộc loại trừ V30 ở DB. Một user chỉ có **một** menu
`scheduled` tại một thời điểm — nhiều `drafted` cùng tuần vẫn được.

## 4. Quyết định

### 4.1 Trang riêng `/meal-plan/create`, không phải dialog

Form là lưới 7 ngày × 3 bữa = 21 ô chọn món + ô ghi chú + bộ đếm luật 6/7. Nhồi vào
`Dialog` (`max-w-lg`) là không đủ chỗ và mất ngữ cảnh tuần đang xem.
Theo đúng pattern repo: `/posts/create`, `/recipes/create` đều là trang riêng.

### 4.2 Lưới cố định 3 ô/ngày, ô trống = bỏ qua

Mỗi ngày luôn có đủ 3 ô `BREAKFAST` / `LUNCH` / `DINNER`; ô không chọn món thì **không**
gửi lên. Cách này thoả luật 2 và 3 một cách tự nhiên (mỗi loại tối đa 1 ô), không cần UI
"thêm/xoá bữa" như `IngredientEditor`.

Hệ quả: user muốn 1 bữa/ngày thì chỉ điền 1 ô. Muốn 3 thì điền cả 3. Không có trạng thái
trung gian nào để validate ngoài "ngày phải có ≥1 ô".

### 4.3 Đếm luật 6/7 ngay trên form, chặn nút Lưu

Một khối "Yêu cầu của tuần" hiển thị live:

```text
Món khác nhau   3 / 5      ← đỏ khi < 5
Món lặp nhiều   4 lần      ← đỏ khi > 3 (kèm tên món)
Ngày có bữa     6 / 7      ← đỏ khi < 7
```

Nút **Lưu** `disabled` khi bất kỳ dòng nào đỏ. Không có toast "thiếu món" sau khi bấm —
chặn trước.

### 4.4 Formik + hàm `validate` thuần, **không** Yup

Repo convention là Formik + Yup, nhưng Yup mô tả schema **theo từng field**; luật 6/7 là
quan hệ **giữa các field** (đếm trên toàn bộ 21 ô). Nhồi vào `.test()` gốc của Yup thì mất
khả năng gắn lỗi vào đúng ô, mà vẫn phải viết hàm đếm y hệt.

→ Dùng `useFormik({ validate })` với `validate.ts` thuần (nhận `MenuFormValues`, trả
`Record<string, string>`). Lý do ghi bằng `ponytail:` tại chỗ. `payload.ts` vẫn tách riêng
như `CreateRecipePage`.

### 4.5 Món phải chọn từ danh sách, không gõ tự do

Khác `AutocompleteField` của form recipe (backend find-or-create theo tên, gõ tên mới hợp
lệ): menu cần **`dishId` có thật**. Nên viết `DishSlotPicker` riêng — không sửa
`AutocompleteField` để nhét thêm `onSelect`, hai component có ngữ nghĩa khác nhau
(một cái cho gõ tự do, một cái bắt buộc chọn).

### 4.6 Tách `searchDishes` sang `shared/` — ngưỡng thứ ba đã tới

`DishPicker` (`nutrition-ai`) đang có `ponytail:` ghi: *"Tách sang `shared/api/dishes.ts`
khi có feature thứ ba cùng dùng."* Form này là consumer thứ ba (`recipes` autocomplete,
`nutrition-ai` DishPicker, `menus`). Làm luôn, đừng thêm một import chéo thứ hai.

### 4.7 Lưu xong quay về `/meal-plan?from=<startDate>`

Menu mới luôn `drafted` → hiện ngay ở trang tuần với badge "Nháp". Không điều hướng sang
trang chi tiết (không có). `invalidateQueries(["meal-plans"])` để tuần đó refetch.

### 4.8 Tuần mặc định = tuần đang xem

`/meal-plan/create` không có `?from=` thì lấy tuần hiện tại (giờ máy). Từ `/meal-plan`
bấm "Tạo thực đơn" truyền kèm `?from=` của tuần đang xem — user không phải chọn lại.

### 4.9 Nút status đặt trên `MenuCard`, chỉ hiện hành động hợp lệ

Mỗi card chỉ render nút mà bảng chuyển cho phép, không render rồi disable:

| `menu.status` | Nút hiện |
|---|---|
| `drafted` | **Lên lịch** (primary) · **Huỷ** (outline) |
| `scheduled` | **Hoàn thành** (primary) · **Huỷ** (outline) |
| `cancelled`, `completed` | — |

Nút "Huỷ" ở đây là **huỷ menu** (đổi status), khác nút "Huỷ" ở form tạo (rời trang). Nhãn
i18n phải phân biệt: `menu:actions.cancelMenu` vs `menu:create.cancel`.

Xác nhận qua `ConfirmDialog` — `scheduled` có thể 409 overlap, `cancelled`/`completed`
không lùi được. Dùng lại `ConfirmDialog` sẵn có, không cần dialog riêng.

### 4.10 Không có "Lưu và lên lịch" gộp

Hai lý do: `POST /api/menus` không nhận `status` (luôn `drafted`), và schedule có thể 409
overlap — gộp hai call thì tạo menu thành công nhưng schedule thất bại, user thấy lỗi mà
menu vẫn đã tạo. Tách ra thì toast nói đúng việc nào hỏng.

## 5. Thiết kế

### 5.1 File

Mới:

```text
src/shared/types/dish.ts                       Dish (id, name, description, imageUrl,
                                               cuisineType, createdAt)
src/shared/api/dishes.ts                       searchDishes, SuggestParams  ← chuyển từ
                                               features/recipes/api.ts
src/features/menus/pages/CreateMealPlanPage/
  CreateMealPlanPage.tsx                       trang + mutation
  schema.ts                                    MenuFormValues, emptyWeek, đếm món
  validate.ts                                  validate(values) → lỗi theo field
  payload.ts                                   buildCreateMenuPayload
  DayEditor.tsx                                1 ngày: 3 ô bữa
  DishSlotPicker.tsx                           1 ô: tìm + chọn 1 món
  __tests__/schema.test.ts                     test thuần
```

Sửa:

```text
src/features/menus/types.ts                    + CreateMenuRequest, MenuWriteResult
src/features/menus/api.ts                      + createMenu, changeMenuStatus
src/features/menus/components/MenuCard.tsx     + MenuActions (nút status)
src/features/menus/components/MenuActions.tsx  mới — 2 nút theo bảng chuyển
src/features/menus/pages/MealPlanPage.tsx      + nút "Tạo thực đơn" ở PageHeader.action
src/app/routes.tsx                             + /meal-plan/create (ProtectedRoute)
src/features/recipes/api.ts                    bỏ searchDishes/SuggestParams (đã chuyển)
src/features/recipes/types.ts                  Dish → re-export từ shared
src/features/recipes/pages/CreateRecipePage/CreateRecipePage.tsx   đổi import
src/features/nutrition-ai/DishPicker.tsx       đổi import + xoá ponytail
src/i18n/locales/{en,vi}/menu.json             + key cho form + key cho actions
DOCS/API-COVERAGE.md, CLAUDE.md, CODE-STRUCTURE.md, SRS.md, TEST-COVERAGE.md
```

### 5.2 `shared/types/dish.ts` + `shared/api/dishes.ts`

```ts
// shared/types/dish.ts — shape của GET /api/dishes (khác Dish trong features/menus/types.ts:
// bên đó là subset dùng để render menu).
export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
    createdAt: string;
}
```

```ts
// shared/api/dishes.ts
export interface SuggestParams { name?: string; page?: number; size?: number; }

/** `name` là substring không phân biệt hoa thường; bỏ trống thì liệt kê từ đầu. Cần JWT. */
export async function searchDishes({ name, page = 0, size = 10 }: SuggestParams): Promise<PageResponse<Dish>> {
    const { data } = await api.get<ApiResponse<PageResponse<Dish>>>("/api/dishes", {
        params: { page, size, sort: "name,asc", ...(name ? { name } : {}) },
    });
    return data.data;
}
```

`features/recipes/types.ts`: `export type { Dish } from "@/shared/types/dish";` (giữ mọi
import `from "../types"` cũ chạy nguyên).
`features/recipes/api.ts`: xoá `searchDishes` + `SuggestParams`, **giữ** `searchIngredients`
(chỉ form recipe dùng, chưa có consumer thứ hai).
`CreateRecipePage.tsx` và `DishPicker.tsx`: đổi import sang `@/shared/api/dishes`.

`features/menus/types.ts`: `Dish` cục bộ giữ nguyên (`Pick` 5 field, không `createdAt`) —
`ponytail:` hiện có vẫn đúng, không đụng.

### 5.3 `features/menus/types.ts`

```ts
/** POST /api/menus — owner lấy từ JWT, `endDate` server suy ra. */
export interface CreateMenuRequest {
    /** Thứ 2 của tuần, YYYY-MM-DD. */
    startDate: string;
    notes?: string;
    /** Đúng 7 phần tử: startDate .. startDate + 6. */
    days: { date: string; meals: { mealType: MealType; dishId: string; servings: number }[] }[];
}

/**
 * `POST /api/menus`, `PATCH`, `POST /{id}/status` trả shape này — khác `MenuDetail`:
 * meals chỉ có `dishId`/`dishName`, không nhúng `dish`.
 */
export interface MenuWriteResult extends Omit<MenuDetail, "days"> {
    days: {
        date: string;
        meals: { mealType: MealType; dishId: string; dishName: string; servings: number }[];
    }[];
}
```

### 5.4 `features/menus/api.ts`

```ts
export async function createMenu(request: CreateMenuRequest): Promise<MenuWriteResult> {
    const { data } = await api.post<ApiResponse<MenuWriteResult>>("/api/menus", request);
    return data.data;
}

/**
 * `POST /api/menus/{menuId}/status` — `drafted → scheduled|cancelled`,
 * `scheduled → cancelled|completed`. `drafted` không phải đích.
 */
export async function changeMenuStatus(menuId: string, status: MenuStatus): Promise<MenuWriteResult> {
    const { data } = await api.post<ApiResponse<MenuWriteResult>>(`/api/menus/${menuId}/status`, { status });
    return data.data;
}
```

Không dùng kết quả để render — chỉ lấy `data` cho mutation `onSuccess`. Vẫn khai báo type
đầy đủ thay vì `unknown`, để chỗ gọi biết shape nếu sau này cần.

### 5.5 `schema.ts`

```ts
export type MealSlotKey = MealType;   // BREAKFAST | LUNCH | DINNER

/** Một ô bữa. `dish: null` = bữa trống, không gửi lên. */
export interface MealSlot {
    mealType: MealSlotKey;
    dish: { id: string; name: string } | null;
    /** Chuỗi vì `<input type="number">` trả string. */
    servings: string;
}

export interface DayForm {
    /** YYYY-MM-DD */
    date: string;
    /** Luôn đủ 3, theo thứ tự BREAKFAST → LUNCH → DINNER. */
    slots: MealSlot[];
}

export interface MenuFormValues {
    /** Thứ 2 của tuần. */
    startDate: string;
    notes: string;
    /** Luôn đủ 7, tính từ `startDate`. */
    days: DayForm[];
}

export const MEAL_TYPES: MealType[] = ["BREAKFAST", "LUNCH", "DINNER"];
export const MIN_DISTINCT_DISHES = 5;
export const MAX_DISH_REPEATS = 3;
export const MIN_SERVINGS = 1;

/** Tuần rỗng cho một `startDate`; mọi ô trống, servings mặc định "1". */
export function emptyWeek(startDate: string): MenuFormValues;

/** Đổi tuần: giữ nguyên món theo **thứ trong tuần**, không theo ngày tuyệt đối. */
export function moveWeek(values: MenuFormValues, startDate: string): MenuFormValues;

/** Đếm số lần mỗi món được dùng trong tuần (bỏ ô trống). */
export function dishUsage(values: MenuFormValues): Map<string, { name: string; count: number }>;

/** Số ngày có ≥1 bữa. */
export function daysWithMeals(values: MenuFormValues): number;
```

`moveWeek` cần thiết vì `startDate` sửa được trên form; đổi tuần mà giữ món theo vị trí
ngày trong tuần (thứ 2 vẫn là thứ 2) chứ không xoá trắng. Nếu user chỉ muốn đổi ngày thì
form gọi lại `emptyWeek`.

### 5.6 `validate.ts`

```ts
export function validate(values: MenuFormValues, t: TFunction): Record<string, string> {
    const errors: Record<string, string> = {};

    // Luật 2: mỗi ngày ≥ 1 bữa.
    values.days.forEach((day, dayIndex) => {
        if (day.slots.every((slot) => slot.dish === null)) {
            errors[`days.${dayIndex}`] = t("menu:create.errors.dayEmpty");
        }
    });

    // Luật 4: servings nguyên ≥ 1 cho mọi ô đã chọn món.
    values.days.forEach((day, dayIndex) =>
        day.slots.forEach((slot, slotIndex) => {
            if (slot.dish === null) return;
            const n = Number(slot.servings);
            if (!Number.isInteger(n) || n < MIN_SERVINGS) {
                errors[`days.${dayIndex}.slots.${slotIndex}.servings`] = t("menu:create.errors.servings");
            }
        }),
    );

    // Luật 6 + 7.
    const usage = dishUsage(values);
    const distinct = usage.size;
    if (distinct < MIN_DISTINCT_DISHES) errors.week = t("menu:create.errors.tooFewDishes", { count: distinct, min: MIN_DISTINCT_DISHES });
    const repeated = [...usage.values()].find((item) => item.count > MAX_DISH_REPEATS);
    if (repeated) errors.week = t("menu:create.errors.tooManyRepeats", { name: repeated.name, max: MAX_DISH_REPEATS });

    return errors;
}
```

`errors.week` là lỗi cấp tuần (hiện ở khối đếm), các key còn lại gắn đúng ô qua
`formik.errors.days?.[i]?.slots?.[j]?.servings`. Formik không có helper cho mảng lồng nhau
kiểu này → đọc trực tiếp bằng optional chaining, ghi chú tại chỗ.

Lỗi `week` ưu tiên luật 6 trước luật 7 (thông báo cụ thể hơn).

### 5.7 `payload.ts`

```ts
export function buildCreateMenuPayload(values: MenuFormValues): CreateMenuRequest {
    const notes = values.notes.trim();
    return {
        startDate: values.startDate,
        ...(notes ? { notes } : {}),
        // Luôn đủ 7 ngày kể cả ngày không có bữa — nhưng ngày rỗng đã bị `validate` chặn,
        // nên trên thực tế mỗi phần tử đều có ≥ 1 bữa.
        days: values.days.map((day) => ({
            date: day.date,
            meals: day.slots
                .filter((slot) => slot.dish !== null)
                .map((slot) => ({
                    mealType: slot.mealType,
                    dishId: slot.dish!.id,
                    servings: Number(slot.servings),
                })),
        })),
    };
}
```

### 5.8 `DishSlotPicker.tsx`

```text
props: { value: { id, name } | null, onChange(dish | null), disabled? }

render:
  value ? <chip tên món + nút ✕> : <Input tìm món (leadingIcon Search)>
  dropdown (giống AutocompleteField): kết quả searchDishes({ name: debounced, size: 8 })
  chọn → onChange(dish) → đóng dropdown
```

`useQuery(["dishes", debounced], …, { staleTime: 60_000 })` — cùng queryKey với
`DishPicker`/`AutocompleteField` nên cache dùng chung. `useDebounce(q, 300)`. Khi ô trống
gọi `searchDishes({ size: 8 })` để hiện 8 món đầu (không cần gõ).

Không có `page` — chỉ 8 kết quả đầu, gõ thêm để lọc. `ponytail:` ghi rõ: chưa phân trang
trong dropdown, thêm khi danh sách món lớn.

### 5.9 `DayEditor.tsx`

```text
props: { day: DayForm, index: number, errors, disabled?, onChange(slots) }

header: "T2 05/10"  (i18n menu:weekdays.short + ngày)
3 hàng: Badge mealType  |  DishSlotPicker  |  Input số servings (w-16)
        lỗi servings hiện dưới hàng
```

Bố cục: `grid grid-cols-1 gap-3 lg:grid-cols-2` cho 7 `DayEditor` (ngày cuối chiếm 1 ô).

### 5.10 `CreateMealPlanPage.tsx`

```text
PageHeader  breadcrumb ["Meal plan", "Create"], title, description
            action: WeekNavigator (← → "Tuần này") — dùng lại, đổi `startDate` của form

SectionCard "Tuần"        Input type="date" startDate (min = hôm nay? không chặn)
                          Textarea notes (optional, maxLength 500)
SectionCard "Bữa trong tuần"  7 × DayEditor
SectionCard "Yêu cầu của tuần"  khối đếm live + lỗi `week`
footer                    Button outline "Huỷ" → /meal-plan
                          Button primary "Lưu thực đơn" (disabled khi có lỗi || isPending)
```

Mutation:

```tsx
const createMutation = useMutation({
    mutationFn: (values: MenuFormValues) => createMenu(buildCreateMenuPayload(values)),
    onSuccess: (menu) => {
        toast.success(t("menu:create.toast.created"));
        void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
        navigate(`/meal-plan?from=${menu.startDate}`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t("menu:create.toast.failed"))),
});
```

`getApiErrorMessage` hiện nguyên văn message 400 của `MenuValidator` — đúng ý, vì message
backend đã nêu rõ luật nào bị vi phạm.

Đổi tuần: `formik.setValues(moveWeek(formik.values, nextMonday))`, cập nhật `?from=` trên
URL (`replace: true`).

**Không dùng `enableReinitialize`.** Nó nghe hợp lý (đổi tuần thì `initialValues` đổi) nhưng
sẽ reset toàn bộ form mỗi lần `?from=` đổi — mất sạch món vừa chọn. `goToWeek` đã tự
`setValues` rồi nên reinit là thừa và phá.

**Không dùng `formik.errors` để hiển thị.** `validate.ts` trả key **phẳng**
(`days.0.slots.1.servings`), còn `FormikErrors<MenuFormValues>` suy ra dạng **lồng**
(`days[0].slots[1].servings`) → ép type sẽ vỡ ở `errors.week`. Gọi thẳng `validate(values, t)`
trong render: cùng kết quả, đúng type, và `ready` cũng đúng ngay từ render đầu (Formik để
`errors = {}` cho tới lần validate đầu tiên, nên nút Lưu sẽ mở oan).

### 5.11 `MealPlanPage.tsx`

`PageHeader.action` hiện là `WeekNavigator`. Bọc lại:

```tsx
action={
    <div className="flex flex-wrap items-center gap-2">
        <WeekNavigator … />
        <Button onClick={() => navigate(`/meal-plan/create?from=${from}`)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("create.action")}
        </Button>
    </div>
}
```

`EmptyState` thêm nút thứ hai "Tự tạo thực đơn" cạnh "Mở trợ lý AI" — hiện chỉ có CTA AI,
giờ có hai đường.

### 5.12 Route

```tsx
<Route path="/meal-plan/create" element={<ProtectedRoute><CreateMealPlanPage /></ProtectedRoute>} />
```

Đặt **trước** `/meal-plan` trong file cho dễ đọc; react-router v7 tự xếp hạng static
segment dài hơn nên không cần thứ tự.

### 5.13 i18n — namespace `menu`, cả `en` và `vi`

Thêm vào `menu.json` (đổi luôn `subtitle` + `empty.description` vì không còn "chỉ AI tạo"):

```json
{
  "subtitle": "Weekly menus you build yourself or ask the AI assistant for.",
  "empty": {
    "description": "Build one yourself or ask the AI nutrition assistant to plan it from your dietary profile, allergies and BMI.",
    "action": "Open AI assistant",
    "create": "Build one yourself"
  },
  "create": {
    "action": "Create meal plan",
    "title": "Create a weekly meal plan",
    "subtitle": "Pick up to three dishes per day. You can save it as a draft and schedule it later.",
    "breadcrumb": "Create",
    "weekLabel": "Week starting",
    "notesLabel": "Note",
    "notesPlaceholder": "Theme of the week, restrictions you kept to…",
    "notesLimit": "{{used}}/{{max}}",
    "mealTypeColumn": "Meal",
    "dishColumn": "Dish",
    "servingsColumn": "Servings",
    "pickDish": "Pick a dish",
    "searchDish": "Search dishes",
    "noDishFound": "No dish matches that name.",
    "clearDish": "Remove {{name}}",
    "requirements": {
      "title": "Week requirements",
      "distinct": "Distinct dishes",
      "distinctValue": "{{count}} / {{min}}",
      "repeats": "Most repeated dish",
      "repeatsValue": "{{count}} × {{name}}",
      "repeatsNone": "No dish picked yet",
      "days": "Days with meals",
      "daysValue": "{{count}} / 7",
      "ok": "Ready to save"
    },
    "errors": {
      "dayEmpty": "Add at least one meal to this day.",
      "servings": "Servings must be a whole number of at least 1.",
      "tooFewDishes": "A menu needs at least {{min}} different dishes (currently {{count}}).",
      "tooManyRepeats": "{{name}} appears more than {{max}} times in this week."
    },
    "toast": { "created": "Meal plan created", "failed": "Could not create the meal plan." },
    "cancel": "Cancel",
    "save": "Save meal plan"
  },
  "actions": {
    "schedule": "Schedule",
    "complete": "Mark completed",
    "cancelMenu": "Cancel menu",
    "updated": "Menu status updated",
    "failed": "Could not update the menu status.",
    "confirmTitle": "Change menu status",
    "confirmSchedule": "Schedule this week? A week can only have one scheduled menu.",
    "confirmComplete": "Mark this week as completed? This cannot be undone.",
    "confirmCancel": "Cancel this menu? This cannot be undone."
  }
}
```

Bản `vi` dịch tương ứng. `requirements.repeats` không có món nào → dùng `repeatsNone`.

### 5.14 Test — `CreateMealPlanPage/__tests__/schema.test.ts`

Thuần, không React, không mạng (`// @vitest-environment node`):

| Nhóm | Case |
|---|---|
| `emptyWeek` | đúng 7 ngày liên tiếp từ `startDate`; mỗi ngày đủ 3 slot đúng thứ tự; mọi `dish: null` |
| `moveWeek` | món đi theo **vị trí trong tuần**; `date` đổi theo; `notes` giữ nguyên |
| `dishUsage` | bỏ ô trống; đếm đúng khi cùng món ở 2 ngày; nhiều món |
| `daysWithMeals` | ngày toàn ô trống không tính |
| `validate` | ngày trống → `days.<i>`; servings `"0"`/`"1.5"`/`"abc"` → lỗi slot; 4 món → `week` tooFew; 1 món × 4 lần → tooManyRepeats (ưu tiên hơn tooFew); tuần hợp lệ → `{}` |
| `buildCreateMenuPayload` | bỏ ô trống khỏi `meals`; `servings` đổi sang number; `notes` rỗng không gửi key; đủ 7 `days` |

Tham chiếu: `CreateRecipePage/__tests__/schema.test.ts` (17 case) là mẫu về độ phủ.

### 5.15 `MenuActions.tsx` — nút đổi trạng thái

```tsx
/** Nút chỉ render khi bảng chuyển BR-MENU-007 cho phép — không render rồi disable. */
const NEXT: Record<MenuStatus, { to: MenuStatus; labelKey: "schedule" | "complete" | "cancelMenu"; variant: "primary" | "outline" }[]> = {
    drafted: [
        { to: "scheduled", labelKey: "schedule", variant: "primary" },
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline" },
    ],
    scheduled: [
        { to: "completed", labelKey: "complete", variant: "primary" },
        { to: "cancelled", labelKey: "cancelMenu", variant: "outline" },
    ],
    cancelled: [],
    completed: [],
};

export function MenuActions({ menu }: { menu: MenuDetail }) {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<MenuStatus | null>(null);

    const mutation = useMutation({
        mutationFn: (status: MenuStatus) => changeMenuStatus(menu.id, status),
        onSuccess: () => {
            toast.success(t("actions.updated"));
            setPending(null);
            void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
        },
        // 409 overlap / 409 transition — BE nêu rõ lý do, hiện nguyên văn.
        onError: (error: unknown) => toast.error(getApiErrorMessage(error, t("actions.failed"))),
    });

    // ... render nút + ConfirmDialog cho `pending`
}
```

`MenuCard` render `<MenuActions menu={menu} />` ở header, cạnh badge status. `disabled` khi
`mutation.isPending` để không bấm đôi.

Invalidate cả `["meal-plans"]` lẫn `["menus"]` nếu sau này có trang list dùng `GET /api/menus`
— hiện chỉ có `["meal-plans"]`.

## 6. Kiểm chứng

```sh
npm run typecheck
npm run lint
npx vitest run src/features/menus
```

Thủ công (cần tài khoản thật):

1. `/meal-plan` → bấm **Tạo thực đơn** → mở `/meal-plan/create?from=<thứ 2 tuần đang xem>`.
2. Chọn 1 món cho thứ 2, để trống các ngày khác → khối yêu cầu đỏ, **Lưu** bị khoá.
3. Điền đủ 7 ngày, chỉ dùng 3 món → báo "cần ≥ 5 món khác nhau".
4. Điền 5 món nhưng một món 4 lần → báo đúng tên món + "> 3 lần".
5. Điền hợp lệ → Lưu → toast, quay về `/meal-plan?from=…`, thấy card mới badge **Nháp**,
   đúng 7 cột, đúng món/ servings.
6. Đổi tuần bằng ← → trên form → món giữ nguyên theo thứ trong tuần, URL đổi.
7. Gõ tên món không tồn tại trong ô chọn → "Không có món nào khớp", không chọn được → ô
   vẫn trống.
8. Đổi ngôn ngữ EN/VI → không còn key thô.
9. Chưa đăng nhập vào `/meal-plan/create` → đẩy về `/login`.
10. Card `drafted` → bấm **Lên lịch** → badge đổi `Đã lên lịch`, chỉ còn nút **Hoàn thành**
    + **Huỷ**.
11. Tạo menu thứ hai cùng tuần → **Lên lịch** → toast 409 "Another scheduled menu already
    overlaps this week", badge vẫn `Nháp`.
12. Menu `cancelled` → không còn nút nào trên card.

Kiểm biên:

- Món đã bị xoá mềm giữa lúc chọn và lúc lưu → backend 400 `dish not found or deleted`,
  toast hiện nguyên văn.
- Mở 2 tab, tạo menu ở tab kia rồi quay lại → `invalidateQueries` không cứu được tab cũ,
  nhưng refetch khi focus của `useMealPlans` (staleTime 0) thì có.

## 7. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Luật 6/7 làm user bí | Khối đếm live + nút Lưu khoá + message nêu đúng số còn thiếu |
| Món member tạo chưa duyệt không có trong picker | Ghi trong §3.3. Đây là hệ quả của ADR-016; gỡ bằng Phase 2 của `PLAN-RECIPE-MODERATION.md` (duyệt dish), không phải bằng code ở đây |
| `GET /api/dishes` cần JWT → khách không dùng được | Trang đã nằm trong `ProtectedRoute` |
| Danh sách món > 100, dropdown chỉ lấy 8 | Gõ để lọc; `ponytail:` ghi rõ |
| User chọn `startDate` không phải Thứ 2 | `WeekNavigator` + `moveWeek` luôn đưa về Thứ 2; ô `type="date"` chuẩn hoá lại qua `startOfWeek` khi đổi |
| Tạo trùng tuần (2 menu cùng tuần) | Backend **cho phép** — không có ràng buộc duy nhất khi `drafted`. `/meal-plan` sẽ hiện 2 card. Chấp nhận; chỉ `scheduled` mới bị chặn overlap (§8) |
| Formik không validate được mảng lồng | §5.6 — đọc lỗi bằng optional chaining, ghi chú tại chỗ |

## 8. Giai đoạn B2 — chưa làm

Chỉ còn `PATCH` (sửa nội dung menu). `POST /{id}/status` đã nằm trong giai đoạn này.

| Endpoint | Việc | Ghi chú |
|---|---|---|
| `PATCH /api/menus/{menuId}` | Sửa menu `drafted`/`scheduled` | Dùng lại **nguyên** form này: prefill từ `GET /api/menus/details?menuId=`, gửi `days` đầy đủ. Không đổi được tuần (`startDate` khoá). `cancelled`/`completed` → 409 |

Làm B2 thì mới cần: `updateMenu` trong `api.ts`, nút "Sửa" trong `MenuActions`, và prefill
form (tách `CreateMealPlanPage` thành component nhận `initial`).

## 9. Thứ tự thực hiện

1. `shared/types/dish.ts` + `shared/api/dishes.ts`; đổi 2 import (`CreateRecipePage`,
   `DishPicker`), `recipes/api.ts` bỏ `searchDishes`, `recipes/types.ts` re-export.
   → `npm run typecheck` xanh **trước khi** đụng `menus`.
2. `menus/types.ts` + `menus/api.ts` (`createMenu`, `changeMenuStatus`).
3. `CreateMealPlanPage/schema.ts` + `validate.ts` + `payload.ts` + test → `npx vitest run
   src/features/menus` xanh.
4. `DishSlotPicker` → `DayEditor` → `CreateMealPlanPage`.
5. `MenuActions` → gắn vào `MenuCard`; route + nút ở `MealPlanPage` (header + EmptyState).
6. i18n en + vi.
7. `npm run typecheck && npm run lint`.
8. Docs:
   - `API-COVERAGE.md` §10c: `POST /api/menus` + `POST /{id}/status` ❌ → ✅; dòng màn hình
     `Create Meal Plan`.
   - `.claude/CLAUDE.md`: route `/meal-plan/create`, bỏ câu "chỉ đọc — tạo menu do
     chatbot AI", thêm `shared/api/dishes.ts` vào bảng tra cứu, cập nhật phụ thuộc feature.
   - `CODE-STRUCTURE.md`: `shared/api/dishes.ts`, `menus/pages/CreateMealPlanPage/`,
     `menus/components/MenuActions.tsx`.
   - `SRS.md` FR-07: `🟡 xem được menu AI tạo` → `🟡 xem + tự tạo + đổi trạng thái, chưa sửa`.
   - `TEST-COVERAGE.md`: thêm file test mới.
   - `PLAN-MEAL-PLAN-VIEW.md` §1: giai đoạn B `⬜` → `✅ xong (PLAN-MEAL-PLAN-CREATE.md)`.
