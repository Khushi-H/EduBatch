import api from './axios';

export const noticeApi = {
  list: (batchId) => api.get('/notices', { params: batchId ? { batchId } : {} }),
  create: (payload) => api.post('/notices', payload),
};
