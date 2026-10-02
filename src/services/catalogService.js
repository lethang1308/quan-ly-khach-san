import api from './api';
export const catalogService = {
  list: (resource, params = {}, signal) =>
    api.get(resource === 'staff' ? '/staff' : '/catalog/' + resource, {
      params: { per_page: 50, ...params },
      signal,
    }),
  save: (resource, data, id) => {
    const path = resource === 'staff' ? '/staff' : '/catalog/' + resource;
    return id ? api.put(path + '/' + id, data) : api.post(path, data);
  },
  deleteRate: (id) => api.delete('/catalog/rate-periods/' + id),
  all: async (resource, signal) => {
    let page = 1,
      last;
    const items = [];
    do {
      const response = await catalogService.list(resource, { per_page: 100, page }, signal);
      items.push(...response.data);
      last = response.last_page;
      page += 1;
    } while (page <= last);
    return items;
  },
};
