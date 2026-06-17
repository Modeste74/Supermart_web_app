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

function SectionTitle({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  )
}

function StatCard({ label, value, color, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
      <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
      {loading ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse mt-1" />
      ) : (
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      )}
    </div>
  )
}

function OrderCountCard({ label, value, loading, color = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
      <p className="text-xs text-gray-400 font-medium mb-2">{label}</p>
      {loading ? (
        <div className="h-8 w-12 bg-gray-100 rounded mt-1 animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
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
    <div className="p-8 max-w-7xl mx-auto space-y-10">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Store overview — refreshes every 60 seconds</p>
      </div>

      {/* Revenue */}
      <section>
        <SectionTitle>Revenue</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today" value={formatPrice(d?.revenue?.today ?? 0)} color="text-green-600" loading={isLoading} />
          <StatCard label="Last 7 Days" value={formatPrice(d?.revenue?.last_7_days ?? 0)} color="text-blue-600" loading={isLoading} />
          <StatCard label="Last 30 Days" value={formatPrice(d?.revenue?.last_30_days ?? 0)} color="text-primary" loading={isLoading} />
          <StatCard label="All Time" value={formatPrice(d?.revenue?.all_time ?? 0)} color="text-gray-800" loading={isLoading} />
        </div>
      </section>

      {/* Order counts */}
      <section>
        <SectionTitle>Orders by Status</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <OrderCountCard label="Pending" value={d?.orders?.pending} color="text-yellow-600" loading={isLoading} />
          <OrderCountCard label="Processing" value={d?.orders?.processing} color="text-purple-600" loading={isLoading} />
          <OrderCountCard label="Out for Delivery" value={d?.orders?.out_for_delivery} color="text-orange-600" loading={isLoading} />
          <OrderCountCard label="Delivered" value={d?.orders?.delivered} color="text-green-600" loading={isLoading} />
        </div>
      </section>

      {/* Recent orders + Stock alerts */}
      <section className="grid lg:grid-cols-3 gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline font-medium">
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : d?.recent_orders?.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No orders yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {d?.recent_orders?.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-primary font-mono"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {order.customer_name} · {order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {order.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Stock Alerts</h3>
            <Link to="/admin/inventory" className="text-xs text-primary hover:underline font-medium">
              Inventory →
            </Link>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : d?.inventory?.out_of_stock_count === 0 && d?.inventory?.low_stock_items?.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <p className="text-sm text-gray-500 font-medium">All stock levels OK</p>
              </div>
            ) : (
              <div className="space-y-4">
                {d?.inventory?.out_of_stock_count > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-semibold text-red-700">
                    {d.inventory.out_of_stock_count} variant{d.inventory.out_of_stock_count !== 1 ? 's' : ''} out of stock
                  </div>
                )}
                {d?.inventory?.low_stock_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1">
                    <div className="min-w-0 mr-3">
                      <p className="text-xs font-medium text-gray-700 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.variant_label}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full shrink-0">
                      {item.stock_qty} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  )
}
