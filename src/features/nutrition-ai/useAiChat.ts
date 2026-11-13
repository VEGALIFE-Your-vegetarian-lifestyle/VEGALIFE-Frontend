import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAiConversation, getAiConversations, sendAiMessage } from "./api";
import { isTimeoutError } from "@/shared/utils/apiError";
import { MAX_MESSAGE_LENGTH, type AiUsage } from "./types";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: string;
}

/** Kiểu trả về của `useAiChat` — component nhận qua props mà không cần import hook. */
export type AiChat = ReturnType<typeof useAiChat>;

const CONVERSATIONS_KEY = ["ai", "conversations"] as const;

/**
 * Trạng thái khung chat AI.
 *
 * Hai id tách đôi có chủ ý:
 * - `activeId` — gửi vào hội thoại nào ở lần kế tiếp.
 * - `historyId` — hội thoại đang mở để đọc từ server.
 * Gửi xong KHÔNG set `historyId`, vì `local` đã giữ cặp hỏi/đáp; refetch detail
 * lúc đó sẽ render trùng cả hai.
 */
export function useAiChat(enabled = true) {
    const queryClient = useQueryClient();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [historyId, setHistoryId] = useState<string | null>(null);
    const [local, setLocal] = useState<ChatMessage[]>([]);
    const [pendingText, setPendingText] = useState<string | null>(null);
    const [usage, setUsage] = useState<AiUsage | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [failedText, setFailedText] = useState<string | null>(null);
    const [timedOut, setTimedOut] = useState(false);

    // `isPending` chỉ đổi sau re-render → Enter + click trong cùng một tick vẫn lọt.
    const sendingRef = useRef(false);
    const seq = useRef(0);

    const conversations = useQuery({
        queryKey: CONVERSATIONS_KEY,
        queryFn: getAiConversations,
        enabled,
    });

    const history = useQuery({
        queryKey: ["ai", "conversation", historyId],
        queryFn: () => getAiConversation(historyId as string),
        enabled: enabled && !!historyId,
    });

    const { mutateAsync } = useMutation({ mutationFn: sendAiMessage });

    const send = useCallback(
        async (raw: string): Promise<boolean> => {
            const text = raw.trim();
            if (!text || text.length > MAX_MESSAGE_LENGTH) return false;
            if (sendingRef.current) return false;

            sendingRef.current = true;
            setError(null);
            setFailedText(null);
            setTimedOut(false);
            setPendingText(text);

            try {
                const data = await mutateAsync({ conversationId: activeId ?? undefined, message: text });
                const at = new Date().toISOString();
                setLocal((prev) => [
                    ...prev,
                    { id: `u-${++seq.current}`, role: "user", text, createdAt: at },
                    { id: `a-${++seq.current}`, role: "assistant", text: data.reply, createdAt: at },
                ]);
                setActiveId(data.conversationId);
                setUsage(data.usage);
                void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
                void queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
                return true;
            } catch (err) {
                // Timeout = client tự cắt, KHÔNG phải server báo lỗi. Backend vẫn chạy tiếp và
                // thường đã tạo xong thực đơn → đọc lại thay vì khẳng định thất bại (F5 mới thấy
                // menu là triệu chứng của việc thiếu bước này).
                if (isTimeoutError(err)) {
                    setTimedOut(true);
                    void queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
                    void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
                    void queryClient.invalidateQueries({ queryKey: ["subscription", "me"] });
                    // Trả `true` để ChatPanel KHÔNG đẩy lại câu hỏi vào ô nhập — gửi lại lúc này
                    // là cách tạo thực đơn thứ hai (BE không có idempotency key).
                    // ponytail: hội thoại mới chưa biết id nên `activeId` vẫn null; sidebar vừa
                    // invalidate sẽ có nó. Nâng lên idempotency key khi cần chặn trùng tận gốc.
                    return true;
                }
                // Giữ câu hỏi để gửi lại; BR-CHATBOT-003: không bịa câu trả lời.
                setFailedText(text);
                setError(err);
                // 404 = hội thoại không còn (id lạ hoặc của member khác) → quay về hội thoại mới.
                if ((err as { response?: { status?: number } }).response?.status === 404) {
                    setActiveId(null);
                    setHistoryId(null);
                    setLocal([]);
                }
                return false;
            } finally {
                sendingRef.current = false;
                setPendingText(null);
            }
        },
        [activeId, mutateAsync, queryClient],
    );

    const selectConversation = useCallback((id: string) => {
        if (sendingRef.current) return; // đổi giữa lúc gửi sẽ để lại tin trả lời mồ côi
        setActiveId(id);
        setHistoryId(id);
        setLocal([]);
        setError(null);
        setFailedText(null);
        setTimedOut(false);
    }, []);

    const newConversation = useCallback(() => {
        if (sendingRef.current) return;
        setActiveId(null);
        setHistoryId(null);
        setLocal([]);
        setError(null);
        setFailedText(null);
        setTimedOut(false);
    }, []);

    const retry = useCallback(() => {
        if (failedText) void send(failedText);
    }, [failedText, send]);

    const messages = useMemo<ChatMessage[]>(() => {
        const fromServer = (history.data?.messages ?? [])
            .filter((m) => m.role !== "system")
            .map((m, i) => ({
                id: `h-${i}`,
                role: m.role as ChatMessage["role"],
                text: m.content,
                createdAt: m.createdAt,
            }));
        return [...fromServer, ...local];
    }, [history.data, local]);

    return {
        conversations: conversations.data ?? [],
        conversationsLoading: conversations.isLoading,
        messages,
        historyLoading: history.isLoading,
        isSending: pendingText !== null,
        pendingText,
        usage,
        error,
        failedText,
        timedOut,
        send,
        retry,
        selectConversation,
        newConversation,
    };
}
