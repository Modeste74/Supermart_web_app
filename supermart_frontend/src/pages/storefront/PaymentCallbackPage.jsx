import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getPaymentStatus } from '../../api/payments'

const MAX_POLLS = 12    // 12 × 5 s = 60 s timeout
const POLL_INTERVAL = 5000

export default function PaymentCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const orderId = params.get('order_id')
  const orderNumber = params.get('order_number')
  const gatewayStatus = params.get('status')     // Flutterwave: 'successful' | 'failed' | 'cancelled'

  const [message, setMessage] = useState('Verifying your payment…')
  const [failed, setFailed] = useState(false)
  const pollCount = useRef(0)

  useEffect(() => {
    if (!orderId) {
      navigate('/', { replace: true })
      return
    }

    // If gateway already told us it failed, no need to poll
    if (gatewayStatus && gatewayStatus !== 'successful') {
      setFailed(true)
      setMessage('Payment was not completed.')
      return
    }

    const poll = async () => {
      try {
        const res = await getPaymentStatus(orderId)
        const { order_status, payment_status } = res.data

        if (payment_status === 'paid' || order_status === 'confirmed') {
          navigate(`/checkout/success?order=${orderNumber}`, { replace: true })
          return
        }

        if (order_status === 'cancelled') {
          setFailed(true)
          setMessage('Your order was cancelled because payment could not be confirmed.')
          return
        }
      } catch {
        // Transient network error — keep polling
      }

      pollCount.current += 1
      if (pollCount.current >= MAX_POLLS) {
        setFailed(true)
        setMessage('Payment verification timed out. Check your order history for the latest status.')
        return
      }

      setTimeout(poll, POLL_INTERVAL)
    }

    // Start first poll immediately
    poll()
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-sm w-full text-center space-y-4">
        {failed ? (
          <>
            <span className="text-5xl block">❌</span>
            <h2 className="text-xl font-bold text-gray-800">Payment Not Confirmed</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <div className="flex flex-col gap-2 pt-2">
              {orderNumber && (
                <a
                  href={`/account/orders/${orderNumber}`}
                  className="block bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition text-sm"
                >
                  View Order
                </a>
              )}
              <a
                href="/shop"
                className="block border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm"
              >
                Back to Shop
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">Confirming Payment</h2>
            <p className="text-sm text-gray-500">{message}</p>
            <p className="text-xs text-gray-300">Please don't close this page.</p>
          </>
        )}
      </div>
    </div>
  )
}
