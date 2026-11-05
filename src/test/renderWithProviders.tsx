import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/**
 * QueryClient riêng cho mỗi test — tắt retry để lỗi hiện ngay thay vì chờ backoff.
 */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0, staleTime: 0, refetchOnWindowFocus: false },
            mutations: { retry: false },
        },
    });
}

interface RenderOptions {
    /** Route khởi đầu. Mặc định "/". */
    route?: string;
    /** Khai báo path có tham số, ví dụ "/posts/:id". */
    path?: string;
    queryClient?: QueryClient;
}

/** Render một component trong Router + QueryClientProvider. */
export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
    const { route = "/", path, queryClient = createTestQueryClient() } = options;

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>
                {path ? (
                    <Routes>
                        <Route path={path} element={ui} />
                    </Routes>
                ) : (
                    ui
                )}
            </MemoryRouter>
        </QueryClientProvider>,
    );
}
