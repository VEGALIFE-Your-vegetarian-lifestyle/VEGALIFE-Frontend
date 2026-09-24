import { useParams } from 'react-router-dom'
import { PagePlaceholder } from '@/shared/components/PagePlaceholder'

export function StockDetailPage() {
  const { symbol } = useParams()
  return (
    <PagePlaceholder
      title="Stock Detail"
      description={`Detailed stock information for ${symbol ?? 'selected symbol'}.`}
    />
  )
}
