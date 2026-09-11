import { api } from './api';

export const seriesTotemService = {
  getAll:  ()         => api.get('/series-totem').then(d => d.series),
  create:  (data)     => api.post('/series-totem', data).then(d => d.serie),
  update:  (id, data) => api.put(`/series-totem/${id}`, data).then(d => d.serie),
  delete:  (id)       => api.delete(`/series-totem/${id}`),
  // ids na ordem em que as seções devem aparecer no totem
  salvarOrdem: (ids)  => api.put('/series-totem/ordem', { ids }),
};
