import api from './axios';

export const paymentApi = {
  createOrder: (enrollmentId) => api.post('/payments/create-order', { enrollmentId }),
  verify: (payload) => api.post('/payments/verify', payload),
  history: () => api.get('/payments/history'),
  receipt: (paymentId) => api.get(`/payments/${paymentId}/receipt`, { responseType: 'blob' }),
};