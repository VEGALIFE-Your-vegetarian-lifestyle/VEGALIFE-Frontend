import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
    return (
        <div className="mx-auto max-w-7xl px-4 py-16">
            <EmptyState
                icon={SearchX}
                title="Không tìm thấy trang"
                description="Trang bạn tìm không tồn tại hoặc đã được di chuyển."
                action={
                    <Link to="/admin/posts">
                        <Button>Về trang chủ</Button>
                    </Link>
                }
            />
        </div>
    );
}