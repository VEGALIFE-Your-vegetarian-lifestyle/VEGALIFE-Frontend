import { api } from "@/services/api";
import type { ApiResponse } from "@/types/common";
import type {
    AiConversationDetail,
    AiConversationSummary,
    AiSendMessageRequest,
    AiSendMessageResponse,
} from "@/types/ai";

/** POST /api/ai/messages — `conversationId` bỏ trống thì backend tạo hội thoại mới. */
export async function sendAiMessage(request: AiSendMessageRequest): Promise<AiSendMessageResponse> {
    const { data } = await api.post<ApiResponse<AiSendMessageResponse>>("/api/ai/messages", request);
    return data.data;
}

/** GET /api/ai/conversations — backend đã sắp `updatedAt` giảm dần, trả plain array. */
export async function getAiConversations(): Promise<AiConversationSummary[]> {
    const { data } = await api.get<ApiResponse<AiConversationSummary[]>>("/api/ai/conversations");
    return data.data;
}

/** GET /api/ai/conversations/{id} — messages sắp cũ → mới, có thể chứa role "system". */
export async function getAiConversation(id: string): Promise<AiConversationDetail> {
    const { data } = await api.get<ApiResponse<AiConversationDetail>>(`/api/ai/conversations/${id}`);
    return data.data;
}

// ponytail: chưa dùng POST /api/ai/messages/stream (#48) — cần fetch + getReader và tự
// xử lý 401/refresh vì không đi qua interceptor axios. Thêm khi cần hiệu ứng gõ chữ.
