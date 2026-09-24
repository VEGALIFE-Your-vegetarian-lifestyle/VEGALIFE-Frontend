import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

export function UserDashboardPage() {
  return (
    <PagePlaceholder
      title="User Dashboard"
      description="Overview of personalized stock and portfolio analytics."
    >
      <PortfolioSummary />
    </PagePlaceholder>
  )
}
