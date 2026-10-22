import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { AdminRecipe } from "@/types/recipe";

// Mock service để test không phụ thuộc backend thật.
const { getAdminRecipes } = vi.hoisted(() => ({ getAdminRecipes: vi.fn() }));
vi.mock("@/services/recipeService", () => ({ getAdminRecipes }));

import RecipesPage from "@/pages/Admin/RecipesPage/RecipesPage";

const recipe = (patch: Partial<AdminRecipe>): AdminRecipe => ({
    id: "r1",
    userId: "u1",
    dishId: "d1",
    dishName: "cashew pasta",
    name: "Creamy cashew pasta",
    description: null,
    instructions: "Boil. Blend.",
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    difficulty: null,
    ingredients: [{ ingredientId: "i1", name: "cashews", amount: 100, unit: "g" }],
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    status: "ACTIVE",
    categoryIds: [],
    username: "minh",
    email: "minh@example.com",
    ...patch,
});

const page = (data: AdminRecipe[]) => ({ data, total: data.length, page: 1, size: 8, totalPages: 1 });

beforeEach(() => {
    getAdminRecipes.mockReset();
});

describe("RecipesPage — #24", () => {
    it("hiện công thức kèm món và chủ sở hữu", async () => {
        getAdminRecipes.mockResolvedValue(page([recipe({})]));
        renderWithProviders(<RecipesPage />);

        expect(await screen.findByText("Creamy cashew pasta")).toBeInTheDocument();
        expect(screen.getByText("cashew pasta")).toBeInTheDocument();
        expect(screen.getByText("minh")).toBeInTheDocument();
        expect(screen.getByText("minh@example.com")).toBeInTheDocument();
    });

    it("lọc theo trạng thái ở client — BE không có tham số status", async () => {
        const user = userEvent.setup();
        getAdminRecipes.mockResolvedValue(
            page([
                recipe({ id: "r1", name: "Active one" }),
                recipe({ id: "r2", name: "Retired one", status: "DELETED" }),
            ]),
        );
        renderWithProviders(<RecipesPage />);

        expect(await screen.findByText("Active one")).toBeInTheDocument();
        expect(screen.getByText("Retired one")).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText("Filter by status"), "DELETED");

        expect(screen.queryByText("Active one")).not.toBeInTheDocument();
        expect(screen.getByText("Retired one")).toBeInTheDocument();
    });

    it("hiện ErrorState khi API lỗi", async () => {
        getAdminRecipes.mockRejectedValue(new Error("boom"));
        renderWithProviders(<RecipesPage />);

        expect(await screen.findByRole("button", { name: "Try again" })).toBeInTheDocument();
    });
});
