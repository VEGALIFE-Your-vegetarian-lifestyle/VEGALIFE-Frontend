import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createMenu,
    getMenuDetails,
    getMenus,
    updateMenu,
    updateMenuStatus,
} from "@/services/menuService";
import type { CreateMenuRequest, MenuStatusRequest, UpdateMenuRequest } from "@/types/menu";

const MENUS_KEY = ["menus"] as const;
const menuDetailsKey = (menuId: string) => ["menu-details", menuId] as const;

/** #60 — danh sách tuần. `page` 0-based theo spec. */
export function useMenus(params: { page?: number; size?: number } = {}) {
    return useQuery({
        queryKey: [...MENUS_KEY, params],
        queryFn: () => getMenus(params),
    });
}

/**
 * #61 — chi tiết một tuần. `menuId` null thì không gọi.
 * Endpoint trả **mảng phẳng** (có `menuId` thì đúng 1 phần tử) — bóc ở đây để
 * nơi dùng nhận thẳng `MenuDetail`.
 */
export function useMenuDetails(menuId: string | null) {
    return useQuery({
        queryKey: menuDetailsKey(menuId ?? ""),
        queryFn: async () => {
            const menus = await getMenuDetails({ menuId: menuId as string });
            return menus[0] ?? null;
        },
        enabled: !!menuId,
    });
}

/** Sau mọi mutation: danh sách đổi `updatedAt`/thứ tự, chi tiết có thể đã thay meals. */
function useInvalidateMenus() {
    const queryClient = useQueryClient();
    return (menuId?: string) => {
        void queryClient.invalidateQueries({ queryKey: MENUS_KEY });
        if (menuId) void queryClient.invalidateQueries({ queryKey: menuDetailsKey(menuId) });
    };
}

export function useCreateMenu() {
    const invalidate = useInvalidateMenus();
    return useMutation({
        mutationFn: (request: CreateMenuRequest) => createMenu(request),
        onSuccess: (data) => invalidate(data.id),
    });
}

export function useUpdateMenu(menuId: string) {
    const invalidate = useInvalidateMenus();
    return useMutation({
        mutationFn: (request: UpdateMenuRequest) => updateMenu(menuId, request),
        onSuccess: () => invalidate(menuId),
    });
}

export function useUpdateMenuStatus() {
    const invalidate = useInvalidateMenus();
    return useMutation({
        mutationFn: ({ menuId, request }: { menuId: string; request: MenuStatusRequest }) =>
            updateMenuStatus(menuId, request),
        onSuccess: (_data, variables) => invalidate(variables.menuId),
    });
}
