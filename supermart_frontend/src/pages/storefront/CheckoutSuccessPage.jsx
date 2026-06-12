import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../components/layout/Navbar'
import { getOrder } from '../../api/orders'
import { initiatePayment } from '../../api/payments'
import { formatPrice } from '../../utils/formatters'

const ONLINE_METHODS = new Set(['mobile_money', 'card'])

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

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const orderNumber = params.get('order')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrder(orderNumber),
    enabled: !!orderNumber,
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
      setPayError(err.response?.data?.detail ?? 'Could not initiate payment. Please try again.')
      setPaying(false)
    }
  }

  const needsPayment =
    order?.status === 'pending' &&
    order?.payment_status === 'unpaid' &&
    ONLINE_METHODS.has(order?.payment_method)

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-6">
          Thank you for your order. We'll keep you updated on the status.
        </p>

        {orderNumber && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-left space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Order Number</span>
              <span className="font-bold text-primary">{orderNumber}</span>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ) : order ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Status</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Total</span>
                  <span className="text-sm font-bold text-primary">{formatPrice(order.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Payment</span>
                  <span className="text-sm text-gray-700 capitalize">
                    {order.payment_method?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span className="truncate mr-2">
                        {item.product_name_snapshot}
                        <span className="text-gray-400 ml-1">({item.variant_label_snapshot})</span>
                        {' '}× {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium">{formatPrice(item.line_total)}</span>
                    </div>
                  ))}
                </div>

                {/* Pay Now banner for pending online payments */}
                {needsPayment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-amber-800">Payment required</p>
                    <p className="text-xs text-amber-600">
                      Your order is reserved for 10 minutes. Complete payment to confirm it.
                    </p>
                    {payError && <p className="text-xs text-red-500">{payError}</p>}
                    <button
                      onClick={handlePayNow}
                      disabled={paying}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-50"
                    >
                      {paying ? 'Redirecting…' : 'Pay Now →'}
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {orderNumber && (
            <Link
              to={`/account/orders/${orderNumber}`}
              className="block bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/shop"
            className="block border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-300 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  )
}
