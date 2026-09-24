import { useQuery } from '@tanstack/react-query'
import { holdingsService } from '@/services/holdings.service'

export function usePortfolioAnalysis() {
  return useQuery({
    queryKey: ['portfolio-analysis'],
    queryFn: () => holdingsService.list(),
    enabled: false,
  })
}
