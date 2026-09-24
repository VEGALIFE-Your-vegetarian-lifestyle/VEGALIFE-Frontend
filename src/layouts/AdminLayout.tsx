import { Outlet } from 'react-router-dom'
import { AdminShell } from '@/components/admin-shell/AdminShell'
import { AppTopbar } from '@/components/topbar/AppTopbar'

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopbar title="Admin Portal" />
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
        <AdminShell />
        <Outlet />
      </div>
    </div>
  )
}
