import api from './api';
export const bookingService = {
  search: (params, signal) => api.get('/bookings/search-available', { params, signal }),
  list: (params, signal) => api.get('/bookings', { params, signal }),
  get: (id, signal) => api.get('/bookings/' + id, { signal }),
  create: (data) => api.post('/bookings', data),
  cancel: (id, cancel_reason) => api.post('/bookings/' + id + '/cancel', { cancel_reason }),
};
