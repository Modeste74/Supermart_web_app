import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateItem,
  removeCartItem as apiRemoveItem,
  clearCart as apiClearCart,
} from '../api/cart'

const CartContext = createContext(null)

function getOrCreateSessionId() {
  let id = localStorage.getItem('cart_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('cart_session_id', id)
  }
  return id
}

export function CartProvider({ children }) {
  const [sessionId] = useState(getOrCreateSessionId)
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 })
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshCart = useCallback(async () => {
    try {
      const res = await getCart()
      setCart(res.data)
    } catch (_) {}
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = async (variantId, quantity = 1) => {
    setError(null)
    setLoading(true)
    try {
      const res = await apiAddToCart(variantId, quantity)
      setCart(res.data)
      setCartOpen(true)
      return { success: true }
    } catch (err) {
      const msg =
        err.response?.data?.quantity?.[0] ||
        err.response?.data?.product_variant_id?.[0] ||
        'Could not add item to cart.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (itemId, quantity) => {
    setError(null)
    try {
      const res = await apiUpdateItem(itemId, quantity)
      setCart(res.data)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.quantity?.[0] || 'Could not update item.'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const removeItem = async (itemId) => {
    try {
      const res = await apiRemoveItem(itemId)
      setCart(res.data)
    } catch (_) {}
  }

  const clearCart = async () => {
    try {
      const res = await apiClearCart()
      setCart(res.data)
    } catch (_) {}
  }

  const itemCount = cart.item_count || 0

  return (
    <CartContext.Provider value={{
      cart, itemCount, cartOpen, setCartOpen,
      loading, error, sessionId,
      addToCart, updateItem, removeItem, clearCart, refreshCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
