import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSalesReport } from '../../api/admin'
import { formatPrice } from '../../utils/formatters'

const toISO = (d) => d.toISOString().slice(0, 10)
const today = () => toISO(new Date())
const daysAgo = (n) => toISO(new Date(Date.now() - n * 86400000))

export default function SalesReportPage() {
  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo, setDateTo] = useState(today())

  const { data, isLoading } = useQuery({
    queryKey: ['sales-report', dateFrom, dateTo],
    queryFn: () => getSalesReport({ date_from: dateFrom, date_to: dateTo }),
  })

  const report = data?.data

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales Report</h1>

      {/* Date controls */}
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-white rounded-2xl shadow-sm p-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              onClick={() => { setDateFrom(daysAgo(n)); setDateTo(today()) }}
              className="text-xs text-gray-500 hover:text-primary border border-gray-200 rounded-lg px-3 py-2 hover:border-primary transition"
            >
              Last {n}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Total Revenue (paid orders)</p>
          {isLoading ? (
            <div className="h-7 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-primary">{formatPrice(report?.total_revenue ?? 0)}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Paid Orders</p>
          {isLoading ? (
            <div className="h-7 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-800">{report?.total_orders ?? 0}</p>
          )}
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Daily Breakdown</h2>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !report?.daily?.length ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No paid orders in this date range.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Avg. Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.daily.map((row) => (
                <tr key={row.date} className="hover:bg-cream transition">
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {new Date(row.date + 'T12:00:00').toLocaleDateString('en-KE', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.orders}</td>
                  <td className="px-5 py-3 font-semibold text-primary">{formatPrice(row.revenue)}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatPrice(row.orders > 0 ? row.revenue / row.orders : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr className="font-semibold text-gray-700">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3">{report.total_orders}</td>
                <td className="px-5 py-3 text-primary">{formatPrice(report.total_revenue)}</td>
                <td className="px-5 py-3 text-gray-500">
                  {formatPrice(report.total_orders > 0 ? report.total_revenue / report.total_orders : 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
