import { api } from './api';

export const produtosTotemService = {
  getAll:  ()         => api.get('/produtos-totem').then(d => d.produtos),
  getById: (id)       => api.get(`/produtos-totem/${id}`).then(d => d.produto),
  create:  (data)     => api.post('/produtos-totem', data).then(d => d.produto),
  update:  (id, data) => api.put(`/produtos-totem/${id}`, data).then(d => d.produto),
  delete:  (id)        => api.delete(`/produtos-totem/${id}`),
};
