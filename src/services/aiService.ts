import { api } from "@/services/api";
import type { ApiResponse } from "@/types/common";
import type {
    AiConversationDetail,
    AiConversationSummary,
    AiMessageRequest,
    AiMessageResponse,
} from "@/types/ai";

/**
 * Nhóm 24 — AI Chatbot. Endpoint #47, #49, #50 trong `DOCS/API-REFERENCE.md`.
 *
 * ponytail: chưa nối #48 `POST /api/ai/messages/stream` (SSE). `EventSource` không
 * dùng được (chỉ GET, không gắn được header Authorization), phải tự viết
 * `fetch` + `body.getReader()` + `TextDecoder` — và đường đó **không** đi qua
 * interceptor 401/refresh của `api.ts`, nên phải tự xử lý hết 401/404/429.
 * Thêm khi cần hiệu ứng gõ chữ: viết `streamAiMessage()` cùng file này, đọc
 * `event: delta|done|error`, nhớ refresh token thủ công trước khi gọi.
 */

/** #47 — gửi tin nhắn, chờ trả lời trọn vẹn. */
export async function sendAiMessage(request: AiMessageRequest): Promise<AiMessageResponse> {
    const response = await api.post<ApiResponse<AiMessageResponse>>("/api/ai/messages", request);
    return response.data.data;
}

/** #49 — hội thoại của chính mình, backend đã sắp `updatedAt` giảm dần. */
export async function getAiConversations(): Promise<AiConversationSummary[]> {
    const response = await api.get<ApiResponse<AiConversationSummary[]>>("/api/ai/conversations");
    return response.data.data;
}

/** #50 — history đầy đủ của một hội thoại (cũ → mới). 404 nếu không sở hữu. */
export async function getAiConversation(id: string): Promise<AiConversationDetail> {
    const response = await api.get<ApiResponse<AiConversationDetail>>(`/api/ai/conversations/${id}`);
    return response.data.data;
}
