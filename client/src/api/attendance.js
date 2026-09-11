import api from './axios';

export const attendanceApi = {
  mark: (payload) => api.post('/attendance', payload),
  ofBatch: (batchId) => api.get(`/attendance/batch/${batchId}`),
  my: () => api.get('/attendance/my'),
};
