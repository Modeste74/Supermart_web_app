import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getDeliveryOrders } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

const STATUS_META = {
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-700' },
  dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-700' },
}

function OrderCard({ order }) {
  const meta = STATUS_META[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <Link
      to={`/delivery/orders/${order.id}`}
      className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-gray-800">{order.order_number}</p>
          <p className="text-sm text-gray-600 mt-0.5">{order.customer_name}</p>
          <p className="text-xs text-gray-400 mt-1">
            {order.item_count} item(s) · {formatPrice(order.total)}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${meta.color}`}>
          {meta.label}
        </span>
      </div>
    </Link>
  )
}

export default function DeliveryDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['delivery-orders'],
    queryFn: getDeliveryOrders,
    refetchInterval: 30000,
  })

  const orders = data?.data || []
  const active = orders.filter((o) => o.status === 'out_for_delivery')
  const queued = orders.filter((o) => o.status === 'dispatched')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
        <p>Could not load orders. Please refresh.</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <p className="text-2xl mb-2">🚚</p>
        <p className="font-semibold text-gray-700">No orders assigned</p>
        <p className="text-sm text-gray-400 mt-1">New deliveries will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">My Deliveries</h1>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
            Out for Delivery ({active.length})
          </h2>
          {active.map((o) => <OrderCard key={o.id} order={o} />)}
        </section>
      )}

      {queued.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
            Dispatched — Ready to Pick Up ({queued.length})
          </h2>
          {queued.map((o) => <OrderCard key={o.id} order={o} />)}
        </section>
      )}
    </div>
  )
}
