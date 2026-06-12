import api from './axios'

// Public
export const getCategories = () => api.get('/categories/')
export const getProducts = (params = {}) => api.get('/products/', { params })
export const getProduct = (slug) => api.get(`/products/${slug}/`)

// Admin — products & categories
export const adminGetProducts = (params = {}) => api.get('/admin/products/', { params })
export const adminCreateProduct = (data) => api.post('/admin/products/', data)
export const adminUpdateProduct = (id, data) => api.patch(`/admin/products/${id}/`, data)
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}/`)
export const adminCreateVariant = (productId, data) => api.post(`/admin/products/${productId}/variants/`, data)
export const adminUpdateVariant = (id, data) => api.patch(`/admin/variants/${id}/`, data)
export const adminDeleteVariant = (id) => api.delete(`/admin/variants/${id}/`)
export const adminGetCategories = () => api.get('/admin/categories/')
export const adminCreateCategory = (data) => api.post('/admin/categories/', data)

// Admin — inventory
export const adminGetInventory = (params = {}) => api.get('/admin/inventory/', { params })
export const adminAdjustStock = (id, stock_qty) => api.patch(`/admin/variants/${id}/stock/`, { stock_qty })
