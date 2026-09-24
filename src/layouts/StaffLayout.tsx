import { Link, Outlet } from 'react-router-dom'
import { StaffShell } from '@/components/staff-shell/StaffShell'
import { AppTopbar } from '@/components/topbar/AppTopbar'

export function StaffLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopbar title="Staff Portal" />
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6">
        <StaffShell />
        <nav className="flex gap-4 text-sm">
          <Link to="/staff/crawl-jobs">Crawl Jobs</Link>
          <Link to="/staff/data-sources">Data Sources</Link>
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
