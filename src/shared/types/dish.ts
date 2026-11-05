/** `GET /api/dishes` — shape đầy đủ backend trả (khác `Dish` ở `features/menus/types.ts`,
 * bên đó là subset dùng để render menu đã lưu). */
export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
    createdAt: string;
}
