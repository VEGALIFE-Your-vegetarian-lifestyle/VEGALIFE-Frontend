import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  touched?: boolean
  children: ReactNode
}

export function FormField({ label, error, touched, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {touched && error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
