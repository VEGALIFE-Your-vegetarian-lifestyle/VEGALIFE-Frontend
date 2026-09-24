import { HoldingsTable } from '@/components/holdings/HoldingsTable'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

export function PortfolioHoldingsPage() {
  return (
    <PagePlaceholder
      title="Portfolio & Holdings"
      description="Portfolio allocation and holding breakdown placeholders."
    >
      <HoldingsTable />
    </PagePlaceholder>
  )
}
