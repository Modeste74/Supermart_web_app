import { useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import CartItem from './CartItem'
import CartSummary from './CartSummary'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, itemCount } = useCart()

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            Your Cart
            {itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
            )}
          </h2>
          <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {cart.items?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pb-20">
              <span className="text-5xl mb-4">🛒</span>
              <p className="font-medium text-gray-600">Your cart is empty</p>
              <p className="text-sm mt-1">Add some items to get started</p>
            </div>
          ) : (
            cart.items?.map((item) => (
              <CartItem key={item.id} item={item} />
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items?.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            <CartSummary onCheckout={() => setCartOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}
