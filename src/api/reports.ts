import { callMethod } from '@/api/client'
import type { ReportParams, ReportRow } from '@/types/api'

interface ReportResponse {
  items?: ReportRow[]
  rows?: ReportRow[]
  count?: number
  summary?: Record<string, unknown>
  from?: string
  to?: string
}

function normalizeReportResponse(data: ReportResponse) {
  return {
    ...data,
    rows: data.items ?? data.rows ?? [],
  }
}

async function reportMethod(method: string, params: ReportParams = {}) {
  const data = await callMethod<ReportResponse>(method, {
    from: params.date_from,
    to: params.date_to,
    period: params.period,
    limit: params.limit,
  })
  return normalizeReportResponse(data)
}

export const adminReportsSales = (params?: ReportParams) =>
  reportMethod('admin_reports_sales', params)

export const adminReportsProducts = (params?: ReportParams) =>
  reportMethod('admin_reports_products', params)

export const adminReportsVariations = (params?: ReportParams) =>
  reportMethod('admin_reports_variations', params)

export const adminReportsCustomers = (params?: ReportParams) =>
  reportMethod('admin_reports_customers', params)

export const adminReportsOrders = (params?: ReportParams) =>
  reportMethod('admin_reports_orders', params)

export const adminReportsStock = (params?: ReportParams) =>
  reportMethod('admin_reports_stock', params)

export const adminReportsRevenueByCategory = (params?: ReportParams) =>
  reportMethod('admin_reports_revenue_by_category', params)

export const adminReportsReviews = (params?: ReportParams) =>
  reportMethod('admin_reports_reviews', params)
