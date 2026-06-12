import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import CartItem from '../../components/cart/CartItem'
import CartSummary from '../../components/cart/CartSummary'
import { useCart } from '../../context/CartContext'

export default function CartPage() {
  const { cart, itemCount, clearCart } = useCart()

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
          {itemCount > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-400 hover:underline"
            >
              Clear cart
            </button>
          )}
        </div>

        {itemCount === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-6xl block mb-4">🛒</span>
            <p className="text-xl font-medium text-gray-600 mb-2">Your cart is empty</p>
            <p className="text-sm mb-6">Looks like you haven't added anything yet.</p>
            <Link to="/shop" className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              {cart.items?.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div>
              <CartSummary />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
