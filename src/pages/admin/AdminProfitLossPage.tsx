import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { adminProfitLoss } from '@/api/profitLoss'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatPercent, formatPrice } from '@/lib/format'

export function AdminProfitLossPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-profit-loss', dateFrom, dateTo, period],
    queryFn: () =>
      adminProfitLoss({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        period,
      }),
  })

  const chartData = (data?.rows ?? []).map((row) => ({
    name: String(row.period ?? '—'),
    revenue: Number(row.revenue ?? 0),
    cost: Number(row.cost ?? 0),
    profit: Number(row.gross_profit ?? Number(row.revenue ?? 0) - Number(row.cost ?? 0)),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Profit & Loss</h1>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardTitle>Revenue</CardTitle>
              <p className="mt-2 text-2xl font-bold">{formatPrice(data?.total_revenue)}</p>
            </Card>
            <Card>
              <CardTitle>Cost</CardTitle>
              <p className="mt-2 text-2xl font-bold">{formatPrice(data?.total_cost)}</p>
            </Card>
            <Card>
              <CardTitle>Gross Profit</CardTitle>
              <p className="mt-2 text-2xl font-bold">{formatPrice(data?.gross_profit)}</p>
            </Card>
            <Card>
              <CardTitle>Margin</CardTitle>
              <p className="mt-2 text-2xl font-bold">{formatPercent(data?.margin_percent)}</p>
            </Card>
          </div>

          {chartData.length > 0 ? (
            <div className="h-96 rounded-2xl border border-brand-gray-100 bg-brand-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatPrice(Number(v))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#000" name="Revenue" />
                  <Bar dataKey="cost" fill="#8b8589" name="Cost" />
                  <Bar dataKey="profit" fill="#01ab31" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-brand-gray-100 bg-brand-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-brand-gray-50">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Cost</th>
                  <th className="px-4 py-3">Profit</th>
                  <th className="px-4 py-3">Orders</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((row, i) => (
                  <tr key={i} className="border-b border-brand-gray-50">
                    <td className="px-4 py-3">{String(row.period ?? '—')}</td>
                    <td className="px-4 py-3">{formatPrice(Number(row.revenue))}</td>
                    <td className="px-4 py-3">{formatPrice(Number(row.cost))}</td>
                    <td className="px-4 py-3">
                      {formatPrice(
                        Number(row.gross_profit ?? Number(row.revenue ?? 0) - Number(row.cost ?? 0)),
                      )}
                    </td>
                    <td className="px-4 py-3">{String(row.orders ?? row.order_count ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
