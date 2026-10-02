import api from './api';
export const roomService = {
  board: (date, signal) => api.get('/rooms/board', { params: { date }, signal }),
  dirty: (signal) => api.get('/rooms/dirty-rooms', { signal }),
  clean: (id) => api.post('/rooms/' + id + '/finish-cleaning'),
  maintenance: (params, signal) => api.get('/rooms/maintenance', { params, signal }),
  createMaintenance: (data) => api.post('/rooms/maintenance', data),
  cancelMaintenance: (id) => api.post('/rooms/maintenance/' + id + '/cancel'),
};
