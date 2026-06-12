import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../components/layout/Navbar'
import { getOrder } from '../../api/orders'
import { initiatePayment } from '../../api/payments'
import { formatPrice } from '../../utils/formatters'

const ONLINE_METHODS = new Set(['mobile_money', 'card'])

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

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered']

export default function OrderDetailPage() {
  const { orderNumber } = useParams()

  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrder(orderNumber),
  })

  const order = data?.data

  const handlePayNow = async () => {
    if (!order) return
    setPaying(true)
    setPayError('')
    try {
      const res = await initiatePayment(order.id)
      window.location.href = res.data.payment_url
    } catch (err) {
      setPayError(err.response?.data?.detail ?? 'Could not initiate payment.')
      setPaying(false)
    }
  }

  const needsPayment =
    order?.status === 'pending' &&
    order?.payment_status === 'unpaid' &&
    ONLINE_METHODS.has(order?.payment_method)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-2xl h-40" />
          <div className="bg-white rounded-2xl h-40" />
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">
          <p className="text-4xl mb-3">😕</p>
          <p>Order not found.</p>
          <Link to="/account/orders" className="mt-4 inline-block text-primary hover:underline text-sm">Back to orders</Link>
        </div>
      </div>
    )
  }

  const currentStep = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const isPickup = order.fulfilment_type === 'pickup'
  const timeline = isPickup
    ? ['pending', 'confirmed', 'processing', 'ready', 'delivered']
    : STATUS_ORDER

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/account/orders" className="text-sm text-gray-400 hover:text-primary">← Orders</Link>
          <h1 className="text-xl font-bold text-gray-800">{order.order_number}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {/* Status timeline */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Timeline</h2>
            <div className="flex items-center gap-0">
              {timeline.map((s, i) => {
                const reached = timeline.indexOf(order.status) >= i
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${reached ? 'bg-primary' : 'bg-gray-200'}`} />
                    {i < timeline.length - 1 && (
                      <div className={`flex-1 h-0.5 ${reached && timeline.indexOf(order.status) > i ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-2">
              {timeline.map((s) => (
                <span key={s} className="text-xs text-gray-400 text-center" style={{ flex: 1 }}>
                  {STATUS_LABELS[s] ?? s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pay Now banner */}
        {needsPayment && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div>
              <p className="font-semibold text-amber-800">Payment required</p>
              <p className="text-xs text-amber-600 mt-1">
                Your stock is reserved. Complete payment to confirm this order.
              </p>
            </div>
            {payError && <p className="text-xs text-red-500">{payError}</p>}
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm disabled:opacity-50"
            >
              {paying ? 'Redirecting…' : 'Pay Now →'}
            </button>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Items</h2>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.product_name_snapshot}</p>
                  <p className="text-gray-400">{item.variant_label_snapshot} × {item.quantity}</p>
                </div>
                <span className="font-bold text-primary shrink-0">{formatPrice(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 text-sm mt-2">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {parseFloat(order.delivery_fee) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Delivery</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        {order.delivery_zone && (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-sm space-y-1">
            <h2 className="font-semibold text-gray-700 mb-2">Delivery Info</h2>
            <p className="text-gray-600">{order.delivery_zone.name} · {order.delivery_zone.estimated_days}</p>
          </div>
        )}

        {/* Payment info */}
        <div className="bg-white rounded-2xl shadow-sm p-5 text-sm flex justify-between">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Payment</p>
            <p className="text-gray-500 capitalize">{order.payment_method?.replace(/_/g, ' ')}</p>
          </div>
          <span className={`self-start text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
            order.payment_status === 'refunded' ? 'bg-purple-100 text-purple-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {order.payment_status}
          </span>
        </div>

        {/* Status history */}
        {order.status_history?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity Log</h2>
            <div className="space-y-3">
              {order.status_history.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">{STATUS_LABELS[entry.status] ?? entry.status}</p>
                    {entry.note && <p className="text-gray-400 text-xs">{entry.note}</p>}
                    <p className="text-gray-300 text-xs mt-0.5">
                      {new Date(entry.created_at).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
