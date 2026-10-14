import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AdminShell } from "@/components/admin-shell/AdminShell";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import CategoriesPage from "@/pages/Admin/CategoriesPage/CategoriesPage";
import PostsPage from "@/pages/Admin/PostsPage/PostsPage";
import UsersPage from "@/pages/Admin/UsersPage/UsersPage";
import VideosPage from "@/pages/Admin/VideosPage/VideosPage";
import AdminDashboardPage from "@/pages/Admin/AdminDashboardPage/AdminDashboardPage";
import AiNutritionPage from "@/pages/AiNutritionPage/AiNutritionPage";
import CreatePostPage from "@/pages/CreatePostPage/CreatePostPage";
import ExplorePage from "@/pages/ExplorePage/ExplorePage";
import LocationDetailPage from "@/pages/LocationDetailPage/LocationDetailPage";
import NearbyPage from "@/pages/NearbyPage/NearbyPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage/RegisterPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage/VerifyEmailPage";
import HomePage from "@/pages/HomePage/HomePage";
import MyPostsPage from "@/pages/MyPostsPage/MyPostsPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";
import PostDetailPage from "@/pages/PostDetailPage/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage/ProfilePage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/nearby" element={<NearbyPage />} />
                <Route path="/nearby/:id" element={<LocationDetailPage />} />
                <Route path="/ai-nutrition" element={<AiNutritionPage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route
                    path="/posts/create"
                    element={
                        <ProtectedRoute>
                            <CreatePostPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/posts/:id/edit"
                    element={
                        <ProtectedRoute>
                            <CreatePostPage />
                        </ProtectedRoute>
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
                    path="/my-posts"
                    element={
                        <ProtectedRoute>
                            <MyPostsPage />
                        </ProtectedRoute>
                    }
                />
            </Route>

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
                path="/verify-email"
                element={
                    <PublicRoute>
                        <VerifyEmailPage />
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
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminShell />
                    </AdminRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="posts" element={<PostsPage />} />
                <Route path="videos" element={<VideosPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="profile" element={<ProfilePage embedded />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
