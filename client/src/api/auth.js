import api from './axios';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  getMe: () => api.get('/auth/me'),
  registerStaff: (payload) => api.post('/auth/register-staff', payload),
  listTeachers: () => api.get('/auth/teachers'),
  listStudents: () => api.get('/auth/students'),
  listStaff: () => api.get('/auth/staff'),
};