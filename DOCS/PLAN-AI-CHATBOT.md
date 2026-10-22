# Plan — AI Nutrition Chatbot (FR-10)

> Trạng thái: **đang thực hiện** — BE đã xong #47–#55, đã nối API.
> Ngày lập: 2026-10-22 · Cập nhật: 2026-10-22 · Branch: `feat/ai-chatbot`

## 1. Mục tiêu

Thay phần trả lời tĩnh ở `/ai-nutrition` bằng chatbot thật: gửi câu hỏi, nhận trả lời,
lưu và xem lại lịch sử hội thoại, hiển thị hạn mức còn lại.

**Phạm vi**: 4 endpoint nhóm 24 (#47, #49, #50) + 1 endpoint nhóm 25 (#52).

**Ngoài phạm vi**: SSE stream (#48), mua/hủy gói (#51, #53–#55), trang pricing.

## 2. Hiện trạng

| Thứ | Trạng thái |
|---|---|
| Backend #47–#55 | ✅ **`done`** trên `API Documentation` (đã xác nhận) |
| `types/ai.ts` | ✅ xong |
| `services/aiService.ts`, `services/subscriptionService.ts` | ✅ xong |
| `hooks/useAiChat.ts`, `hooks/useSubscription.ts` | ✅ xong |
| `pages/AiNutritionPage/ChatPanel.tsx` | ✅ tách xong, nối `useAiChat` |
| `pages/AiNutritionPage/AiNutritionPage.tsx` | ✅ bỏ `send()` tĩnh; header + lịch sử + BMI + swaps + quota |
| i18n `aiNutrition` (en + vi) | ✅ thêm 10 key `chat.*`, sửa 2 key `access.*` |
| `DOCS/API-COVERAGE.md` §24–25 | ⬜ còn ghi ❌ — cập nhật ở bước 7 |
| `DOCS/SRS.md` FR-10 | ⬜ còn 🟡 — cập nhật ở bước 7 |
| Test | ⬜ chưa viết |

## 3. Quyết định đã chốt

### 3.1 Backend

Không cần bước gọi thử nữa — tài liệu API đánh dấu `done` cho #47–#55.

### 3.2 Guest

Mọi endpoint AI đều yêu cầu JWT (`401`). Theo **BR-CHATBOT-002**: guest thấy UI nhưng
ô nhập thay bằng nút "Đăng nhập để hỏi trợ lý dinh dưỡng" → `/login`.
Không tự chế quota guest ở client (sửa `localStorage` là bypass được).

### 3.3 Lịch sử hội thoại

**Không** thêm route riêng. Danh sách nằm trong sidebar của `/ai-nutrition`.

## 4. Thiết kế

### 4.1 File

```text
src/types/ai.ts                  AiUsage, AiConversationSummary/Detail, AiMessage,
                                 AiSendMessageRequest/Response, AiPlan, AiSubscription,
                                 MAX_MESSAGE_LENGTH = 4000
src/services/aiService.ts        #47 sendAiMessage, #49 getAiConversations, #50 getAiConversation
src/services/subscriptionService.ts   #52 getMySubscription
src/hooks/useAiChat.ts           state chat + query hội thoại + mutation gửi
src/hooks/useSubscription.ts     useQuery gói hiện tại
src/pages/AiNutritionPage/ChatPanel.tsx   khung chat + ô nhập + đếm ký tự + banner lỗi
```

`AiNutritionPage.tsx` giữ: header, sidebar (lịch sử hội thoại, BMI tool, swaps, access policy).

**Không** tách `ConversationSidebar` / `QuotaCard` thành file riêng: mỗi khối ~30 dòng,
tách ra chỉ thêm import. Tách khi sidebar phải tái dùng ở route khác.

### 4.2 Hợp đồng API

```ts
// #47 — conversationId bỏ trống = tạo hội thoại mới
POST /api/ai/messages  { conversationId?, message: 1..4000 }
→ { conversationId, reply, usage: { used, limit, windowStart, windowEnd } }
// 400 validation · 401 · 404 hội thoại không thuộc mình · 429 hết hạn mức (+ Retry-After) · 502 provider lỗi

// #49 — backend đã sắp updatedAt giảm dần, trả plain array (không phải PageResponse)
GET /api/ai/conversations → [{ id, title, updatedAt }]

// #50 — messages sắp cũ → mới, có thể chứa role "system" (ẩn khi render)
GET /api/ai/conversations/{id} → { id, title, updatedAt, messages: [{ role, content, createdAt }] }

// #52
GET /api/subscriptions/me → { tier, status, renewalDate, usage, currentPlan, latestPayment }
```

`AiUsage` khai báo cả `windowStart/End` (#47) lẫn `periodStart/End` (#52) là optional —
cùng khái niệm, hai endpoint đặt tên khác nhau; chỗ đọc tự chọn field có mặt.

### 4.3 Luồng trạng thái trong `useAiChat`

- `activeId` — id dùng cho lần gửi kế tiếp; `historyId` — id đang hiển thị history.
  Tách đôi để gửi xong **không** refetch `detail` (refetch sẽ nhân đôi tin nhắn vì
  `local` đã giữ cặp hỏi/đáp).
- `sendingRef` — chặn Enter + click trong cùng một tick (`isPending` chỉ đổi sau re-render).
- Lọc bỏ `role === "system"` khỏi history.
- `MAX_MESSAGE_LENGTH = 4000` khớp validation backend.
- 404 → reset `activeId`/`historyId`/`local` về hội thoại mới.

### 4.4 Xử lý lỗi

| Mã | UI |
|---|---|
| 429 | Banner trong khung chat: hết hạn mức + ngày reset (từ `usage.windowEnd`) |
| 502 / 500 | Banner lỗi, giữ câu hỏi + nút "Thử lại". BR-CHATBOT-003: **không** hiện trả lời giả |
| 404 | Banner lỗi, reset về hội thoại mới |
| 400 | Không xảy ra nếu client chặn đúng 1..4000 |

Dùng `getApiErrorMessage(error, t("chat.error"))` sẵn có.

### 4.5 i18n

Đã thêm vào `en` + `vi` của namespace `aiNutrition`:

```json
"chat": { "retry", "historyTitle", "newChat", "emptyHistory", "untitledConversation",
          "loadingHistory", "charCount": "{{count}}/{{max}}", "quotaLeft",
          "quotaExhausted", "loginRequired" }
```

Sửa `access.guestInquiries` → "Hạn mức tháng:", `access.guestLimit` → "Cần đăng nhập".

## 5. Thứ tự thực hiện

| # | Việc | Kiểm chứng | |
|---|---|---|---|
| 1 | `types/ai.ts` | `npm run typecheck` | ✅ |
| 2 | `aiService.ts` + `subscriptionService.ts` | — | ✅ |
| 3 | `useAiChat.ts` + `useSubscription.ts` | — | ✅ |
| 4 | Tách `ChatPanel` khỏi `AiNutritionPage` | `npm run typecheck` | ✅ |
| 5 | Ghép vào page, chặn guest theo 3.2, quota từ `useSubscription` | `npm run dev` | ✅ |
| 6 | i18n en + vi | đổi ngôn ngữ, không thấy key thô | ✅ |
| 7 | Test: `useAiChat` (chặn gửi trùng, không nhân đôi tin), `aiService` | `npm test` | ⬜ |
| 8 | Cập nhật `DOCS/API-COVERAGE.md` §24–25, `DOCS/SRS.md` FR-10 | — | ⬜ |
| 9 | Commit + PR | theo `CONTRIBUTING.md` | ⬜ |

## 6. Test

- `src/services/__tests__/aiService.test.ts` — mock `api`, kiểm tra unwrap `data`, đúng path.
- `src/hooks/__tests__/useAiChat.test.tsx` — gửi 2 lần liên tiếp trong một tick chỉ tạo
  1 request; gửi xong không gọi lại `getAiConversation`; message > 4000 bị chặn.
- Không test screen đầy đủ: page phụ thuộc auth + nhiều query, chi phí cao hơn giá trị.

## 7. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Backend Render free tier cold start ~30s | Loading state rõ ràng, không timeout ở client |
| 429 giữa phiên | Giữ tin nhắn đã gõ, không xóa `draft` khi lỗi |
| `usage` hai shape (`window*` vs `period*`) | Một interface optional, đọc field có mặt |
| Hội thoại của member khác trả 404 (không phân biệt được) | Coi như không tồn tại, reset về hội thoại mới |

## 8. Không làm (ghi rõ để reviewer khỏi hỏi)

- SSE stream (#48) — cần `fetch` + `getReader()`, tự xử lý 401/refresh vì không đi qua
  interceptor. Làm khi cần hiệu ứng gõ chữ. Đã ghi `ponytail:` trong `aiService.ts`.
- Quota guest phía client — không an toàn, xem 3.2.
- Trang pricing / mua gói (#51, #53–#55) — feature riêng.
- Export log chat — nút đã bỏ khỏi UI (backend chưa có endpoint).
