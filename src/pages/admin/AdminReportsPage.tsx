import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as reportsApi from '@/api/reports'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, formatNumber, formatPrice } from '@/lib/format'
import type { ReportRow } from '@/types/api'

const REPORT_TABS = [
  { key: 'sales', label: 'Sales', fn: reportsApi.adminReportsSales },
  { key: 'products', label: 'Products', fn: reportsApi.adminReportsProducts },
  { key: 'orders', label: 'Orders', fn: reportsApi.adminReportsOrders },
  { key: 'customers', label: 'Customers', fn: reportsApi.adminReportsCustomers },
  { key: 'stock', label: 'Stock', fn: reportsApi.adminReportsStock },
  { key: 'reviews', label: 'Reviews', fn: reportsApi.adminReportsReviews },
  { key: 'revenue', label: 'Revenue by Category', fn: reportsApi.adminReportsRevenueByCategory },
] as const

type ReportTabKey = (typeof REPORT_TABS)[number]['key']

const REPORT_CHARTS: Record<
  ReportTabKey,
  {
    nameKeys: string[]
    valueKey: string
    valueLabel: string
    format: 'money' | 'number'
    maxValue?: number
  }
> = {
  sales: { nameKeys: ['period'], valueKey: 'revenue', valueLabel: 'Revenue', format: 'money' },
  products: {
    nameKeys: ['product_name'],
    valueKey: 'revenue',
    valueLabel: 'Revenue',
    format: 'money',
  },
  orders: {
    nameKeys: ['created_at', 'status', 'orders_id'],
    valueKey: 'total',
    valueLabel: 'Order total',
    format: 'money',
  },
  customers: {
    nameKeys: ['login', 'users_id'],
    valueKey: 'total_spent',
    valueLabel: 'Total spent',
    format: 'money',
  },
  stock: {
    nameKeys: ['sku', 'product_name'],
    valueKey: 'stock_quantity',
    valueLabel: 'Stock quantity',
    format: 'number',
  },
  reviews: {
    nameKeys: ['product_name', 'login'],
    valueKey: 'rating',
    valueLabel: 'Rating',
    format: 'number',
    maxValue: 5,
  },
  revenue: {
    nameKeys: ['category_name'],
    valueKey: 'revenue',
    valueLabel: 'Revenue',
    format: 'money',
  },
}

function reportRowLabel(row: ReportRow, nameKeys: string[]): string {
  for (const key of nameKeys) {
    const raw = row[key]
    if (raw == null || String(raw).trim() === '') continue

    if (key === 'created_at' || key.endsWith('_at')) {
      return formatDate(String(raw))
    }
    if (key === 'orders_id' || key === 'users_id') {
      const id = String(raw)
      return id.length > 8 ? `${key === 'orders_id' ? 'Order' : 'User'} …${id.slice(-6)}` : id
    }
    return String(raw)
  }
  return '—'
}

function buildChartData(rows: ReportRow[], tab: ReportTabKey) {
  const config = REPORT_CHARTS[tab]

  return rows
    .map((row) => ({
      name: reportRowLabel(row, config.nameKeys),
      value: Number(row[config.valueKey] ?? 0),
    }))
    .filter((point) => point.value > 0 || tab === 'reviews')
    .sort((a, b) => b.value - a.value)
    .slice(0, 25)
}

function formatChartValue(value: number, format: 'money' | 'number') {
  return format === 'money' ? formatPrice(value) : formatNumber(value)
}

export function AdminReportsPage() {
  const [tab, setTab] = useState<(typeof REPORT_TABS)[number]['key']>('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')

  const active = REPORT_TABS.find((t) => t.key === tab)!

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-report', tab, dateFrom, dateTo, period],
    queryFn: () =>
      active.fn({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        period,
      }),
  })

  const rows = data?.rows ?? []
  const chartConfig = REPORT_CHARTS[tab]
  const chartData = buildChartData(rows, tab)
  const showChart = chartData.length > 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Reports</h1>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border border-brand-gray-100 bg-brand-white p-4 sm:grid-cols-4">
        <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </Select>
        <div className="flex items-end">
          <Button onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {showChart ? (
            <div className="h-80 rounded-2xl border border-brand-gray-100 bg-brand-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={chartConfig.maxValue ? [0, chartConfig.maxValue] : ['auto', 'auto']}
                    tickFormatter={(value) =>
                      chartConfig.format === 'money'
                        ? formatNumber(Number(value))
                        : String(value)
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatChartValue(Number(value ?? 0), chartConfig.format),
                      chartConfig.valueLabel,
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    name={chartConfig.valueLabel}
                    fill="#000"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-brand-gray-50">
                <tr>
                  {rows[0]
                    ? Object.keys(rows[0]).map((key) => (
                        <th key={key} className="px-4 py-3 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))
                    : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-brand-gray-50">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-4 py-3">
                        {key.includes('revenue') || key.includes('price')
                          ? formatPrice(Number(value))
                          : typeof value === 'number'
                            ? formatNumber(value)
                            : String(value ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="p-8 text-center text-brand-gray-600">No data for this report.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
