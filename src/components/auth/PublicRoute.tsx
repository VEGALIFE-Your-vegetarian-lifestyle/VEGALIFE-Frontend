import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
    children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
    const { isAuthenticated, isAdmin } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />;
    }

    return <>{children}</>;
}
