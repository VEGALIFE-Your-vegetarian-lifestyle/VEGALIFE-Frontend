import type { RouteObject } from 'react-router-dom'
import { AdminPage } from '@/pages/Admin/AdminPage'
import { AiReportHistoryPage } from '@/pages/AiReportHistoryPage/AiReportHistoryPage'
import { AlertsPage } from '@/pages/AlertsPage/AlertsPage'
import { ComparisonPage } from '@/pages/ComparisonPage/ComparisonPage'
import { CrawlJobsPage } from '@/pages/CrawlJobsPage/CrawlJobsPage'
import { DataSourcesPage } from '@/pages/DataSourcesPage/DataSourcesPage'
import { StockAnalysisPage } from '@/pages/StockAnalysisPage/StockAnalysisPage'
import { StockDetailPage } from '@/pages/StockDetailPage/StockDetailPage'
import { StockListPage } from '@/pages/StockListPage/StockListPage'
import { PortfolioHoldingsPage } from '@/pages/UserDashboard/PortfolioHoldingsPage'
import { UserDashboardPage } from '@/pages/UserDashboard/UserDashboardPage'
import { UserProfilePage } from '@/pages/UserProfilePage/UserProfilePage'
import { WatchlistPage } from '@/pages/WatchlistPage/WatchlistPage'

export const userLayoutRoutes: RouteObject[] = [
  { index: true, element: <UserDashboardPage /> },
  { path: 'dashboard', element: <UserDashboardPage /> },
  { path: 'stocks', element: <StockListPage /> },
  { path: 'stocks/:symbol', element: <StockDetailPage /> },
  { path: 'analysis', element: <StockAnalysisPage /> },
  { path: 'comparison', element: <ComparisonPage /> },
  { path: 'watchlist', element: <WatchlistPage /> },
  { path: 'portfolio', element: <PortfolioHoldingsPage /> },
  { path: 'reports', element: <AiReportHistoryPage /> },
  { path: 'alerts', element: <AlertsPage /> },
  { path: 'profile', element: <UserProfilePage /> },
]

export const staffLayoutRoutes: RouteObject[] = [
  { index: true, element: <CrawlJobsPage /> },
  { path: 'crawl-jobs', element: <CrawlJobsPage /> },
  { path: 'data-sources', element: <DataSourcesPage /> },
]

export const adminLayoutRoutes: RouteObject[] = [{ index: true, element: <AdminPage /> }]
