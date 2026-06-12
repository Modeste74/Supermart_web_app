import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { formatPrice } from '../../utils/formatters'

export default function CartSummary({ onCheckout }) {
  const { cart, itemCount } = useCart()
  const { subtotal = 0 } = cart

  return (
    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-gray-400">
        <span>Delivery</span>
        <span>Calculated at checkout</span>
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-800">
        <span>Total</span>
        <span className="text-primary">{formatPrice(subtotal)}</span>
      </div>

      {onCheckout ? (
        <button
          onClick={onCheckout}
          disabled={itemCount === 0}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
        >
          Proceed to Checkout
        </button>
      ) : (
        <Link
          to="/checkout"
          className={`block text-center w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition ${itemCount === 0 ? 'pointer-events-none opacity-50' : ''}`}
        >
          Proceed to Checkout
        </Link>
      )}

      <Link to="/shop" className="block text-center text-sm text-primary hover:underline">
        Continue Shopping
      </Link>
    </div>
  )
}
