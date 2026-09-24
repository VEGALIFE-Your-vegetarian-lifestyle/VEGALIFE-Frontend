import { DataFormulatorPanel } from '@/components/data-formulator/DataFormulatorPanel'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

export function CrawlJobsPage() {
  return (
    <PagePlaceholder
      title="Crawl Jobs"
      description="Monitor crawler pipeline and job execution status."
    >
      <DataFormulatorPanel />
    </PagePlaceholder>
  )
}
