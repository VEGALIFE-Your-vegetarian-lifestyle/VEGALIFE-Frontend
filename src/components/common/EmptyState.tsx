import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="mb-4 h-16 w-16 text-muted-foreground" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-semibold text-dark">{title}</h3>
            <p className="mb-6 max-w-sm text-muted-foreground">{description}</p>
            {action}
        </div>
    );
}