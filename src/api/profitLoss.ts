import { callMethod } from '@/api/client'
import type { ProfitLossSummary, ReportParams, ReportRow } from '@/types/api'

interface RawProfitLossResponse {
  from?: string
  to?: string
  period?: string
  summary?: {
    revenue?: number
    cost?: number
    profit?: number
    order_count?: number
    line_count?: number
  }
  breakdown?: ReportRow[]
  items?: ReportRow[]
  rows?: ReportRow[]
  total_revenue?: number
  total_cost?: number
  gross_profit?: number
  margin_percent?: number
}

function normalizeProfitLoss(data: RawProfitLossResponse): ProfitLossSummary {
  const rows = data.breakdown ?? data.items ?? data.rows ?? []
  const summary = data.summary ?? {}

  const totalRevenue = Number(summary.revenue ?? data.total_revenue ?? 0)
  const totalCost = Number(summary.cost ?? data.total_cost ?? 0)
  const grossProfit = Number(summary.profit ?? data.gross_profit ?? totalRevenue - totalCost)
  const marginPercent =
    data.margin_percent ??
    (totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0)

  return {
    total_revenue: totalRevenue,
    total_cost: totalCost,
    gross_profit: grossProfit,
    margin_percent: marginPercent,
    rows: rows.map((row) => ({
      ...row,
      gross_profit: Number(row.gross_profit ?? row.profit ?? 0),
      orders: Number(row.orders ?? row.order_count ?? 0),
    })),
  }
}

export async function adminProfitLoss(params: ReportParams = {}) {
  const data = await callMethod<RawProfitLossResponse>('admin_profit_loss', {
    from: params.date_from,
    to: params.date_to,
    period: params.period,
    limit: params.limit,
  })
  return normalizeProfitLoss(data)
}
