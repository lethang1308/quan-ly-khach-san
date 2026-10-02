import api from './api';
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: (signal) => api.get('/auth/me', { signal }),
  logout: () => api.post('/auth/logout'),
  demoAccounts: () => api.get('/auth/demo-accounts'),
  quickSwitch: (role) => api.post('/auth/quick-switch', { role }),
};
