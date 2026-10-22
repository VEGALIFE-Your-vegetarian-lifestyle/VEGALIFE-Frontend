import type { ReactNode } from "react";

interface FormFieldProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    helper?: string;
    error?: string;
    children: ReactNode;
}

export function FormField({ label, htmlFor, required, helper, error, children }: FormFieldProps) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-dark">
                {label}
                {required && <span className="text-destructive"> *</span>}
            </label>
            {children}
            {helper && !error && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
            {error && (
                <p role="alert" className="mt-1 text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}