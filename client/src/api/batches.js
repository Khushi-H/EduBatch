import api from './axios';

export const batchApi = {
  list: (params) => api.get('/batches', { params }),
  get: (id) => api.get(`/batches/${id}`),
  create: (payload) => api.post('/batches', payload),
  update: (id, payload) => api.put(`/batches/${id}`, payload),
  changeStatus: (id, status) => api.patch(`/batches/${id}/status`, { status }),
  archive: (id) => api.delete(`/batches/${id}`),
};
