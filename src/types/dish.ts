/** #39 `GET /api/dishes` — autocomplete. Dish đã retire không xuất hiện. */
export interface Dish {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    cuisineType: string | null;
    createdAt: string;
}
