import type { ReactNode } from "react";

interface FormFieldProps {
    label: string;
    htmlFor: string;
    required?: boolean;
    helper?: string;
    error?: string;
    /** Nội dung bên phải nhãn — bộ đếm ký tự, badge trạng thái. */
    aside?: ReactNode;
    children: ReactNode;
}

export function FormField({ label, htmlFor, required, helper, error, aside, children }: FormFieldProps) {
    return (
        <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <label htmlFor={htmlFor} className="block text-sm font-medium text-dark">
                    {label}
                    {required && <span className="text-destructive"> *</span>}
                </label>
                {aside}
            </div>
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