import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PostComposerDialog } from "@/features/posts/components/composer/PostComposerDialog";
import { MealPlanComposerDialog } from "@/features/menus/components/MealPlanComposerDialog";
import { RecipeComposerDialog } from "@/features/recipes/components/RecipeComposerDialog";

export function Layout() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 bg-background">
                <Outlet />
            </main>
            <Footer />
            {/* Mount một lần cho cả app — mở/đóng qua `useUiStore`. */}
            <PostComposerDialog />
            <MealPlanComposerDialog />
            <RecipeComposerDialog />
        </div>
    );
}
