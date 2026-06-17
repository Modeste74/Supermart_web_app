import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../../components/layout/Navbar'
import CheckoutSteps from '../../components/checkout/CheckoutSteps'
import AddressStep from '../../components/checkout/AddressStep'
import PaymentStep from '../../components/checkout/PaymentStep'
import OrderReview from '../../components/checkout/OrderReview'
import { useCart } from '../../context/CartContext'
import { placeOrder, getDeliveryZones } from '../../api/orders'

const STEPS = ['Delivery', 'Payment', 'Review']

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, itemCount, refreshCart } = useCart()
  const [step, setStep] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState(null)
  const [appliedPromo, setAppliedPromo] = useState(null)

  const [checkoutData, setCheckoutData] = useState({
    fulfilment_type: 'delivery',
    delivery_address_id: null,
    delivery_zone_id: null,
    payment_method: '',
    special_instructions: '',
  })

  const { data: zonesRes } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: getDeliveryZones,
  })
  const zones = zonesRes?.data || []
  const selectedZone = zones.find((z) => z.id === checkoutData.delivery_zone_id) || null

  const updateData = (patch) => setCheckoutData((prev) => ({ ...prev, ...patch }))

  const handlePlace = async () => {
    setPlacing(true)
    setPlaceError(null)
    try {
      const res = await placeOrder({
        fulfilment_type: checkoutData.fulfilment_type,
        payment_method: checkoutData.payment_method,
        delivery_address_id: checkoutData.delivery_address_id || undefined,
        delivery_zone_id: checkoutData.delivery_zone_id || undefined,
        special_instructions: checkoutData.special_instructions,
        promo_code: appliedPromo?.code || undefined,
      })
      await refreshCart()
      navigate(`/checkout/success?order=${res.data.order_number}`)
    } catch (err) {
      const data = err.response?.data
      if (data?.stock) {
        setPlaceError(data.stock)
      } else if (data?.cart) {
        setPlaceError(data.cart)
      } else if (data?.detail) {
        setPlaceError(data.detail)
      } else {
        setPlaceError('Something went wrong. Please try again.')
      }
    } finally {
      setPlacing(false)
    }
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-400">
          <span className="text-5xl block mb-4">🛒</span>
          <p className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</p>
          <Link to="/shop" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition text-sm mt-4">
            Shop Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <CheckoutSteps steps={STEPS} current={step} />

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {step === 1 && (
            <AddressStep
              data={checkoutData}
              onChange={updateData}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <PaymentStep
              selected={checkoutData.payment_method}
              onSelect={(v) => updateData({ payment_method: v })}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <OrderReview
              checkoutData={{
                ...checkoutData,
                _onInstructionsChange: (v) => updateData({ special_instructions: v }),
              }}
              deliveryZone={selectedZone}
              appliedPromo={appliedPromo}
              onApplyCoupon={setAppliedPromo}
              onRemoveCoupon={() => setAppliedPromo(null)}
              onBack={() => setStep(2)}
              onPlace={handlePlace}
              placing={placing}
              placeError={placeError}
            />
          )}
        </div>
      </main>
    </div>
  )
}
