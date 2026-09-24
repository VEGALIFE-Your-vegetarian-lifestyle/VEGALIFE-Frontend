import * as React from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 dark:border-slate-700',
        className,
      )}
      {...props}
    />
  )
}
