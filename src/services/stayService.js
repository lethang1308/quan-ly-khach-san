import api from './api';
export const stayService = {
  checkIn: (id) => api.post('/bookings/' + id + '/check-in'),
  service: (id, data) => api.post('/booking-rooms/' + id + '/services', data),
  preview: (id, signal) => api.get('/bookings/' + id + '/checkout-preview', { signal }),
  checkOut: (id, data) => api.post('/bookings/' + id + '/check-out', data),
  invoice: (id, signal) => api.get('/invoices/' + id + '/print', { signal }),
};
