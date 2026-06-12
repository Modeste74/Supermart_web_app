import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../components/layout/Navbar'
import { getOrderHistory } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  ready: 'bg-teal-100 text-teal-700',
  dispatched: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Being Packed',
  ready: 'Ready for Pickup',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrderHistory,
  })

  const orders = data?.data?.results ?? data?.data ?? []

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 h-24" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-5xl block mb-4">📦</span>
            <p className="font-medium text-gray-600 mb-2">No orders yet</p>
            <Link to="/shop" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition text-sm mt-4">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.order_number}`}
                className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-primary">{order.order_number}</p>
                    {order.first_item && (
                      <p className="text-sm text-gray-600 mt-0.5 truncate max-w-xs">
                        {order.first_item.name}
                        {order.item_count > 1 && (
                          <span className="text-gray-400"> +{order.item_count - 1} more</span>
                        )}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">{formatPrice(order.total)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
