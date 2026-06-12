import api from './axios'

export const getAdminDashboard = () => api.get('/admin/dashboard/')
export const getSalesReport = (params) => api.get('/admin/reports/sales/', { params })
export const getPromotions = () => api.get('/admin/promotions/')
export const createPromotion = (data) => api.post('/admin/promotions/', data)
export const updatePromotion = (id, data) => api.patch(`/admin/promotions/${id}/`, data)
export const deletePromotion = (id) => api.delete(`/admin/promotions/${id}/`)
