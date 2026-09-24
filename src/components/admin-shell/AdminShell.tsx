import { ShieldCheck } from 'lucide-react'

export function AdminShell() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <ShieldCheck className="h-4 w-4" />
      Admin workspace
    </div>
  )
}
