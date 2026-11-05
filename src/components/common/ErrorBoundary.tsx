import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center" role="alert">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
                        <AlertCircle className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-dark">Đã xảy ra sự cố khi tải trang</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {this.state.error?.message || "Vui lòng thử tải lại trang hoặc quay lại sau."}
                    </p>
                    <div className="mt-6 flex gap-3">
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            Tải lại trang
                        </Button>
                        <Button variant="outline" onClick={() => (window.location.href = "/")}>
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
