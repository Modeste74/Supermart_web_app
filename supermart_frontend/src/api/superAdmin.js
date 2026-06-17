import api from './axios'

export const getSuperAdminAnalytics = () => api.get('/super-admin/analytics/')
export const getSuperAdminUsers = (params = {}) => api.get('/super-admin/users/', { params })
export const updateSuperAdminUser = (id, data) => api.patch(`/super-admin/users/${id}/`, data)
export const getSuperAdminSettings = () => api.get('/super-admin/settings/')
export const updateSuperAdminSettings = (data) => api.put('/super-admin/settings/', data)
