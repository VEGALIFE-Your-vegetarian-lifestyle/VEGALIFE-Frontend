import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiConversation, getAiConversations, sendAiMessage } from "@/services/aiService";
import type { AiConversationDetail, AiMessageRole } from "@/types/ai";

export interface AiChatMessage {
    /** id phía client — backend không trả id cho từng message. */
    id: string;
    role: AiMessageRole;
    content: string;
    createdAt: string;
}

const CONVERSATIONS_KEY = ["ai-conversations"] as const;
const conversationKey = (id: string) => ["ai-conversation", id] as const;

/** #47 validation: `message` 1..4000 ký tự. Hook chặn, UI dùng để đếm ký tự. */
export const MAX_MESSAGE_LENGTH = 4000;

/** Message `system` là prompt nội bộ của backend — không render ra chat. */
function toChatMessages(detail: AiConversationDetail): AiChatMessage[] {
    return detail.messages
        .filter((message) => message.role !== "system")
        .map((message, index) => ({ id: `s-${index}`, ...message }));
}

/**
 * Trạng thái chat + danh sách hội thoại (nhóm 24).
 *
 * Tin nhắn hiển thị = history tải từ server + `pending` (tin vừa gửi/nhận trong
 * phiên). Hai nguồn tách rời nhau nên không cần đồng bộ state trong `useEffect`:
 *
 * - `activeId` — id dùng cho lần gửi kế tiếp (`null` = tạo hội thoại mới).
 * - `historyId` — id hội thoại đang hiển thị history. Chỉ đổi khi người dùng bấm
 *   chọn hội thoại, nên gửi tin xong **không** refetch và không nhân đôi tin.
 */
export function useAiChat() {
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [historyId, setHistoryId] = useState<string | null>(null);
    const [pending, setPending] = useState<AiChatMessage[]>([]);
    // Đếm id client — không dùng Date.now() vì react-hooks/purity chặn hàm không thuần.
    const seq = useRef(0);
    // Chặn gửi trùng: `isPending` chỉ đổi sau khi re-render, nên hai lần gọi trong
    // cùng một tick (Enter + click) vẫn lọt qua nếu chỉ kiểm tra cờ đó.
    const sendingRef = useRef(false);

    const conversations = useQuery({
        queryKey: CONVERSATIONS_KEY,
        queryFn: getAiConversations,
    });

    const detail = useQuery({
        queryKey: conversationKey(historyId ?? ""),
        queryFn: () => getAiConversation(historyId as string),
        enabled: !!historyId,
        // Focus lại tab không được refetch: server đã có cặp hỏi/đáp vừa gửi còn
        // `pending` cũng đang giữ chúng, refetch sẽ hiển thị trùng hai lần.
        refetchOnWindowFocus: false,
    });

    const history = useMemo(() => (detail.data ? toChatMessages(detail.data) : []), [detail.data]);
    const messages = useMemo(() => [...history, ...pending], [history, pending]);

    const sendMutation = useMutation({
        mutationFn: (text: string) => sendAiMessage({ conversationId: activeId ?? undefined, message: text }),
        onSuccess: (data) => {
            setActiveId(data.conversationId);
            setPending((prev) => [
                ...prev,
                { id: `a-${++seq.current}`, role: "assistant", content: data.reply, createdAt: new Date().toISOString() },
            ]);
            // Danh sách hội thoại đổi (tiêu đề, thứ tự) và hạn mức vừa tăng.
            // KHÔNG refetch `detail`: `pending` đã có đủ cặp hỏi/đáp vừa rồi, refetch
            // sẽ trả về cả hai và nhân đôi tin nhắn.
            void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
            void queryClient.invalidateQueries({ queryKey: ["ai-subscription"] });
        },
        onSettled: () => {
            sendingRef.current = false;
        },
    });

    /** Trả về `false` nếu bị chặn (rỗng, quá dài, hoặc đang gửi) — chống gửi trùng. */
    const send = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH || sendingRef.current) return false;

            sendingRef.current = true;
            setPending((prev) => [
                ...prev,
                { id: `u-${++seq.current}`, role: "user", content: trimmed, createdAt: new Date().toISOString() },
            ]);
            sendMutation.mutate(trimmed);
            return true;
        },
        [sendMutation],
    );

    const startNewConversation = useCallback(() => {
        // Đang gửi thì bỏ qua: `onSuccess` sắp `setActiveId(data.conversationId)`,
        // nên đổi hội thoại lúc này sẽ để lại tin trả lời mồ côi không có câu hỏi.
        if (sendingRef.current) return;
        setActiveId(null);
        setHistoryId(null);
        setPending([]);
        sendMutation.reset();
    }, [sendMutation]);

    const selectConversation = useCallback(
        (id: string) => {
            if (sendingRef.current) return;
            setActiveId(id);
            setHistoryId(id);
            setPending([]);
            sendMutation.reset();
            // Chọn lại chính hội thoại đang mở sau khi đã gửi tin: cache `detail` cũ
            // hơn server nên phải đọc lại, nếu không sẽ thiếu cặp hỏi/đáp vừa gửi.
            void queryClient.invalidateQueries({ queryKey: conversationKey(id) });
        },
        [queryClient, sendMutation],
    );

    return {
        conversations,
        detail,
        activeId,
        selectConversation,
        startNewConversation,
        messages,
        send,
        isSending: sendMutation.isPending,
        sendError: sendMutation.error,
    };
}
