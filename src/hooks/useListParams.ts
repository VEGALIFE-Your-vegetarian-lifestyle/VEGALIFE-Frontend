import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";

// Trang + bộ lọc trạng thái nằm trên URL; ô tìm kiếm debounce 300ms rồi mới gọi query
export function useListParams() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [q, setQ] = useState("");
    const debouncedQ = useDebounce(q, 300);

    const page = Number(searchParams.get("page")) || 1;
    const status = searchParams.get("status") ?? "";

    const updateParams = (changes: Record<string, string>) => {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        setSearchParams(next, { replace: true });
    };

    return {
        page,
        q,
        status,
        debouncedQ,
        setQ: (value: string) => {
            setQ(value);
            updateParams({ page: "" });
        },
        setStatus: (value: string) => updateParams({ status: value, page: "" }),
        setPage: (value: number) => updateParams({ page: String(value) }),
        clearFilters: () => {
            setQ("");
            setSearchParams({}, { replace: true });
        },
    };
}