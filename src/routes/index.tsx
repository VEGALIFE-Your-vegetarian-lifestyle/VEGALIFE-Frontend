import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import CategoriesPage from "@/pages/Admin/CategoriesPage/CategoriesPage";
import PostsPage from "@/pages/Admin/PostsPage/PostsPage";
import VideosPage from "@/pages/Admin/VideosPage/VideosPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/admin/posts" replace />} />
            <Route path="/admin" element={<AdminShell />}>
                <Route index element={<Navigate to="posts" replace />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="categories" element={<CategoriesPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}