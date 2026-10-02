import api from './api';
export const reportService = {
  dashboard: (signal) => api.get('/reports/dashboard', { signal }),
  revenue: (params, signal) => api.get('/reports/revenue', { params, signal }),
  occupancy: (params, signal) => api.get('/reports/occupancy', { params, signal }),
};
