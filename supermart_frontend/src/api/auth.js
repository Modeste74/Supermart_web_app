import api from './axios'

export const register = (data) => api.post('/auth/register/', data)
export const login = (data) => api.post('/auth/login/', data)
export const logout = (refresh) => api.post('/auth/logout/', { refresh })
export const refreshToken = (refresh) => api.post('/auth/token/refresh/', { refresh })
export const forgotPassword = (email) => api.post('/auth/forgot-password/', { email })
export const resetPassword = (data) => api.post('/auth/reset-password/', data)
export const getProfile = () => api.get('/account/profile/')
export const updateProfile = (data) => api.patch('/account/profile/', data)
export const getAddresses = () => api.get('/account/addresses/')
export const createAddress = (data) => api.post('/account/addresses/', data)
export const updateAddress = (id, data) => api.patch(`/account/addresses/${id}/`, data)
export const deleteAddress = (id) => api.delete(`/account/addresses/${id}/`)
