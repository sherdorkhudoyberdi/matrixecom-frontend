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
import { formatNumber, formatPrice } from '@/lib/format'

const REPORT_TABS = [
  { key: 'sales', label: 'Sales', fn: reportsApi.adminReportsSales },
  { key: 'products', label: 'Products', fn: reportsApi.adminReportsProducts },
  { key: 'orders', label: 'Orders', fn: reportsApi.adminReportsOrders },
  { key: 'customers', label: 'Customers', fn: reportsApi.adminReportsCustomers },
  { key: 'stock', label: 'Stock', fn: reportsApi.adminReportsStock },
  { key: 'reviews', label: 'Reviews', fn: reportsApi.adminReportsReviews },
  { key: 'revenue', label: 'Revenue by Category', fn: reportsApi.adminReportsRevenueByCategory },
] as const

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
  const chartData = rows.map((row) => ({
    name: String(
      row.period ??
        row.product_name ??
        row.name ??
        row.label ??
        row.category_name ??
        '—',
    ),
    revenue: Number(row.revenue ?? 0),
    orders: Number(row.orders ?? row.order_count ?? 0),
    units: Number(row.units ?? row.units_sold ?? 0),
  }))

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
          {chartData.length > 0 ? (
            <div className="h-80 rounded-2xl border border-brand-gray-100 bg-brand-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#000" radius={[4, 4, 0, 0]} />
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
