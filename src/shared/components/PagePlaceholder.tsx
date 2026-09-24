import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface PagePlaceholderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Badge variant="outline">Placeholder</Badge>
      </div>
      <Card>
        <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
      </Card>
      {children}
    </div>
  )
}
