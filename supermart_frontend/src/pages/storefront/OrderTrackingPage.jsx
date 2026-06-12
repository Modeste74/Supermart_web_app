import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../components/layout/Navbar'
import { trackOrder } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

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

const STATUS_ICONS = {
  pending: '⏳',
  confirmed: '✅',
  processing: '📦',
  ready: '🏪',
  dispatched: '🚚',
  out_for_delivery: '🛵',
  delivered: '🎉',
  cancelled: '❌',
}

const DELIVERY_STEPS = ['pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered']
const PICKUP_STEPS = ['pending', 'confirmed', 'processing', 'ready', 'delivered']

export default function OrderTrackingPage() {
  const { orderNumber: paramOrderNumber } = useParams()
  const navigate = useNavigate()
  const [input, setInput] = useState(paramOrderNumber || '')
  const [search, setSearch] = useState(paramOrderNumber || '')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['track', search],
    queryFn: () => trackOrder(search),
    enabled: !!search,
    retry: false,
  })

  const order = data?.data
  const steps = order?.fulfilment_type === 'pickup' ? PICKUP_STEPS : DELIVERY_STEPS
  const currentIndex = order ? steps.indexOf(order.status) : -1

  const handleSearch = (e) => {
    e.preventDefault()
    if (input.trim()) {
      setSearch(input.trim())
      navigate(`/track/${input.trim()}`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Track Your Order</h1>
        <p className="text-gray-400 text-sm mb-6">Enter your order number to see the latest status.</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. SM-2024-01234"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="bg-primary text-white font-semibold px-5 py-3 rounded-xl hover:bg-primary-dark transition text-sm"
          >
            Track
          </button>
        </form>

        {isLoading && (
          <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            Order not found. Please check your order number and try again.
          </div>
        )}

        {order && (
          <div className="space-y-4">
            {/* Status badge */}
            <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
              <span className="text-4xl">{STATUS_ICONS[order.status] ?? '📦'}</span>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{order.order_number}</p>
                <p className="text-lg font-bold text-gray-800 mt-0.5">{STATUS_LABELS[order.status] ?? order.status}</p>
                {order.delivery_zone && (
                  <p className="text-xs text-gray-400 mt-0.5">{order.delivery_zone.estimated_days}</p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {order.status !== 'cancelled' && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center">
                  {steps.map((s, i) => {
                    const reached = currentIndex >= i
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${reached ? 'bg-primary' : 'bg-gray-200'}`}
                        />
                        {i < steps.length - 1 && (
                          <div className={`flex-1 h-0.5 ${reached && currentIndex > i ? 'bg-primary' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  {steps.map((s) => (
                    <span key={s} className="text-xs text-gray-400 text-center" style={{ flex: 1 }}>
                      {STATUS_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Items summary */}
            <div className="bg-white rounded-2xl shadow-sm p-5 text-sm">
              <h3 className="font-semibold text-gray-700 mb-3">Items</h3>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-gray-600">
                    <span>{item.product_name_snapshot} ({item.variant_label_snapshot}) × {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
