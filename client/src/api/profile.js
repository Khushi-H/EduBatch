import api from './axios';

export const profileApi = {
  update: (payload) => api.put('/profile', payload),
  changePassword: (payload) => api.put('/profile/password', payload),
};
