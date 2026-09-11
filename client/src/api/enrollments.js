import api from './axios';

export const enrollmentApi = {
  enroll: (studentId, batchId) => api.post('/enrollments', { studentId, batchId }),
  remove: (id) => api.delete(`/enrollments/${id}`),
  my: () => api.get('/enrollments/my'),
  ofBatch: (batchId) => api.get(`/enrollments/batch/${batchId}`),
};
