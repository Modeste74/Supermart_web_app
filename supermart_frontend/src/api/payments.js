import api from './axios'

export const initiatePayment = (orderId) =>
  api.post('/payments/initiate/', { order_id: orderId })

export const getPaymentStatus = (orderId) =>
  api.get(`/payments/${orderId}/status/`)
