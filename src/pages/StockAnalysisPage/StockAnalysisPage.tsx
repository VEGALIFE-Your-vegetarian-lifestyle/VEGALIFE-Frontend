import { VisualizationPanel } from '@/components/visualization/VisualizationPanel'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

export function StockAnalysisPage() {
  return (
    <PagePlaceholder
      title="Stock Analysis"
      description="Charting, trend interpretation, and AI-assisted stock analysis views."
    >
      <VisualizationPanel />
    </PagePlaceholder>
  )
}
