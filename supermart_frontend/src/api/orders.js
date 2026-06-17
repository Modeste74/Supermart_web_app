import api from './axios'

export const getDeliveryZones = () => api.get('/delivery-zones/')

export const placeOrder = (data) => api.post('/orders/', data)

export const getOrderHistory = () => api.get('/orders/history/')

export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}/`)

export const trackOrder = (orderNumber) => api.get(`/track/${orderNumber}/`)

// Admin
export const getAdminOrders = (params) => api.get('/admin/orders/', { params })

export const getAdminOrder = (id) => api.get(`/admin/orders/${id}/`)

export const updateOrderStatus = (id, data) => api.put(`/admin/orders/${id}/status/`, data)

export const updateOrderPaymentStatus = (id, payment_status) =>
  api.put(`/admin/orders/${id}/payment-status/`, { payment_status })

// Delivery
export const getDeliveryOrders = () => api.get('/delivery/orders/')
export const getDeliveryOrder = (id) => api.get(`/delivery/orders/${id}/`)

export const updateDeliveryOrderStatus = (id, data) =>
  api.put(`/delivery/orders/${id}/status/`, data)
