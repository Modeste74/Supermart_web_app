import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminOrders } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

const STATUS_OPTIONS = [
  '', 'pending', 'confirmed', 'processing',
  'dispatched', 'out_for_delivery', 'delivered', 'cancelled',
]
const PAYMENT_OPTIONS = ['', 'unpaid', 'paid', 'refunded']

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState({
    status: '', payment_status: '', date_from: '', date_to: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: () =>
      getAdminOrders(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))),
  })

  const orders = data?.data?.results || data?.data || []
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filters.status}
          onChange={set('status')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </select>

        <select
          value={filters.payment_status}
          onChange={set('payment_status')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAYMENT_OPTIONS.map((p) => (
            <option key={p} value={p}>{p || 'All payments'}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={set('date_from')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={set('date_to')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          onClick={() => setFilters({ status: '', payment_status: '', date_from: '', date_to: '' })}
          className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2"
        >
          Clear
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No orders found</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream transition">
                    <td className="px-5 py-3">
                      <p className="font-mono text-xs font-medium text-gray-800">{o.order_number}</p>
                      <p className="text-xs text-gray-400">{o.item_count} item(s)</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-700">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.customer_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        o.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        o.payment_status === 'refunded' ? 'bg-purple-100 text-purple-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-primary">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="text-primary hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
