import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/app/layout/Layout";
import { AdminShell } from "@/features/admin/AdminShell";
import { AdminRoute } from "@/app/guards/AdminRoute";
import { ProtectedRoute } from "@/app/guards/ProtectedRoute";
import { PublicRoute } from "@/app/guards/PublicRoute";
import CategoriesPage from "@/features/categories/CategoriesPage";
import PostsPage from "@/features/admin/pages/PostsPage/PostsPage";
import UsersPage from "@/features/admin/pages/UsersPage/UsersPage";
import VideosPage from "@/features/videos/VideosPage";
import AdminDashboardPage from "@/features/admin/pages/AdminDashboardPage/AdminDashboardPage";
import AiNutritionPage from "@/features/nutrition-ai/AiNutritionPage";
import CreatePostPage from "@/features/posts/pages/CreatePostPage/CreatePostPage";
import ExplorePage from "@/features/posts/pages/ExplorePage/ExplorePage";
import LocationsPage from "@/features/locations/pages/AdminLocationsPage/LocationsPage";
import LocationDetailPage from "@/features/locations/pages/LocationDetailPage";
import NearbyPage from "@/features/locations/pages/NearbyPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage/RegisterPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage/VerifyEmailPage";
import HomePage from "@/features/posts/pages/HomePage/HomePage";
import MyPostsPage from "@/features/posts/pages/MyPostsPage/MyPostsPage";
import NotFoundPage from "@/app/NotFoundPage";
import PostDetailPage from "@/features/posts/pages/PostDetailPage/PostDetailPage";
import ProfilePage from "@/features/profile/ProfilePage";
import PaymentResultPage from "@/features/subscription/pages/PaymentResultPage/PaymentResultPage";
import SubscriptionPage from "@/features/subscription/pages/SubscriptionPage/SubscriptionPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/nearby" element={<NearbyPage />} />
                <Route path="/nearby/:id" element={<LocationDetailPage />} />
                <Route path="/ai-nutrition" element={<AiNutritionPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route
                    path="/payment/result/:paymentId"
                    element={
                        <ProtectedRoute>
                            <PaymentResultPage />
                        </ProtectedRoute>
                    }
                />
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
                <Route path="locations" element={<LocationsPage />} />
                <Route path="profile" element={<ProfilePage embedded />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
