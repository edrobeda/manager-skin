import { api } from './api';

export const linkService = {
  getAll:       ()          => api.get('/links').then(d => d.links),
  getById:      (id)        => api.get(`/links/${id}`).then(d => d.link),
  create:       (data)      => api.post('/links', data).then(d => d.link),
  update:       (id, data)  => api.put(`/links/${id}`, data).then(d => d.link),
  delete:       (id)        => api.delete(`/links/${id}`),
  toggleActive: (id)        => api.patch(`/links/${id}/active`).then(d => d.link),
  reorder:      (ids)       => api.post('/links/reorder', { ids }).then(d => d.links),
  getQrInfo:    ()          => api.get('/links/qr-info'),
  getAnalytics: ()          => api.get('/links/analytics').then(d => d.acessos),
};
