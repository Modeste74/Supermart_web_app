import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'

const METHOD_LABELS = {
  mobile_money: 'Mobile Money',
  card: 'Card',
  cash_on_delivery: 'Cash on Delivery',
  pay_in_store: 'Pay in Store',
}

export default function OrderReview({ checkoutData, deliveryZone, onBack, onPlace, placing, placeError }) {
  const { cart } = useCart()
  const deliveryFee = deliveryZone?.delivery_fee ?? 0
  const subtotal = cart.subtotal ?? 0
  const total = parseFloat(subtotal) + parseFloat(deliveryFee)

  return (
    <div className="space-y-6">
      {/* Items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h3>
        <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
          {cart.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.product_variant.thumbnail ? (
                <img
                  src={item.product_variant.thumbnail}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover bg-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg">🛒</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.product_variant.product_name}</p>
                <p className="text-xs text-gray-400">{item.product_variant.variant_label} × {item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-primary shrink-0">{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span>{checkoutData.fulfilment_type === 'pickup' ? 'Free (Pickup)' : formatPrice(deliveryFee)}</span>
        </div>
        {deliveryZone && (
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Zone: {deliveryZone.name}</span>
            <span>{deliveryZone.estimated_days}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
          <span>Total</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
        <span className="text-gray-600">Payment</span>
        <span className="font-semibold text-gray-800">{METHOD_LABELS[checkoutData.payment_method]}</span>
      </div>

      {/* Special instructions */}
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1">
          Special Instructions <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={checkoutData.special_instructions || ''}
          onChange={(e) => checkoutData._onInstructionsChange?.(e.target.value)}
          placeholder="Any notes for the delivery? (gate code, landmark, etc.)"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
        />
      </div>

      {placeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {Array.isArray(placeError) ? (
            <ul className="list-disc pl-4 space-y-1">
              {placeError.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          ) : placeError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={placing}
          className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-gray-300 transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onPlace}
          disabled={placing}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
        >
          {placing ? 'Placing Order…' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
