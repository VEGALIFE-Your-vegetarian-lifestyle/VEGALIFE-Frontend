import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import CategoriesPage from "@/pages/Admin/CategoriesPage/CategoriesPage";
import PostsPage from "@/pages/Admin/PostsPage/PostsPage";
import UsersPage from "@/pages/Admin/UsersPage/UsersPage";
import VideosPage from "@/pages/Admin/VideosPage/VideosPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage/ProfilePage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/forgot-password"
                element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                }
            />

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminShell />
                    </AdminRoute>
                }
            >
                <Route index element={<Navigate to="posts" replace />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="users" element={<UsersPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
