import api from './axios'

export const getCart = () => api.get('/cart/')
export const clearCart = () => api.delete('/cart/')
export const addToCart = (product_variant_id, quantity = 1) =>
  api.post('/cart/items/', { product_variant_id, quantity })
export const updateCartItem = (id, quantity) =>
  api.patch(`/cart/items/${id}/`, { quantity })
export const removeCartItem = (id) => api.delete(`/cart/items/${id}/`)
export const mergeCart = (session_id) => api.post('/cart/merge/', { session_id })
export const applyCoupon = (code) => api.post('/cart/apply-coupon/', { code })
