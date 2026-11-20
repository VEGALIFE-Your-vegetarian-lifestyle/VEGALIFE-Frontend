# Frontend API changes — admin dashboard split into summary + charts (PR #211)

**Backend:** `VEGALIFE-backend` — PR #211, branch `feat/admin-dashboard-summary-and-charts` (not yet merged into `dev`)
**API references:** `docs/apis/admin/get-dashboard.md`, `docs/apis/admin/get-dashboard-charts.md`
**Date:** 2026-11-20
**Status:** breaking change — the old single-endpoint response shape is **gone, not deprecated**. No migration and no schema change. Deploy the backend first; nothing here needs a data backfill.

> **⚠️ Charts section is stale (2026-11-20, later same day).** `/dashboard/charts` now returns only
> `revenueByPlan.items[].purchases` and `publishedPosts.points[].published`. `revenueTrend`,
> `paymentHealth` and `growth` were removed. §5.3, §5.5, §5.6 and §8 no longer apply.

One endpoint became two, and several fields were removed. Read §1 first — it is the only part that breaks a running client.

---

## 1. TL;DR — what breaks

| # | Change | Frontend impact |
|---|---|---|
| 1 | `GET /api/admin/dashboard` **no longer takes `range`** | Remove the parameter. It is ignored now, not rejected. Response has no `range` field. |
| 2 | `GET /api/admin/dashboard/charts` **is new** — the only time-based surface | Everything that moves over time moved here. Four series, one shared bucket size. |
| 3 | `users.newInRange` **deleted** | → `growth.points[].newUsers` on charts |
| 4 | `users.activeInRange` **deleted** | **No replacement.** `users.activatedEver` is lifetime and monotonic. There is no per-window active-user count any more. |
| 5 | `content.newPosts` / `newRecipes` / `newComments` **deleted** | **No replacement.** Content-over-time was not one of the four charts. Drop the tile or open a follow-up. |
| 6 | `engagement.votesInRange` / `commentsInRange` **deleted** | **No replacement**, same reason. |
| 7 | `alerts`, `breakdowns`, `tables` blocks **deleted** | Build `alerts` client-side from `moderationQueue.*` + `money.pendingStaleCount`; `breakdowns` → `money` + `revenueByPlan`; `tables` → the list endpoints. |
| 8 | New `money` block on the summary | Revenue, transactions, paying users, AOV, ARPU, free grants, payer conversion, stale pending. This is the headline block. |
| 9 | `custom` range **removed** | `range` is now exactly `day` \| `week` \| `month`. Anything else → `400`, not a fallback to `week`. |
| 10 | Amounts are **whole dong** and `meta.currency` is a constant `"VND"` | Read `meta.currency`; never hardcode `₫`, and never divide by 100. |

The response envelope is unchanged: `{ "success": boolean, "message": string, "data": T }`.

---

## 2. Mental model (read before the schemas)

**Two endpoints, two jobs.**

| | `/dashboard` | `/dashboard/charts` |
|---|---|---|
| Question | *Where does the platform stand right now?* | *How is it moving?* |
| Time filter | none — every value is lifetime or current state | `range=day\|week\|month` |
| Cache | 5 min, **one entry shared by all admins** | 15 min, keyed by `range` |
| Size | one row per metric | up to 31 points per series |

There is **no overlap** between the two payloads. `money.revenueTotal` on the summary is all-time; `revenueTrend` on charts is your window. They will never be equal, and that is correct — do not try to reconcile them.

**Money is the priority.** If the dashboard has a hero area, `money.revenueTotal` and `revenueTrend` belong there, not the user counts.

**Buckets are UTC-aligned and always full length.** `points` always has exactly 24 / 7 / 30 entries; empty buckets are `0`, never omitted. Do not write gap handling, and do not write "if points.length < 7 show a placeholder".

**The last bucket is partial.** The window ends at "now", not at a bucket boundary, so the final bucket may hold only a few hours. It will *always* look like a sudden drop. Annotate it as in-progress; do not read it as a decline.

---

## 3. Bucket shape — decide this before building the chart

| `range` | `interval` | Buckets | Window |
|---|---|---|---|
| `day` | `hour` | 24 | last 24 hours |
| `week` (default) | `day` | 7 | last 7 days |
| `month` | `day` | 30 | last 30 days |

`month` is the **last 30 days**, not the calendar month, so the bucket count is stable. Do not label the axis "November" — label it with the actual `from`/`to` dates.

`interval` is **output only**. Never send it; the server derives it so the four series cannot be desynchronised.

**UTC alignment trap:** a `day` bucket starts at 00:00 **UTC**, which is 07:00 in Vietnam. If your users are in Asia/Ho_Chi_Minh, a "daily" bar does not line up with their calendar day. Decide deliberately: show UTC days and say so, or re-bucket client-side into local days (which shifts values across buckets). Do not silently do one and label it the other.

---

## 4. `GET /api/admin/dashboard` — lifetime snapshot

`GET /api/admin/dashboard` · auth `ADMIN` · no query parameters · cached 5 min.

### 4.1 `meta`

```json
"meta": { "generatedAt": "2026-11-20T09:14:03Z", "currency": "VND" }
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `generatedAt` | ISO-8601 timestamp | When the **server** built this payload — not when you requested it. | Your only freshness signal. The response is cached 5 min, so a warm hit can be 5 min old. Render "as of 09:14". Never display the browser clock as the data time. |
| `currency` | string | Currency of every amount in `money`. Always `"VND"`. | Use it to pick the formatter. Do not hardcode `₫`. |

**Scale:** all amounts are **whole dong**. VND has no minor unit, so do not divide by 100. The payment gateway talks in hundredths, the API does not. `revenueTotal: 4900000` is 4,900,000 ₫.

```ts
new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
```

### 4.2 `users`

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `total` | integer | Non-deleted accounts. | Headline "total members". Denominator for `activationRate` and `payerConversionRate`. |
| `emailVerified` | integer | `email_verified = true`. Set once, never reverts. | Trust/health metric. |
| `activatedEver` | integer | Accounts that have ever consumed ≥1 AI request. | **The** activation metric. Not the count whose current status is `activated` — that status is overwritten by suspend/deactivate, so it goes down and is not a growth signal. |
| `suspended` | integer | Currently suspended. | Moderation health. |
| `deactivated` | integer | Currently deactivated (self-service). | Churn signal; compare to `total`. |
| `activationRate` | number 0–1 | `emailVerified / total`, `0` when no accounts. | ×100 for display. Already guards zero — do not re-guard. |

`suspended` and `deactivated` are **current state**, not lifetime counts. A restored user is in neither.

### 4.3 `content`

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `totalPosts` | integer | Lifetime non-deleted posts. | Platform scale. |
| `totalRecipes` | integer | Lifetime non-deleted recipes. | Platform scale. |
| `totalComments` | integer | Lifetime non-deleted comments. | Engagement depth. |

Counts of existing rows, not creations over a period. Deleting content lowers them.

### 4.4 `engagement`

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `totalVotes` | integer | Lifetime votes (`votesUp + votesDown`). | Volume. |
| `votesUp` | integer | Lifetime upvotes. | With `votesDown`, gives sentiment — which a bare total cannot. |
| `votesDown` | integer | Lifetime downvotes. | Sentiment; `votesUp / totalVotes` is a useful ratio. |
| `totalSaves` | integer | `savedPosts + savedRecipes`. | Intent-to-return, stronger than a vote. |
| `savedPosts` | integer | Lifetime post saves. | Which content type people keep. |
| `savedRecipes` | integer | Lifetime recipe saves. | Same. A row saves exactly one of the two, so they sum to `totalSaves` with no overlap. |

### 4.5 `moderationQueue`

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `pendingPosts` | integer | Non-deleted posts with `status = pending`. | Backlog. Same predicate as `GET /api/admin/posts?status=pending`, so the number matches that list. |
| `pendingRecipes` | integer | Recipes with `moderationStatus = PENDING`. | Backlog. |
| `reportedComments` | integer | Non-deleted comments with `reportCount > 0`. | Backlog. |
| `oldestPendingAgeHours` | integer | Age in whole hours of the **single oldest** item across all three queues. `0` when nothing waits. | The most actionable field here. Render as urgency ("oldest waiting 6 days"), not as a count. Three items waiting six days is worse than thirty waiting an hour — this is what tells them apart. |
| `filterSkippedPosts` | integer | Posts with `flag = FILTER_SKIPPED` — the filter never produced a verdict. | Fell through automation, needs a human. Deserves its own warning badge. |

`oldestPendingAgeHours` is a **minimum across all three queues**, deliberately not three separate ages — the admin needs one "how far behind are we" number, not three to compare.

### 4.6 `money` — the headline block

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `revenueTotal` | integer | Sum of `payment_ledger.amount` where `status = succeeded`, whole dong. | The big number. **Gross, not net** — see below. |
| `transactionsTotal` | integer | Count of succeeded payments. | Volume. One member can produce several. |
| `payingUsersTotal` | integer | Distinct members with ≥1 succeeded payment. | Reach of monetisation. |
| `averageOrderValue` | number | `revenueTotal / transactionsTotal`, `0` when nothing succeeded. | Basket size. |
| `arpu` | number | `revenueTotal / payingUsersTotal`, `0` when nobody paid. | **Label it "revenue per paying user", not "ARPU".** It divides by payers, not by all accounts; calling it ARPU overstates the per-member figure by the payer-conversion factor. For true ARPU compute `revenueTotal / users.total` yourself. |
| `freeGrantsTotal` | integer | Acquisitions with `payment_id IS NULL` — allowance handed out free. | Cost the revenue figure does not show. Rising grants with flat revenue = giving away more than you sell. |
| `payerConversionRate` | number 0–1 | `payingUsersTotal / users.total`. | Share of members who ever paid. Bounded by 1 — this is the trustworthy conversion number, unlike the per-bucket one on charts. |
| `pendingStaleCount` | integer | Payments still `pending` >24 h after checkout. | Money that tried and never arrived. Nothing expires or reconciles them, so this pool only grows — treat a rising value as a bug to investigate, not churn. |

**`revenueTotal` is gross.** There is no refund write path anywhere in this backend, so no `refunded` rows exist and nothing is subtracted. Do not label it "net revenue" or "after refunds". If refunds ship later, this field's meaning changes and this guide will be updated with it.

---

## 5. `GET /api/admin/dashboard/charts` — the time-based surface

`GET /api/admin/dashboard/charts?range=day|week|month` · auth `ADMIN` · cached 15 min per range.

### 5.1 Request

| Parameter | Type | Required | Default | Notes |
|---|---|---|---|---|
| `range` | string | no | `week` | Exactly `day`, `week`, `month`. Anything else → `400`. |

`custom` is **removed**. There is no arbitrary from/to. Free windows would need a maximum span, a maximum bucket count, and a caller-chosen bucket size that could desynchronise the four series.

### 5.2 `meta`

```json
"meta": {
  "range": "week", "interval": "day",
  "from": "2026-11-14T00:00:00Z", "to": "2026-11-20T09:14:03Z",
  "boundary": "inclusiveStartExclusiveEnd",
  "currency": "VND",
  "generatedAt": "2026-11-20T09:14:03Z"
}
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `range` | string | The preset you asked for, echoed after validation. | Confirm the server honoured your request instead of trusting local state. |
| `interval` | string | `hour` or `day`, chosen by the server. **Output only.** | Format x-axis ticks: hourly → `HH:mm`, daily → `dd/MM`. |
| `from` | timestamp | Window start, **inclusive**. | Axis lower bound. |
| `to` | timestamp | Window end, **exclusive**. | Axis upper bound, and the freshness signal. |
| `boundary` | string | Always `inclusiveStartExclusiveEnd`. | A bucket at `bucketStart` covers `[bucketStart, bucketStart + interval)`. |
| `currency` | string | Currency of every amount in `revenueTrend` and `revenueByPlan`. Always `"VND"`. | Formatter selection. |
| `generatedAt` | timestamp | When the payload was built. | On this endpoint it is **always equal to `to`** — the window ends at "now", so they are the same instant. Read either; they never disagree. |

### 5.3 `revenueTrend` — money that arrived

```json
"revenueTrend": { "points": [ { "bucketStart": "2026-11-14T00:00:00Z", "amount": 245000, "transactions": 5 } ] }
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `points[].bucketStart` | timestamp | Start of the bucket. | x value. |
| `points[].amount` | integer | Succeeded revenue in the bucket, whole dong. | y value. |
| `points[].transactions` | integer | How many payments produced that amount. | Tooltip: distinguishes one large payment from several ordinary ones. Do not plot on a second y-axis — the units differ. |

**Draw as a line or area**, not bars: continuous quantity.

### 5.4 `revenueByPlan` — which plan earned

```json
"revenueByPlan": { "items": [ { "planId": "…", "code": "PRO", "name": "Pro", "amount": 4900000, "transactions": 100, "active": true } ] }
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `items[].planId` | uuid | Plan identifier. | Row key; join to `GET /api/admin/plans` for more detail. |
| `items[].code` | string | Short code, e.g. `PRO`. | Compact axis label. |
| `items[].name` | string | Display name. | Tooltip / legend. |
| `items[].amount` | integer | What was **actually charged** in the window, whole dong. | Bar length. |
| `items[].transactions` | integer | Payments that produced it. | Tooltip. |
| `items[].active` | boolean | The plan's **current** catalogue state. | Dim or badge inactive plans. A plan deactivated *after* earning still appears — deliberate, so historical revenue does not vanish. Do not filter out `active: false`. |

Already sorted by `amount` descending. `amount` comes from the ledger, never catalogue price × count, so a price change does not rewrite past revenue.

**Draw as horizontal bars** — few named categories, one measure; a pie/donut cannot compare them honestly.

**Caveat:** this series joins `payment_ledger → ai_subscription → ai_plan`, so a succeeded payment with no acquisition row cannot appear. Do **not** assert `sum(items.amount) === sum(revenueTrend.points.amount)` in a test or a client-side check — same window, but this one has an extra join.

### 5.5 `paymentHealth` — money that did not arrive

```json
"paymentHealth": {
  "points": [ { "bucketStart": "…", "succeeded": 12, "failed": 3, "pendingFresh": 1, "pendingStale": 2 } ],
  "totals": { "succeeded": 40, "failed": 8, "pendingFresh": 2, "pendingStale": 6, "successRate": 0.8333 }
}
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `points[].succeeded` | integer | Landed, bucketed by `paid_at`. | Stack segment. |
| `points[].failed` | integer | Failed, bucketed by `updated_at`. | Stack segment. |
| `points[].pendingFresh` | integer | Still pending, created <24 h ago. | Stack segment — normal, in-flight. |
| `points[].pendingStale` | integer | Still pending, created >24 h ago. | Stack segment — the worrying one. |
| `totals.succeeded` | integer | Window total succeeded. | Header stat. |
| `totals.failed` | integer | Window total failed. | Header stat. |
| `totals.pendingFresh` | integer | Window total fresh pending. | Header stat. |
| `totals.pendingStale` | integer | Window total stale pending. | Header stat. |
| `totals.successRate` | number 0–1 | `succeeded / (succeeded + failed)`. Pending **excluded** from the denominator. | Health headline. Label it "of decided payments" — in-flight attempts count neither way. |

The four values **partition** the attempts that started in the bucket, which is what makes a stacked bar honest — the segments sum to a real quantity. Draw worst-on-top (succeeded, fresh pending, failed, stale pending) so the eye lands on the problem without reading the legend.

Two things to know:

- **`totals` is not the sum of `points`.** Totals are computed from raw rows, not merged buckets, so a row whose bucket fell outside the series is still counted. Use `totals`; do not recompute it by summing `points`.
- **`failed` is a proxy.** The ledger has no `failed_at`, so failures bucket by `updated_at` (last write). Close to the decision time, not exact. If your tooltip says "failed at", soften it to "failed around".

### 5.6 `growth` — acquisition vs first-time monetisation

```json
"growth": { "points": [ { "bucketStart": "…", "newUsers": 40, "newPayingUsers": 3 } ] }
```

| Field | Type | What it means | How to use it |
|---|---|---|---|
| `points[].bucketStart` | timestamp | Start of the bucket. | x value. |
| `points[].newUsers` | integer | Non-deleted accounts created in the bucket. | Bars. |
| `points[].newPayingUsers` | integer | Distinct members whose **first** succeeded payment landed in the bucket. | Line. A repeat buyer appears once — in the bucket where they converted — not in every bucket they pay in. |

There is **no `conversionRate` field** on this series, and there will not be one in this shape — do not
compute it client-side either:

> The two counts cover **different populations**. A member who registered three months ago and pays
> today is a first-time payer *today*, but is not a new user *today*. Dividing one by the other is
> not a conversion rate, and it could exceed 1 — five signups with eight dormant members converting
> would report 160%.
>
> For a conversion number use `money.payerConversionRate` from the summary
> (`payingUsersTotal / users.total`). It is lifetime and bounded by 1, so it is safe to display.

Both series count people, so one shared axis is legitimate. Draw `newUsers` as bars and
`newPayingUsers` as a line on the same scale. Reading them together answers the real question: if
the line tracks the bars, acquisition is feeding monetisation; if the bars rise and the line stays
flat, you are acquiring non-payers.

---

## 6. How the numbers are computed (for triage)

Useful when a number looks wrong and you need to know whether it is a frontend or backend bug.

- **Window is half-open, `[from, to)`.** A row written exactly on a boundary belongs to the later window only, so adjacent windows never double-count.
- **Window start is aligned to a bucket boundary** — that is why the count is exactly 24 / 7 / 30. Subtracting a raw duration from "now" would land mid-bucket and produce an extra point.
- **Zero-filling:** every bucket is emitted even with no rows, so a quiet period is `0`, not a gap.
- **Revenue** = `sum(amount)` where `status = 'succeeded'`, bucketed by `paid_at`.
- **Rates** return `0` rather than `null` or `NaN` when the denominator is zero. You never have to guard a division.
- **Summary = lifetime/current state; charts = window-scoped.** No overlap between the two payloads.

---

## 7. Caching and freshness

| Endpoint | TTL | Cache key |
|---|---|---|
| `/api/admin/dashboard` | 5 min | none — **all admins share one entry** |
| `/api/admin/dashboard/charts` | 15 min | `range` — each preset cached separately |

- The summary can be up to 5 min stale, charts up to 15. Show `meta.generatedAt`; do not claim live data.
- A refresh button does not guarantee fresh data — it may return the cached entry. A hard refresh needs a backend change; do not paper over it with a client timer that re-fetches and shows a new "updated at" from the browser clock.
- Ranges are cached independently, so `week → month` may be a miss (runs the bucketed queries) while switching back is a hit (instant). The latency difference is not an error.
- Two admins can see different `generatedAt` for the summary if one hit before expiry and one after.

---

## 8. Rendering recipes

| Block | Chart | Why |
|---|---|---|
| `revenueTrend` | line / area | Continuous quantity over time |
| `revenueByPlan` | horizontal bars, sorted desc | Few named categories, one measure; a donut cannot compare them |
| `paymentHealth` | stacked bar, worst-on-top | The four values partition a real total |
| `growth` | bars (`newUsers`) + line (`newPayingUsers`), one axis | Both count people |

---

## 9. Traps, in order of likelihood of biting you

1. **The last bucket is partial.** Ends at "now", not a bucket boundary. Always looks like a drop. Annotate it. This is the single most likely source of a false "revenue is crashing" alarm.
2. **Amounts are whole dong.** Never divide by 100.
3. **`arpu` divides by payers, not all users.** Label it "per paying user".
4. **`revenueTotal` is gross.** No refund path exists; nothing is netted off.
5. **`paymentHealth.totals` ≠ sum of `points`.** Use `totals`.
6. **`growth` has no conversion rate.** The two counts are different populations, so no ratio is derived. Use `money.payerConversionRate` for conversion. See §5.6.
7. **UTC buckets ≠ a Vietnam calendar day.** Decide and label it.
8. **Content-over-time and engagement-over-time are gone.** Not among the four charts; needs a follow-up endpoint if the tiles mattered.
9. **`range` is a closed set.** `custom` or a date returns `400`, not a fallback.
10. **Bucket arrays are always full length.** No gap handling needed.

---

## 10. TypeScript types

```ts
type Iso = string;

// ---------- GET /api/admin/dashboard ----------
export interface DashboardMeta {
  generatedAt: Iso;
  currency: string; // "VND"
}

export interface DashboardUsers {
  total: number;
  emailVerified: number;
  activatedEver: number;
  suspended: number;
  deactivated: number;
  activationRate: number; // 0..1
}

export interface DashboardContent {
  totalPosts: number;
  totalRecipes: number;
  totalComments: number;
}

export interface DashboardEngagement {
  totalVotes: number;
  votesUp: number;
  votesDown: number;
  totalSaves: number;
  savedPosts: number;
  savedRecipes: number;
}

export interface DashboardModerationQueue {
  pendingPosts: number;
  pendingRecipes: number;
  reportedComments: number;
  oldestPendingAgeHours: number;
  filterSkippedPosts: number;
}

export interface DashboardMoney {
  revenueTotal: number;        // whole VND, gross
  transactionsTotal: number;
  payingUsersTotal: number;
  averageOrderValue: number;
  arpu: number;                // per PAYING user, not per member
  freeGrantsTotal: number;
  payerConversionRate: number; // 0..1
  pendingStaleCount: number;
}

export interface DashboardResponse {
  meta: DashboardMeta;
  users: DashboardUsers;
  content: DashboardContent;
  engagement: DashboardEngagement;
  moderationQueue: DashboardModerationQueue;
  money: DashboardMoney;
}

// ---------- GET /api/admin/dashboard/charts ----------
export type DashboardRange = 'day' | 'week' | 'month';
export type DashboardInterval = 'hour' | 'day';

export interface DashboardChartsMeta {
  range: DashboardRange;
  interval: DashboardInterval;
  from: Iso;
  to: Iso;
  boundary: 'inclusiveStartExclusiveEnd';
  currency: string; // "VND"
  generatedAt: Iso;
}

export interface RevenueTrendPoint {
  bucketStart: Iso;
  amount: number;       // whole VND
  transactions: number;
}

export interface RevenueByPlanItem {
  planId: string;
  code: string;
  name: string;
  amount: number;       // whole VND
  transactions: number;
  active: boolean;      // current catalogue state, not window state
}

export interface PaymentHealthPoint {
  bucketStart: Iso;
  succeeded: number;
  failed: number;
  pendingFresh: number;
  pendingStale: number;
}

export interface PaymentHealthTotals {
  succeeded: number;
  failed: number;
  pendingFresh: number;
  pendingStale: number;
  successRate: number; // 0..1, pending excluded from denominator
}

export interface GrowthPoint {
  bucketStart: Iso;
  newUsers: number;
  newPayingUsers: number; // first-time payers in bucket; no ratio is derived
}

export interface DashboardChartsResponse {
  meta: DashboardChartsMeta;
  revenueTrend: { points: RevenueTrendPoint[] };
  revenueByPlan: { items: RevenueByPlanItem[] };
  paymentHealth: { points: PaymentHealthPoint[]; totals: PaymentHealthTotals };
  growth: { points: GrowthPoint[] };
}
```

---

## 11. Migration checklist

- [ ] Remove `range` from the summary request; it is ignored now.
- [ ] Delete reads of `alerts`, `breakdowns`, `tables`, `users.newInRange`, `users.activeInRange`, `content.new*`, `engagement.*InRange`.
- [ ] Move every `InRange` tile to charts, or drop it (§1).
- [ ] Point the money UI at `money` (summary) and `revenueTrend` (charts).
- [ ] Read `meta.currency` instead of hardcoding `₫`.
- [ ] Remove any `/100` on money amounts.
- [ ] Relabel `arpu` → "revenue per paying user".
- [ ] Relabel `revenueTotal` as gross (or just "revenue").
- [ ] Mark the last chart bucket as in-progress.
- [ ] Show `meta.generatedAt` as the data timestamp, not the browser clock.
- [ ] Handle `400` for an unsupported `range`.
- [ ] Do not expect a conversion rate on `growth`; use `money.payerConversionRate` for that.
- [ ] Confirm the UTC-vs-local bucket decision with design.
