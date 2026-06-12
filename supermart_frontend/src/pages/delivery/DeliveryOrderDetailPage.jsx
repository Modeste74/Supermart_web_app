import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDeliveryOrder, updateDeliveryOrderStatus } from '../../api/orders'
import { formatPrice } from '../../utils/formatters'

const STATUS_TRANSITIONS = {
  dispatched: { next: 'out_for_delivery', label: 'Start Delivery', color: 'bg-indigo-500 hover:bg-indigo-600' },
  out_for_delivery: { next: 'delivered', label: 'Mark as Delivered', color: 'bg-green-500 hover:bg-green-600' },
}

const STATUS_COLORS = {
  dispatched: 'bg-indigo-100 text-indigo-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
}

export default function DeliveryOrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-order', id],
    queryFn: () => getDeliveryOrder(id),
  })
  const order = data?.data

  const mutation = useMutation({
    mutationFn: (status) => updateDeliveryOrderStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-order', id])
      queryClient.invalidateQueries(['delivery-orders'])
      if (order?.status !== 'out_for_delivery') return
      navigate('/delivery')
    },
    onError: (err) =>
      setError(err.response?.data?.status?.[0] ?? err.response?.data?.detail ?? 'Update failed.'),
  })

  const handleAction = () => {
    const transition = STATUS_TRANSITIONS[order?.status]
    if (!transition) return
    setError('')
    mutation.mutate(transition.next)
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-white rounded-2xl w-1/2" />
        <div className="h-28 bg-white rounded-2xl" />
        <div className="h-40 bg-white rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
        <p>Order not found.</p>
        <Link to="/delivery" className="text-primary hover:underline text-sm mt-2 block">← Back</Link>
      </div>
    )
  }

  const transition = STATUS_TRANSITIONS[order.status]
  const isDelivered = order.status === 'delivered'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/delivery" className="text-sm text-gray-400 hover:text-primary">← Orders</Link>
        <span className="font-mono font-bold text-gray-800">{order.order_number}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {order.status?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Action button */}
      {isDelivered ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-2xl mb-1">✓</p>
          <p className="font-semibold text-green-700">Delivered</p>
          <p className="text-xs text-green-500 mt-1">This order has been completed.</p>
        </div>
      ) : transition ? (
        <div className="space-y-2">
          <button
            onClick={handleAction}
            disabled={mutation.isPending}
            className={`w-full text-white font-bold py-4 rounded-2xl transition text-base disabled:opacity-50 ${transition.color}`}
          >
            {mutation.isPending ? 'Updating…' : transition.label}
          </button>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>
      ) : null}

      {/* Delivery address */}
      {order.delivery_address && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-1">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</h2>
          <p className="font-medium text-gray-800">{order.delivery_address.street}</p>
          <p className="text-gray-600">{order.delivery_address.city}, {order.delivery_address.region}</p>
          {order.delivery_zone && (
            <p className="text-xs text-gray-400 mt-1">{order.delivery_zone.name}</p>
          )}
          {order.delivery_address.latitude && order.delivery_address.longitude && (
            <a
              href={`https://www.google.com/maps?q=${order.delivery_address.latitude},${order.delivery_address.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-block mt-1"
            >
              Open in Maps →
            </a>
          )}
        </div>
      )}

      {/* Customer */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-1">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h2>
        <p className="font-medium text-gray-800">{order.customer_name}</p>
        {order.customer_phone && (
          <a
            href={`tel:${order.customer_phone}`}
            className="text-primary text-sm hover:underline"
          >
            {order.customer_phone}
          </a>
        )}
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Special Instructions</h2>
          <p className="text-sm text-amber-800">{order.special_instructions}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h2>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-2.5 flex justify-between text-sm">
              <div>
                <p className="font-medium text-gray-800">{item.product_name_snapshot}</p>
                <p className="text-xs text-gray-400">{item.variant_label_snapshot} × {item.quantity}</p>
              </div>
              <span className="text-primary font-semibold shrink-0 ml-3">{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between font-bold text-gray-800">
          <span>Total</span>
          <span className="text-primary">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Activity log */}
      {order.status_history?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Activity</h2>
          <div className="space-y-3">
            {order.status_history.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">{entry.status?.replace(/_/g, ' ')}</p>
                  {entry.note && <p className="text-xs text-gray-400">{entry.note}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(entry.created_at).toLocaleString('en-KE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
