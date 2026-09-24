import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </main>
  )
}
