import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../../api/admin'
import { formatPrice } from '../../utils/formatters'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({ label, value, color, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {loading ? (
        <div className="h-7 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000,
  })

  const d = data?.data

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenue Today" value={formatPrice(d?.revenue?.today ?? 0)} color="text-green-600" loading={isLoading} />
        <StatCard label="Last 7 Days" value={formatPrice(d?.revenue?.last_7_days ?? 0)} color="text-blue-600" loading={isLoading} />
        <StatCard label="Last 30 Days" value={formatPrice(d?.revenue?.last_30_days ?? 0)} color="text-primary" loading={isLoading} />
        <StatCard label="All Time" value={formatPrice(d?.revenue?.all_time ?? 0)} color="text-gray-800" loading={isLoading} />
      </div>

      {/* Order counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'processing', label: 'Processing' },
          { key: 'out_for_delivery', label: 'Out for Delivery' },
          { key: 'delivered', label: 'Delivered' },
        ].map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400">{label}</p>
            {isLoading ? (
              <div className="h-6 w-10 bg-gray-100 rounded mt-1 animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-gray-800 mt-1">{d?.orders?.[key] ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline">View all</Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : d?.recent_orders?.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No orders yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {d?.recent_orders?.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-gray-800 hover:text-primary font-mono"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {order.customer_name} · {order.item_count} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-xs text-primary hover:underline">Inventory</Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : d?.inventory?.out_of_stock_count === 0 && d?.inventory?.low_stock_items?.length === 0 ? (
            <p className="text-sm text-gray-400">All stock levels OK.</p>
          ) : (
            <>
              {d?.inventory?.out_of_stock_count > 0 && (
                <div className="bg-red-50 rounded-xl px-3 py-2 mb-3 text-xs font-medium text-red-700">
                  {d.inventory.out_of_stock_count} variant(s) out of stock
                </div>
              )}
              <div className="space-y-3">
                {d?.inventory?.low_stock_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-medium text-gray-700">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.variant_label}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {item.stock_qty} left
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
