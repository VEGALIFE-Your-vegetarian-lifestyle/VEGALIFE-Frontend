import { Fragment, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
    breadcrumb: string[];
    title: string;
    description?: string;
    action?: ReactNode;
}

export function PageHeader({ breadcrumb, title, description, action }: PageHeaderProps) {
    return (
        <header className="mb-6 space-y-3">
            <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {breadcrumb.map((item, index) => (
                        <Fragment key={item}>
                            {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                            <li aria-current={index === breadcrumb.length - 1 ? "page" : undefined}>{item}</li>
                        </Fragment>
                    ))}
                </ol>
            </nav>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold leading-tight text-dark sm:text-3xl">{title}</h1>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {action}
            </div>
        </header>
    );
}
