import { api } from './api';

export const webService = {
  getAll:        ()           => api.get('/webs').then(d => d.webs),
  getById:       (id)         => api.get(`/webs/${id}`).then(d => d.web),
  create:        (data)       => api.post('/webs', data).then(d => d.web),
  update:        (id, data)   => api.put(`/webs/${id}`, data).then(d => d.web),
  delete:        (id)         => api.delete(`/webs/${id}`),
  toggleFavorite:(id)         => api.patch(`/webs/${id}/favorite`).then(d => d.web),
  migrate:       (webs)       => api.post('/webs/migrate', { webs }),
};
