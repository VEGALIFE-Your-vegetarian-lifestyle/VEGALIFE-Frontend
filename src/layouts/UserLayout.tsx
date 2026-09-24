import { Link, Outlet } from 'react-router-dom'
import { AppTopbar } from '@/components/topbar/AppTopbar'

export function UserLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopbar title="Stock AI Analysis" />
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 space-y-2 md:block">
          <nav className="space-y-2 text-sm">
            <Link className="block" to="/dashboard">
              Dashboard
            </Link>
            <Link className="block" to="/stocks">
              Stocks
            </Link>
            <Link className="block" to="/analysis">
              Analysis
            </Link>
            <Link className="block" to="/watchlist">
              Watchlist
            </Link>
            <Link className="block" to="/portfolio">
              Portfolio
            </Link>
            <Link className="block" to="/profile">
              Profile
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
