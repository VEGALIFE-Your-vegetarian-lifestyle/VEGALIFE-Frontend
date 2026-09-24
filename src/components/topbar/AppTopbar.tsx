import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function AppTopbar({ title }: { title: string }) {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
      return
    }
    setTheme('dark')
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3 dark:border-slate-800">
      <h1 className="text-lg font-semibold">{title}</h1>
      <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        Theme
      </Button>
    </header>
  )
}
